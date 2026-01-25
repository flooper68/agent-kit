# Google Drive Integration Setup

Step-by-step guide to configure Google Drive sync for Agent Kit.

## Overview

The Google Drive integration allows you to automatically sync artifacts created by your AI assistants to a designated Google Drive folder. Once configured, artifacts are synced on creation and update.

## Prerequisites

- Google account
- Access to Google Cloud Console
- Admin access to your Agent Kit organization

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" in the top navigation bar
3. Click "New Project" in the modal that appears
4. Enter a project name (e.g., "Agent Kit")
5. Click "Create"
6. Wait for the project to be created, then select it

## Step 2: Enable Required APIs

### Enable Google Drive API

1. In Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Drive API"
3. Click on "Google Drive API" in the results
4. Click "Enable"

### Enable Google Picker API

1. In the API Library, search for "Google Picker API"
2. Click on "Google Picker API" in the results
3. Click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type (or "Internal" if using Google Workspace)
3. Click "Create"
4. Fill in the required fields:
   - **App name**: "Agent Kit" (or your preferred name)
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click "Save and Continue"
6. On the Scopes page, click "Add or Remove Scopes"
7. Find and add the scope: `https://www.googleapis.com/auth/drive.file`
   - This scope only allows access to files created by the application
8. Click "Update" then "Save and Continue"
9. If in testing mode, add test users who need to use the integration
10. Click "Save and Continue" to complete

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application" as the application type
4. Enter a name (e.g., "Agent Kit Web Client")
5. Under "Authorized JavaScript origins", add:
   - `http://localhost:5173` (for development)
   - Your production domain (e.g., `https://your-app.com`)
6. Under "Authorized redirect URIs", add:
   - `http://localhost:3000/api/auth/google/callback` (for development)
   - Your production callback URL (e.g., `https://api.your-app.com/api/auth/google/callback`)
7. Click "Create"
8. Copy the **Client ID** and **Client Secret** from the modal

## Step 5: Create API Key (for Picker)

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API key"
3. A new API key will be created
4. Click "Edit API key"
5. Under "API restrictions", select "Restrict key"
6. Check "Google Picker API" in the list
7. Click "Save"
8. Copy the API key

## Step 6: Generate Encryption Key

Generate a secure 32-character encryption key for token storage:

```bash
openssl rand -base64 32 | tr -d '\n' | cut -c1-32
```

Or use any secure random string generator.

## Step 7: Configure Environment Variables

### Server Environment (.env)

Add the following to your server's `.env` file:

```bash
# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID=your-client-id-here
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret-here
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Encryption key for token storage (32 characters)
ENCRYPTION_KEY=your-32-character-encryption-key
```

### Frontend Environment (.env)

Add the following to your web app's `.env` file:

```bash
# Google API Configuration
VITE_GOOGLE_CLIENT_ID=your-client-id-here
VITE_GOOGLE_API_KEY=your-api-key-here
```

## Step 8: Test the Integration

1. Start the development server:

   ```bash
   bun run dev
   ```

2. Navigate to Settings → Integrations

3. Click "Connect Google Drive"

4. Complete the OAuth flow:

   - Select your Google account
   - Review and accept the permissions
   - You'll be redirected back to the app

5. Select a destination folder for synced artifacts

6. Create or edit an artifact to verify sync is working

## Troubleshooting

### "Access blocked" Error

This occurs when the OAuth consent screen hasn't been verified or published.

**Solutions:**

- Add your email as a test user in the OAuth consent screen settings
- If deploying to production, submit your app for verification

### "Invalid redirect URI" Error

The redirect URI doesn't match what's configured in Google Cloud Console.

**Solutions:**

- Verify the redirect URI matches exactly (including protocol and path)
- Check for trailing slashes
- Ensure you're using the correct environment (development vs production)

### Picker Not Loading

The Google Picker may fail to load if the API key is misconfigured.

**Solutions:**

- Verify the API key is correct
- Check that the API key is restricted only to Google Picker API
- Check browser console for CORS errors
- Ensure the origin is added to authorized JavaScript origins

### "Quota exceeded" Error

You've hit Google Drive API rate limits.

**Solutions:**

- Wait and retry later
- Reduce sync frequency
- Request quota increase in Cloud Console

### Sync Stuck in "Pending" or "Syncing"

The background sync worker may have encountered an issue.

**Solutions:**

- Check server logs for errors
- Verify Redis is running (if using job queue)
- Manually trigger sync from the artifact detail page

## Production Checklist

Before deploying to production:

- [ ] Publish OAuth consent screen (submit for verification if required)
- [ ] Update all redirect URIs to production URLs
- [ ] Update authorized JavaScript origins to production domains
- [ ] Generate and securely store a new ENCRYPTION_KEY
- [ ] Verify all environment variables are set correctly
- [ ] Enable monitoring in Google Cloud Console
- [ ] Set up API quota alerts

## Security Considerations

1. **Token Encryption**: All OAuth tokens are encrypted using AES-256-GCM before storage
2. **Minimal Scope**: We use `drive.file` scope which only allows access to files created by the application
3. **CSRF Protection**: The OAuth flow uses state parameters to prevent cross-site request forgery
4. **Token Rotation**: Refresh tokens are automatically rotated when access tokens expire

## API Limits

Google Drive API has the following default quotas:

- 20,000 queries per day
- 20 queries per second per user

For most use cases, these limits are sufficient. Contact Google if you need higher limits.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Settings Page  │────▶│  OAuth + Picker  │────▶│  Google Drive   │
│  (Integrations) │     │  (Frontend)      │     │  (Folder)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          ▲
┌─────────────────┐     ┌──────────────────┐              │
│  Artifact CRUD  │────▶│  Sync Worker     │──────────────┘
│  (Create/Update)│     │  (Background)    │
└─────────────────┘     └──────────────────┘
```

1. User connects Google Drive via OAuth in Settings
2. User selects a destination folder using Google Picker
3. When artifacts are created or updated, they're queued for sync
4. Background worker syncs files to the selected Drive folder
5. Sync status is displayed in artifact views
