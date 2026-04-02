#!/usr/bin/env python3
"""
Returns the total weight of all litter collected across all posts in Firestore.
"""

import firebase_admin
from firebase_admin import credentials, firestore
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
            if not os.path.exists(SERVICE_ACCOUNT_FILE):
                raise FileNotFoundError(f"Service account file not found: {SERVICE_ACCOUNT_FILE}")
            cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
            firebase_admin.initialize_app(cred, {'databaseURL': DATABASE_URL})
            logger.info("Firebase Admin SDK initialized successfully")
        else:
            logger.info("Firebase Admin SDK already initialized")
        return firestore.client()
    except Exception as e:
        logger.error(f"Error initializing Firebase: {e}")
        raise


def get_total_litter_weight(db):
    """
    Calculate the total litter weight across all posts.

    Args:
        db: Firestore client

    Returns:
        int: Total litter weight across all posts
    """
    total_weight = 0
    posts = db.collection('userPosts').stream()
    for post_doc in posts:
        post_data = post_doc.to_dict()
        if 'litterWeight' in post_data and post_data['litterWeight'] is not None:
            total_weight += int(post_data['litterWeight'])
    return total_weight


def main():
    """Main function to return the total litter weight collected"""
    try:
        db = initialize_firebase()
        total_weight = get_total_litter_weight(db)
        logger.info(f"Total litter weight collected: {total_weight}")

        return total_weight
    except Exception as e:
        logger.error(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
