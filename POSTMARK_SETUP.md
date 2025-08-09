# Postmark Setup for Inappropriate Post Notifications

## 🚀 Quick Setup Guide

### **1. Create Postmark Account**
1. Go to [postmarkapp.com](https://postmarkapp.com)
2. Sign up for free account (100 emails/month free)
3. Verify your email address

### **2. Set Up Sender Signature**
1. In Postmark dashboard → **Sender Signatures**
2. Add `contact@litterpic.org` as sender
3. Verify the email address (check your email for verification)

### **3. Get API Key**
1. Go to **Servers** → Your Server → **API Tokens**
2. Copy the **Server API token**
3. Add to your environment variables

### **4. Environment Variables**
Add to your `.env.local` and Vercel:

```bash
POSTMARK_API_KEY=your_postmark_server_api_token_here
```

## 📧 How It Works

### **When Someone Reports a Post:**
1. **📊 Data stored in MailerLite** (for tracking/analytics)
2. **📧 Instant email sent via Postmark** to `contact@litterpic.org`
3. **✅ Success message** shown to reporter

### **Email You'll Receive:**
- **Subject:** `🚨 Inappropriate Post Reported - Post ID: [POST_ID]`
- **Beautiful HTML format** with:
  - Post details in organized table
  - User concern highlighted in yellow box
  - Post description highlighted in blue box
  - Clear action required notice

## 🎯 Benefits

✅ **Instant delivery** - Emails arrive within seconds  
✅ **Excellent deliverability** - 99%+ inbox rate  
✅ **Free tier** - 100 emails/month (perfect for reports)  
✅ **Simple setup** - Just add API key  
✅ **Beautiful emails** - Professional HTML formatting  
✅ **Reliable** - Enterprise-grade email infrastructure  

## 🔧 Technical Details

### **API Endpoint:** `/api/sendSimpleReportEmail`
### **Email Service:** Postmark
### **Data Storage:** MailerLite (for analytics)
### **Notification:** Postmark (for instant emails)

## 📊 Postmark Dashboard

After setup, you can:
- **Track email delivery** in Postmark dashboard
- **See open/click rates** for notifications
- **Monitor bounce rates** and delivery issues
- **View email content** and delivery logs

## 🚨 Testing

### **Test the Integration:**
1. Report a test post on your site
2. Check Postmark dashboard for delivery
3. Check your email inbox
4. Verify MailerLite has the data

### **Troubleshooting:**
- **No email received:** Check spam folder
- **API errors:** Verify API key in environment variables
- **Sender issues:** Ensure `contact@litterpic.org` is verified

## 💰 Pricing

- **Free:** 100 emails/month
- **Paid:** $1.25 per 1,000 emails
- **Perfect for:** Notification emails like inappropriate post reports

## 🔄 Migration Benefits

**Before (SendGrid):**
- ❌ Complex template system
- ❌ Higher costs
- ❌ More setup required

**After (Postmark):**
- ✅ Simple HTML emails
- ✅ Free tier sufficient
- ✅ Instant setup
- ✅ Better deliverability

Your inappropriate post reporting system now uses:
- **MailerLite** for data storage and analytics
- **Postmark** for instant email notifications

Best of both worlds! 🎉
