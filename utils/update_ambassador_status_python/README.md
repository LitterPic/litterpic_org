# Update Ambassador Status - Python Version

This is a Python conversion of the AWS Lambda function `updateAmbassadorStatusLambda`. It evaluates and updates ambassador status for LitterPic users based on their posting activity.

## Ambassador Criteria

A user qualifies for ambassador status if they meet **ALL** of the following criteria:

1. **More than 5 posts** in the last 90 days
2. **At least 1 post** in the last 30 days
3. **Not an admin user** (excludes `alek@litterpic.org` and `melanie.tolman@gmail.com`)

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Firebase Service Account Setup

Make sure your Firebase service account file is accessible:
- Default path: `../litterpic-fa0bb-key.json`
- Or update the `SERVICE_ACCOUNT_FILE` path in the script

### 3. Run the Script

#### Process All Users
```bash
python update_ambassador_status.py
```

#### Process Specific User by Email
```bash
python update_ambassador_status.py --user "user@example.com"
```

#### Using Short Flag
```bash
python update_ambassador_status.py -u "user@example.com"
```

## What the Script Does

### 1. **User Discovery**
- Processes all users or filters by specific email
- Excludes admin users from status changes

### 2. **Eligibility Check**
- Counts posts in the last 90 days
- Checks for recent activity (last 30 days)
- Determines if user meets ambassador criteria

### 3. **Status Updates**
- **Promotes** users who meet criteria but aren't ambassadors
- **Demotes** users who don't meet criteria but are currently ambassadors
- **Maintains** status for users who don't need changes

### 4. **Firestore Updates**
- Updates `ambassador` field (true/false)
- Sets `ambassador_date` to last post date (for promotions)
- Sets `ambassador_date` to null (for demotions)

## Logging

The script provides detailed logging:

### Console Output
- Real-time progress updates
- Summary statistics
- Error messages

### Log File (`update_ambassador_status.log`)
- Detailed operation logs
- Individual user processing results
- Error traces for debugging

### Log Levels
- **INFO**: General progress and summary
- **DEBUG**: Detailed user-by-user processing
- **ERROR**: Failures and exceptions

## Output Statistics

The script provides a summary with counts for:

- **promoted**: Users newly granted ambassador status
- **demoted**: Users who lost ambassador status
- **no_change**: Users whose status remained the same
- **skipped_admin**: Admin users excluded from processing
- **error**: Users that couldn't be processed due to errors

## Configuration

### Customizable Settings

```python
# Time periods (in days)
NINETY_DAYS = 90  # Period to count total posts
THIRTY_DAYS = 30  # Period to check recent activity

# Post threshold
MIN_POSTS = 5     # Minimum posts required in 90 days

# Excluded emails
EXCLUDED_EMAILS = ['alek@litterpic.org', 'melanie.tolman@gmail.com']
```

## Error Handling

The script includes comprehensive error handling for:

- Firebase initialization failures
- Missing service account files
- Firestore query errors
- Individual user processing failures
- Network connectivity issues

## PyCharm Usage

1. **Open Project**: Open the directory in PyCharm
2. **Configure Interpreter**: Set up Python interpreter
3. **Install Dependencies**: Use PyCharm's package manager or terminal
4. **Run Configuration**: Create run configurations with different arguments
5. **Debug Mode**: Use PyCharm's debugger for troubleshooting

## Examples

### Check All Users
```bash
python update_ambassador_status.py
```

### Check Specific User
```bash
python update_ambassador_status.py --user "john.doe@example.com"
```

### View Help
```bash
python update_ambassador_status.py --help
```

## Original AWS Lambda Function

This Python version replicates the functionality of the original AWS Lambda function located at:
`utils/ambassador_status_aws_lambda/updateAmbassadorStatusLambda.js`

## Differences from Lambda Version

1. **Command Line Interface**: Added argument parsing for user filtering
2. **Enhanced Logging**: More detailed logging and statistics
3. **Better Error Handling**: Comprehensive exception handling
4. **Local File System**: Uses local service account file instead of AWS Secrets Manager
5. **Standalone Execution**: No AWS Lambda runtime dependencies
