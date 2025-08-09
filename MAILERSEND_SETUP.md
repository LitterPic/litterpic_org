# MailerSend Integration Setup

## Environment Variables

Add these environment variables to your `.env.local` file and Vercel environment settings:

```bash
# MailerSend API Configuration
MAILERSEND_API_KEY=mlsn.5b1c0086a153fc62e780db73e0c8e4b367fa926c25357123b36e7ce9088e14e8
MAILERSEND_FROM_EMAIL=info@litterpic.org
```

## What's Been Updated

### **1. New API Endpoint (`pages/api/sendMailerSendEmail.js`)**
- Handles MailerSend email sending
- Uses your API key and template system
- Supports personalization data

### **2. Utility Service (`utils/mailerSendService.js`)**
- Reusable functions for sending MailerSend emails
- RSVP confirmation email function
- Event creation confirmation function

### **3. Updated Volunteer Page (`pages/volunteer.js`)**
- **RSVP confirmation emails** now use MailerSend
- **Event creation emails** now use MailerSend
- Uses template ID: `pxkjn41xv7pgz781`

## Template Data Mapping

Your MailerSend template `pxkjn41xv7pgz781` expects these variables:

```javascript
{
    "eventDate": "Monday, January 15, 2024",
    "eventStartTime": "10:00 AM", 
    "eventEndTime": "12:00 PM",
    "eventLocation": "Central Park, New York"
}
```

## API Usage

### **MailerSend API Call Structure:**
```javascript
{
    "from": {
        "email": "info@litterpic.org"
    },
    "to": [
        {
            "email": "recipient@email.com"
        }
    ],
    "template_id": "pxkjn41xv7pgz781",
    "personalization": [
        {
            "email": "recipient@email.com",
            "data": {
                "eventDate": "Monday, January 15, 2024",
                "eventStartTime": "10:00 AM",
                "eventEndTime": "12:00 PM", 
                "eventLocation": "Central Park, New York"
            }
        }
    ]
}
```

## Benefits of MailerSend

✅ **Better deliverability** - Higher email delivery rates  
✅ **Advanced analytics** - Detailed email tracking  
✅ **Template management** - Easy template editing  
✅ **Cost effective** - Competitive pricing  
✅ **API reliability** - Robust email infrastructure  

## Testing

### **Local Testing:**
1. Add environment variables to `.env.local`
2. Restart development server: `npm run dev`
3. Create a test event or RSVP to an event
4. Check email delivery and template rendering

### **Production Testing:**
1. Add environment variables to Vercel dashboard
2. Deploy changes
3. Test with real email addresses
4. Verify template data is populated correctly

## Deployment

### **Vercel Environment Variables:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `MAILERSEND_API_KEY` = `mlsn.5b1c0086a153fc62e780db73e0c8e4b367fa926c25357123b36e7ce9088e14e8`
   - `MAILERSEND_FROM_EMAIL` = `info@litterpic.org`

## Migration Notes

- **From SendGrid**: RSVP emails now use MailerSend
- **Template ID**: Using your existing `pxkjn41xv7pgz781` template
- **Same functionality**: All RSVP confirmation features preserved
- **Better performance**: MailerSend typically has better delivery rates

## Troubleshooting

### **Common Issues:**
1. **API Key Invalid**: Verify the full API key is copied correctly
2. **Template Not Found**: Ensure template ID `pxkjn41xv7pgz781` exists in MailerSend
3. **From Email**: Make sure `info@litterpic.org` is verified in MailerSend
4. **Rate Limiting**: MailerSend has generous rate limits

### **Error Messages:**
- `"MailerSend API key not configured"`: Add `MAILERSEND_API_KEY` to environment
- `"Template not found"`: Check template ID in MailerSend dashboard
- `"From email not verified"`: Verify sender domain in MailerSend

Your RSVP email system is now powered by MailerSend! 🚀
