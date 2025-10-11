#!/usr/bin/env python3
"""
Python version of sumLitterWeightByUser Lambda function
Converts AWS Lambda function to standalone Python app for PyCharm IDE

This script:
1. Finds users who made posts in the last 25 hours
2. Calculates their total litter weight from all their posts
3. Updates their totalWeight field in Firestore
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta
import logging
import sys
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('sum_litter_weight.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Firebase configuration
SERVICE_ACCOUNT_FILE = '../litterpic-fa0bb-key.json'
DATABASE_URL = 'https://litterpic-fa0bb.firebaseio.com'


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


def get_sum_of_litter_weight(db, user_uid):
    """
    Calculate the total litter weight for a specific user
    
    Args:
        db: Firestore client
        user_uid (str): User's UID
        
    Returns:
        float: Total litter weight for the user
    """
    try:
        user_ref = db.collection('users').document(user_uid)
        
        # Query userPosts where postUser references this user
        posts_query = db.collection('userPosts').where(filter=firestore.FieldFilter('postUser', '==', user_ref))
        posts = posts_query.stream()

        total_weight = 0.0
        post_count = 0

        for post_doc in posts:
            post_data = post_doc.to_dict()
            if 'litterWeight' in post_data and post_data['litterWeight'] is not None:
                weight = float(post_data['litterWeight'])
                total_weight += weight
                post_count += 1
        
        logger.info(f"User {user_uid}: {post_count} posts, total weight: {total_weight}")
        return total_weight
        
    except Exception as e:
        logger.error(f"Error calculating weight for user {user_uid}: {e}")
        return 0.0


def get_recent_post_users(db, days_ago=180):
    """
    Get users who made posts in the last specified days

    Args:
        db: Firestore client
        days_ago (int): Number of days to look back

    Returns:
        set: Set of user IDs who made recent posts
    """
    try:
        from datetime import timezone
        cutoff_time = datetime.now(timezone.utc) - timedelta(days=days_ago)
        logger.info(f"Looking for posts since: {cutoff_time}")

        # Query recent posts using the filter method
        recent_posts_query = db.collection('userPosts').where(filter=firestore.FieldFilter('timePosted', '>=', cutoff_time))
        recent_posts = recent_posts_query.stream()

        users_to_update = set()
        post_count = 0

        for post_doc in recent_posts:
            post_count += 1
            post_data = post_doc.to_dict()
            if 'postUser' in post_data and post_data['postUser'] is not None:
                user_id = post_data['postUser'].id
                users_to_update.add(user_id)
                logger.debug(f"Found post by user: {user_id}")

        logger.info(f"Processed {post_count} recent posts")
        logger.info(f"Found {len(users_to_update)} users with recent posts")
        return users_to_update
        
    except Exception as e:
        logger.error(f"Error getting recent post users: {e}")
        return set()


def update_user_total_weight(db, user_id, total_weight):
    """
    Update a user's totalWeight field in Firestore
    
    Args:
        db: Firestore client
        user_id (str): User's UID
        total_weight (float): New total weight value
    """
    try:
        user_ref = db.collection('users').document(user_id)
        user_ref.update({'totalWeight': total_weight})
        logger.info(f"Updated user {user_id} totalWeight to {total_weight}")
        
    except Exception as e:
        logger.error(f"Error updating user {user_id}: {e}")


def main():
    """Main function to run the litter weight update process"""
    try:
        logger.info("Starting litter weight update process...")
        
        # Initialize Firebase
        db = initialize_firebase()
        
        # Get users who made posts in the last 180 days
        users_to_update = get_recent_post_users(db, days_ago=365)
        
        if not users_to_update:
            logger.info("No users found with recent posts")
            return
        
        # Update totalWeight for each user
        updated_count = 0
        for user_id in users_to_update:
            try:
                total_weight = get_sum_of_litter_weight(db, user_id)
                update_user_total_weight(db, user_id, total_weight)
                updated_count += 1
                
            except Exception as e:
                logger.error(f"Failed to update user {user_id}: {e}")
                continue
        
        logger.info(f"Successfully updated {updated_count} out of {len(users_to_update)} users")
        logger.info("Litter weight update process completed successfully")
        
    except Exception as e:
        logger.error(f"Error in main process: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
