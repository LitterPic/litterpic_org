#!/usr/bin/env python3
"""
Checks all litterWeight values in userPosts and reports any that are not integers.
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
        logging.FileHandler('find_litter_weight_type.log'),
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


def check_litter_weight_types(db):
    """
    Check all litterWeight values in userPosts and report any that are not integers.

    Args:
        db: Firestore client
    """
    posts = db.collection('users').stream()
    non_integer_count = 0
    total_count = 0

    for post_doc in posts:
        post_data = post_doc.to_dict()
        if 'totalWeight' in post_data and post_data['totalWeight'] is not None:
            total_count += 1
            value = post_data['totalWeight']
            if not isinstance(value, int):
                non_integer_count += 1
                logger.info(f"Post {post_doc.id}: litterWeight={value} is type {type(value).__name__}")

    logger.info(f"Checked {total_count} posts: {non_integer_count} have non-integer litterWeight values")


def main():
    try:
        db = initialize_firebase()
        check_litter_weight_types(db)
    except Exception as e:
        logger.error(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
