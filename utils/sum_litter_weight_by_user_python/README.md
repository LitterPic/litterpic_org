# Sum Litter Weight by User - Python Version

This is a Python conversion of the AWS Lambda function `sumLitterWeightByUser`. It calculates and updates the total litter weight for users who have made posts in the last 25 hours.

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Firebase Service Account Setup

Make sure your Firebase service account file is in the same directory as the script:
- `litterpic-fa0bb-firebase-adminsdk-j26hg-339d443f1f.json`

Or update the `SERVICE_ACCOUNT_FILE` path in the script to point to your file location.

### 3. Run the Script

```bash
python sum_litter_weight_by_user.py
```

## What the Script Does

1. **Finds Recent Users**: Identifies users who made posts in the last 25 hours
2. **Calculates Total Weight**: For each user, sums up the `litterWeight` from all their posts
3. **Updates Firestore**: Updates the user's `totalWeight` field in the `users` collection
4. **Logging**: Provides detailed logging to both console and `sum_litter_weight.log` file

## Configuration

You can modify these settings in the script:

- `hours_ago`: Change the time window for finding recent posts (default: 25 hours)
- `SERVICE_ACCOUNT_FILE`: Path to your Firebase service account JSON file
- `DATABASE_URL`: Firebase database URL (currently set to litterpic-fa0bb)

## Logging

The script creates a log file `sum_litter_weight.log` with detailed information about:
- Users processed
- Weight calculations
- Firestore updates
- Any errors encountered

## Error Handling

The script includes comprehensive error handling:
- Firebase initialization errors
- Missing service account file
- Firestore query errors
- Individual user update failures

## PyCharm Usage

1. Open this directory as a project in PyCharm
2. Configure the Python interpreter
3. Install dependencies via PyCharm's package manager or terminal
4. Run the script directly from PyCharm

## Original AWS Lambda Function

This Python version replicates the functionality of the original AWS Lambda function located at:
`utils/sum_litter_weight_by_user_lambda/`
