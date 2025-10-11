# Firebase Cloud Functions - LitterPic Automation

## 🚀 **Deployment Instructions**

### 1. **Deploy the Function**
```bash
cd functions
npm run deploy
```

Or deploy specific functions:
```bash
firebase deploy --only functions:sumLitterWeightByUser
firebase deploy --only functions:updateAmbassadorStatus
```

Or deploy both automation functions:
```bash
firebase deploy --only functions:sumLitterWeightByUser,functions:updateAmbassadorStatus
```

### 2. **Verify Deployment**
Check the Firebase Console:
- Go to [Firebase Console](https://console.firebase.google.com/)
- Select your project: `litterpic-fa0bb`
- Navigate to **Functions** section
- You should see both `sumLitterWeightByUser` and `updateAmbassadorStatus` listed

## ⏰ **Scheduling Details**

### **Current Schedules:**

#### **Sum Litter Weight Function:**
- **Frequency**: Daily
- **Time**: 2:00 AM EST (Eastern Time)
- **Cron Expression**: `0 2 * * *`

#### **Update Ambassador Status Function:**
- **Frequency**: Daily
- **Time**: 3:00 AM EST (Eastern Time, 1 hour after weight update)
- **Cron Expression**: `0 3 * * *`

### **Customize Schedule:**
To change the schedule, modify this line in `functions/index.js`:
```javascript
exports.sumLitterWeightByUser = functions.pubsub.schedule('0 2 * * *') // Change this
    .timeZone('America/New_York') // And/or this timezone
```

### **Common Cron Expressions:**
- `0 2 * * *` - Daily at 2:00 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Weekly on Sunday at midnight
- `0 1 1 * *` - Monthly on 1st at 1:00 AM

## 📊 **Function Behaviors**

### **Sum Litter Weight Function:**
1. **Processes All Users**: Every user in the database
2. **Calculates Total Weight**: Sums `litterWeight` from ALL their posts (all-time)
3. **Updates Firestore**: Sets `totalWeight` field for each user
4. **Batch Processing**: Efficiently handles large numbers of users
5. **No Double Counting**: Each run completely recalculates from scratch

### **Update Ambassador Status Function:**
1. **Processes All Users**: Checks every user in the database
2. **Applies Ambassador Criteria**:
   - More than 5 posts in last 90 days
   - At least 1 post in last 30 days
   - Excludes admin emails (case-insensitive)
3. **Updates Status**: Promotes/demotes users based on criteria
4. **Sets Ambassador Date**: Records date of last post for new ambassadors

### **Performance Features:**
- **Batch Updates**: Groups Firestore writes for efficiency
- **Error Handling**: Continues processing even if individual users fail
- **Detailed Logging**: Comprehensive logs for monitoring
- **Statistics Tracking**: Reports promotion/demotion counts

## 📝 **Monitoring & Logs**

### **View Logs:**
```bash
firebase functions:log --only sumLitterWeightByUser
```

### **In Firebase Console:**
1. Go to **Functions** → `sumLitterWeightByUser`
2. Click **Logs** tab
3. Monitor execution and any errors

### **Expected Log Output:**
```
Starting litter weight update process...
Looking for posts since: 2025-03-07T02:00:00.000Z
Found 150 users with recent posts
User abc123: 25 posts, total weight: 12.5
User def456: 18 posts, total weight: 8.3
...
Successfully updated 150 out of 150 users
Litter weight update process completed successfully
```

## 🔧 **Configuration Options**

### **Change Lookback Period:**
Modify the `daysAgo` variable in the function:
```javascript
const daysAgo = 180; // Change this number
```

### **Change Timezone:**
Update the timezone in the schedule:
``` javascript
.timeZone('America/Los_Angeles') // Pacific Time
.timeZone('UTC') // UTC time
.timeZone('Europe/London') // London time
```

## 🚨 **Troubleshooting**

### **Function Not Running:**
1. Check Firebase Console for deployment errors
2. Verify billing is enabled (Cloud Scheduler requires Blaze plan)
3. Check function logs for runtime errors

### **Permission Issues:**
The function runs with Firebase Admin privileges, so it should have full access to Firestore.

### **Performance Issues:**
- Function has 9-minute timeout limit
- If processing takes too long, consider reducing `daysAgo` or implementing pagination

## 💰 **Cost Considerations**

### **Firebase Functions Pricing:**
- **Free Tier**: 2M invocations/month, 400K GB-seconds/month
- **Daily Execution**: ~30 invocations/month (well within free tier)
- **Execution Time**: Depends on number of users (~1-5 minutes typical)

### **Firestore Operations:**
- **Reads**: One read per recent post + one read per user's all posts
- **Writes**: One write per user to update `totalWeight`
- **Estimated**: ~500-2000 operations per day (depending on user activity)

## 🔄 **Manual Execution**

### **Test the Function:**
You can manually trigger the function for testing:
```bash
firebase functions:shell
```

Then in the shell:
```javascript
sumLitterWeightByUser()
```

### **One-time Execution:**
If you need to run it immediately without waiting for the schedule:
1. Go to Firebase Console → Functions
2. Find `sumLitterWeightByUser`
3. Click **Test** button

## 📋 **Next Steps**

1. **Deploy the function**
2. **Monitor first execution** in logs
3. **Verify data updates** in Firestore
4. **Adjust schedule** if needed
5. **Set up alerts** for function failures (optional)

The function will now automatically keep all user `totalWeight` values up to date daily!
