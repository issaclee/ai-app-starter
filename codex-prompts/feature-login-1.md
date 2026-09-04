Update the `/login` page with the following changes:

1. Replace:
   “Use your local account to continue. Workspace OAuth can be enabled later.”

   With:
   “Use your local account to continue.”

2. Replace the generic icons on the OAuth buttons with the official Google and Microsoft brand logos.

3. Remove the message:
   “Google and Microsoft sign-in are not configured.”

4. Enable Google and Microsoft OAuth using these environment variables from `.env`:

   ```dotenv
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=

   MICROSOFT_ENTRA_ID_CLIENT_ID=
   MICROSOFT_ENTRA_ID_CLIENT_SECRET=
   MICROSOFT_ENTRA_ID_TENANT_ID=
   ```

5. Remove the message:
   “Start in echo mode, then connect the model provider that fits your environment.”

6. Remove the prefilled `admin@mptwork.local` value from the Username field so it is empty by default.

7. Replace the divider label:
   “Workspace sign-in”

   With:
   “Or continue sign-in with”

8. Use `/public/images/background/bg-sf.png` as the background image for the right-side login panel. Ensure the image fills the panel responsively while preserving its aspect ratio.

Note the registered callback URLs are:

- Google: `http://localhost:3000/api/auth/callback/google`
- Microsoft: `http://localhost:3000/api/auth/callback/microsoft`