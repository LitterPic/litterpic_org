#!/usr/bin/env python3
"""
Python version of updateAmbassadorStatusLambda function
Converts AWS Lambda function to standalone Python app for PyCharm IDE

This script:
1. Finds users based on filter criteria (all users or specific email)
2. Checks if users qualify for ambassador status based on posting activity
3. Updates ambassador status and date in Firestore

Ambassador Criteria:
- Must have more than 5 posts in the last 90 days
- Must have posted within the last 30 days
- Excludes specific admin emails
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta
import logging
import sys
import os
import argparse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('update_ambassador_status.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Firebase configuration
SERVICE_ACCOUNT_FILE = '../litterpic-fa0bb-key.json'
DATABASE_URL = 'https://litterpic-fa0bb.firebaseio.com'

# Admin emails to exclude from ambassador status updates
EXCLUDED_EMAILS = ['alek@litterpic.org', 'melanie.tolman@gmail.com']


def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        if not firebase_admin._apps:
            # Check if service account file exists
            if not os.path.exists(SERVICE_ACCOUNT_FILE):
                raise FileNotFoundError(f"Service account file not found: {SERVICE_ACCOUNT_FILE}")
            
            cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
            firebase_admin.initialize_app(cred, {
                'databaseURL': DATABASE_URL
            })
            logger.info("Firebase Admin SDK initialized successfully")
        else:
            logger.info("Firebase Admin SDK already initialized")
        
        return firestore.client()
    except Exception as e:
        logger.error(f"Error initializing Firebase: {e}")
        raise


def get_users_to_process(db, user_filter='all_users'):
    """
    Get users to process based on filter criteria
    
    Args:
        db: Firestore client
        user_filter (str): 'all_users' or specific email address
        
    Returns:
        list: List of user documents to process
    """
    try:
        if user_filter == 'all_users':
            logger.info("Processing all users")
            users_query = db.collection('users')
            users_snapshot = users_query.stream()
            users = list(users_snapshot)
        else:
            logger.info(f"Processing user with email: {user_filter}")
            user_query = db.collection('users').where(filter=firestore.FieldFilter('email', '==', user_filter))
            users_snapshot = list(user_query.stream())
            
            if not users_snapshot:
                logger.warning(f"No user found with email {user_filter}")
                return []
            
            users = users_snapshot
        
        logger.info(f"Found {len(users)} users to process")
        return users
        
    except Exception as e:
        logger.error(f"Error getting users to process: {e}")
        return []


def check_ambassador_eligibility(db, user_id):
    """
    Check if a user qualifies for ambassador status
    
    Args:
        db: Firestore client
        user_id (str): User's document ID
        
    Returns:
        tuple: (is_eligible, last_post_date)
    """
    try:
        from datetime import timezone
        current_date = datetime.now(timezone.utc)
        ninety_days_ago = current_date - timedelta(days=90)
        thirty_days_ago = current_date - timedelta(days=30)
        
        user_ref = db.collection('users').document(user_id)
        
        # Get posts from last 90 days
        posts_90_days_query = db.collection('userPosts').where(
            filter=firestore.FieldFilter('postUser', '==', user_ref)
        ).where(
            filter=firestore.FieldFilter('timePosted', '>=', ninety_days_ago)
        ).order_by('timePosted')
        
        posts_90_days = list(posts_90_days_query.stream())
        post_count = len(posts_90_days)
        
        logger.debug(f"User {user_id}: {post_count} posts in last 90 days")
        
        if post_count <= 5:
            return False, None
        
        # Check for posts in last 30 days
        posts_30_days_query = db.collection('userPosts').where(
            filter=firestore.FieldFilter('postUser', '==', user_ref)
        ).where(
            filter=firestore.FieldFilter('timePosted', '>=', thirty_days_ago)
        ).order_by('timePosted', direction=firestore.Query.DESCENDING).limit(1)
        
        posts_30_days = list(posts_30_days_query.stream())
        
        if posts_30_days:
            last_post = posts_30_days[0]
            last_post_date = last_post.to_dict()['timePosted']
            logger.debug(f"User {user_id}: Has recent post from {last_post_date}")
            return True, last_post_date
        else:
            logger.debug(f"User {user_id}: No posts in last 30 days")
            return False, None
            
    except Exception as e:
        logger.error(f"Error checking ambassador eligibility for user {user_id}: {e}")
        return False, None


def update_ambassador_status(db, user_id, is_ambassador, ambassador_date=None):
    """
    Update a user's ambassador status in Firestore
    
    Args:
        db: Firestore client
        user_id (str): User's document ID
        is_ambassador (bool): New ambassador status
        ambassador_date: Date to set as ambassador_date (or None)
    """
    try:
        user_ref = db.collection('users').document(user_id)
        
        update_data = {
            'ambassador': is_ambassador,
            'ambassador_date': ambassador_date
        }
        
        user_ref.update(update_data)
        
        status = "promoted to" if is_ambassador else "removed from"
        logger.info(f"User {user_id} {status} ambassador status")
        
    except Exception as e:
        logger.error(f"Error updating ambassador status for user {user_id}: {e}")


def process_user_ambassador_status(db, user_doc):
    """
    Process a single user's ambassador status
    
    Args:
        db: Firestore client
        user_doc: Firestore user document
        
    Returns:
        str: Status of the operation
    """
    try:
        user_id = user_doc.id
        user_data = user_doc.to_dict()
        user_email = user_data.get('email', '')
        current_ambassador_status = user_data.get('ambassador', False)
        
        # Skip excluded admin emails
        if user_email.lower() in [email.lower() for email in EXCLUDED_EMAILS]:
            logger.info(f"Skipping admin user: {user_email}")
            return "skipped_admin"
        
        # Check ambassador eligibility
        is_eligible, last_post_date = check_ambassador_eligibility(db, user_id)
        
        # Update status if needed
        if is_eligible and not current_ambassador_status:
            # Promote to ambassador
            update_ambassador_status(db, user_id, True, last_post_date)
            return "promoted"
        elif not is_eligible and current_ambassador_status:
            # Remove ambassador status
            update_ambassador_status(db, user_id, False, None)
            return "demoted"
        else:
            # No change needed
            logger.debug(f"User {user_id}: No status change needed (current: {current_ambassador_status})")
            return "no_change"
            
    except Exception as e:
        logger.error(f"Error processing user {user_doc.id}: {e}")
        return "error"


def main(user_filter='all_users'):
    """
    Main function to run the ambassador status update process
    
    Args:
        user_filter (str): 'all_users' or specific email address
    """
    try:
        logger.info("Starting ambassador status update process...")
        
        # Initialize Firebase
        db = initialize_firebase()
        
        # Get users to process
        users = get_users_to_process(db, user_filter)
        
        if not users:
            logger.info("No users found to process")
            return
        
        # Process each user
        stats = {
            'promoted': 0,
            'demoted': 0,
            'no_change': 0,
            'skipped_admin': 0,
            'error': 0
        }
        
        for user_doc in users:
            result = process_user_ambassador_status(db, user_doc)
            stats[result] += 1
        
        # Log summary
        logger.info("Ambassador status update process completed")
        logger.info(f"Summary: {stats}")
        
    except Exception as e:
        logger.error(f"Error in main process: {e}")
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Update ambassador status for LitterPic users')
    parser.add_argument('--user', '-u', default='all_users', 
                       help='User filter: "all_users" or specific email address')
    
    args = parser.parse_args()
    main(args.user)
