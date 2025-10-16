# HearMeOut — demo app (Node + Express)

This is a minimal fullstack demo that:
- Lets a user connect their Spotify account (OAuth)
- Accepts free-text "emotion" input and maps it to simple search keywords
- Searches Spotify for playlists and returns the first few tracks (with preview URLs when available)
- Plays previews in the browser

> You told me you already have a Spotify Client ID and Secret — good! Fill those into a .env file (see below).

## Quick setup (run in VS Code terminal)

1. Unzip the project and `cd` into the folder.
2. Copy `.env.example` to `.env` and fill your `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` and ensure `REDIRECT_URI` is set to `http://localhost:3000/auth/callback` (or change as needed and update in Spotify dashboard).
3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the server:

   ```bash
   npm start
   ```

5. Open `http://localhost:3000` in your browser.
6. Click "Connect Spotify" and complete the OAuth flow. After redirect, you'll see "Connected to Spotify". Then type an emotion and click "Find Music".

## Notes & limitations
- This demo stores tokens in memory — it's fine for local testing but **not suitable for production**.
- Spotify preview URLs (30s clips) are not guaranteed for all tracks — many tracks have `preview_url=null`.
- If you want a more robust app, you can persist tokens in a database, refresh tokens periodically, and provide player controls using Spotify's Web Playback SDK (requires more scopes and a premium account for full playback).

## Troubleshooting
- Make sure the Redirect URI you configured in your Spotify Developer Dashboard exactly matches the `REDIRECT_URI` in `.env`.
- If the app returns "not connected", visit `http://localhost:3000/auth/login` directly to re-authorize.
