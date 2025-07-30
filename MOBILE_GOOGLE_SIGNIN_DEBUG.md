# Mobile Google Sign-in Debugging Guide

## 🔍 **Step 1: Test and Check Console Logs**

1. **Open your app on your phone**
2. **Open the browser's developer console** (if possible) or use remote debugging
3. **Try to sign in with Google**
4. **Check the console logs** for the debug information I added

You should see logs like:
```
🔍 Google Sign-in Debug: {
  isMobile: true,
  isIOS: true,
  isAndroid: false,
  userAgent: "...",
  currentUrl: "...",
  protocol: "https:",
  hostname: "yourdomain.com",
  baseUrl: "https://yourdomain.com",
  apiUrl: "https://yourdomain.com/api"
}
```

## 🎯 **Step 2: Check the OAuth URL**

Look for this log:
```
🔗 Google OAuth URL: https://accounts.google.com/o/oauth2/v2/auth?...
```

**What to check:**
- Does the URL contain your correct domain?
- Is it using HTTPS?
- Does it match your Google Cloud Console configuration?

## 🛠 **Step 3: Common Issues and Fixes**

### **Issue 1: Redirect URI Mismatch**
**Symptoms:** Works on desktop, fails on mobile
**Fix:** Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Find your OAuth 2.0 Client ID
4. Add your production domain to "Authorized redirect URIs":
   ```
   https://yourdomain.com/api/auth/google/callback
   ```

### **Issue 2: HTTP vs HTTPS**
**Symptoms:** Works on localhost, fails on mobile
**Fix:** Ensure HTTPS

- Your production site must use HTTPS
- Update environment variables to use HTTPS URLs

### **Issue 3: Mobile Browser Limitations**
**Symptoms:** Works on desktop browsers, fails on mobile
**Fix:** Test different browsers

- Try Chrome on mobile
- Try Safari on iOS
- Try Firefox on Android
- Clear browser cache and cookies

## 📱 **Step 4: Mobile-Specific Testing**

### **iOS Safari:**
- Test in Safari (default browser)
- Test in Chrome for iOS
- Test in private browsing mode
- Check if popup blockers are enabled

### **Android Chrome:**
- Test in Chrome (default browser)
- Test in Firefox for Android
- Check Chrome's popup blocker settings
- Clear Chrome's cache and cookies

## 🔧 **Step 5: Environment Variables Check**

Make sure these are set correctly in your production environment:

```bash
# Backend (.env)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## 🚨 **Step 6: Error Messages**

The updated code will show specific error messages:

- **"HTTPS Required"** - Your site needs HTTPS
- **"iOS Safari Issue"** - Try different browser or private mode
- **"Android Browser Issue"** - Clear cache or try different browser
- **"Mobile Browser Issue"** - General mobile browser problem

## 📊 **Step 7: Debug Information to Share**

If you're still having issues, share this information:

1. **Console logs** from the debug output
2. **Your domain** (the actual URL you're testing on)
3. **Mobile device** (iPhone/Android, browser type)
4. **Error messages** you see
5. **Google Cloud Console** redirect URI configuration

## 🎯 **Quick Fixes to Try**

1. **Clear browser cache and cookies**
2. **Try a different mobile browser**
3. **Test in private/incognito mode**
4. **Check if your site uses HTTPS**
5. **Verify Google Cloud Console settings**

## 📞 **Next Steps**

After following these steps:

1. **If it works** - Great! The debugging helped identify the issue
2. **If it still doesn't work** - Share the console logs and error messages
3. **If you see specific errors** - Let me know what they are

The debugging code I added will help us pinpoint exactly what's going wrong with Google sign-in on your mobile device. 