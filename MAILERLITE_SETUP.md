# MailerLite Integration Setup

## Environment Variables

Add these environment variables to your `.env.local` file and Vercel environment settings:

```bash
# MailerLite API Configuration
MAILERLITE_API_KEY=your_mailerlite_api_key_here
MAILERLITE_GROUP_ID=your_group_id_here  # Optional: specific list/group ID
```

## Getting Your MailerLite API Key

1. **Log in to MailerLite**: Go to https://www.mailerlite.com/
2. **Navigate to Integrations**: Go to Settings → Integrations → API
3. **Generate API Key**: Create a new API key or use an existing one
4. **Copy the API Key**: It should start with `Bearer` or be a long string

## Getting Your Group ID (Optional)

1. **Go to Subscribers**: In your MailerLite dashboard
2. **Select a Group**: Choose the group/list you want to add subscribers to
3. **Check URL**: The group ID will be in the URL (e.g., `/groups/123456`)
4. **Use the ID**: Add it to your environment variables

## API Endpoints Used

- **Add Subscriber**: `POST https://connect.mailerlite.com/api/subscribers`
- **Documentation**: https://developers.mailerlite.com/docs/

## Custom Fields Mapping

The integration maps your existing custom fields:

- `Custom_Fields.Tag` → `fields.tag` in MailerLite

## Testing

After setting up the environment variables:

1. **Restart your development server**: `npm run dev`
2. **Test subscription**: Try subscribing a test email
3. **Check MailerLite dashboard**: Verify the subscriber appears

## Migration Notes

- **From SendGrid**: All existing functionality preserved
- **Same API interface**: No changes needed in your frontend code
- **Better deliverability**: MailerLite often has better email deliverability
- **Cost effective**: Usually more affordable than SendGrid

## Troubleshooting

### Common Issues:

1. **API Key Invalid**: Make sure you copied the full API key
2. **Group ID Not Found**: Group ID is optional, you can remove it
3. **Rate Limiting**: MailerLite has rate limits, but they're generous
4. **Email Already Exists**: MailerLite will update existing subscribers

### Error Messages:

- `"MailerLite API key not configured"`: Add `MAILERLITE_API_KEY` to environment
- `"Failed to subscribe to MailerLite"`: Check API key and network connection
- `"Email already exists"`: This is normal, MailerLite will update the subscriber

## Deployment

### Vercel Environment Variables:

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - `MAILERLITE_API_KEY` = your API key
   - `MAILERLITE_GROUP_ID` = your group ID (optional)

### Testing in Production:

After deployment, test with a real email to ensure everything works correctly.
