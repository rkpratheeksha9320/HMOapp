// HearMeOut - simple Node/Express server
// Usage: fill .env with SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, REDIRECT_URI (e.g. http://localhost:3000/auth/callback) and FRONTEND_URL (e.g. http://localhost:3000)
const express = require('express');
const fetch = require('node-fetch');
const querystring = require('querystring');
require('dotenv').config();
const path = require('path');

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || ' https://domenic-cytoid-gauzily.ngrok-free.dev/auth/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || ' https://domenic-cytoid-gauzily.ngrok-free.dev';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn('Warning: SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET not set in .env');
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Simple in-memory store for tokens (for demo only)
let TOKEN_STORE = {};

// Step 1: login -> redirect user to Spotify auth
app.get('/auth/login', (req, res) => {
  const scope = [
    'user-read-private',
    'user-read-email'
  ].join(' ');

  const params = querystring.stringify
({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope,
    redirect_uri: REDIRECT_URI
  });

  res.redirect('https://accounts.spotify.com/authorize?' + params);
});

// Step 2: callback -> exchange code for access token
app.get('/auth/callback', async (req, res) => {
  const code = req.query.code || null;
  if (!code) return res.status(400).send('No code received from Spotify');

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
    },
    body: querystring.stringify
   ({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI
    })
  });
  const tokenData = await tokenRes.json();
  if (tokenData.error) {
    return res.status(400).json(tokenData);
  }

  // store tokens in a simple way (demo)
  TOKEN_STORE.access_token = tokenData.access_token;
  TOKEN_STORE.refresh_token = tokenData.refresh_token;
  TOKEN_STORE.expires_in = tokenData.expires_in;
  // redirect back to frontend
  res.redirect(FRONTEND_URL + '/?connected=1');
});

// Simple refresh token endpoint
app.get('/auth/refresh', async (req, res) => {
  if (!TOKEN_STORE.refresh_token) return res.status(400).json({ error: 'no refresh token' });
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
    },
    body: querystring.stringify
({
      grant_type: 'refresh_token',
      refresh_token: TOKEN_STORE.refresh_token
    })
  });
  const tokenData = await tokenRes.json();
  if (tokenData.error) return res.status(400).json(tokenData);
  TOKEN_STORE.access_token = tokenData.access_token;
  TOKEN_STORE.expires_in = tokenData.expires_in;
  res.json({ ok: true });
});

// Map free-text emotion to simple search keywords / moods
function mapEmotionToQuery(emotionText) {
  const t = (emotionText || '').toLowerCase();
  if (t.includes('happy')||t.includes('joy')||t.includes('excited')) return 'feel good upbeat';
  if (t.includes('sad')||t.includes('down')||t.includes('tear')) return 'sad mellow';
  if (t.includes('angry')||t.includes('rage')||t.includes('mad')) return 'angry heavy intense';
  if (t.includes('relax')||t.includes('calm')||t.includes('chill')) return 'chill acoustic calm';
  if (t.includes('romantic')||t.includes('love')) return 'romantic love slow';
  // fallback: just search by words
  return t.split(/\s+/).slice(0,4).join(' ');
}

// Endpoint to get playlists/tracks for an emotion
app.get('/api/playlists', async (req, res) => {
  const emotion = req.query.mood || req.query.emotion || '';
  const query = mapEmotionToQuery(emotion);
  const access = TOKEN_STORE.access_token;
  if (!access) return res.status(403).json({ error: 'not connected to Spotify. Visit /auth/login to connect.' });

  // search for playlists
  const searchParams = querystring.stringify
({ q: query, type: 'playlist', limit: 6 });
  const searchRes = await fetch('https://api.spotify.com/v1/search?' + searchParams, {
    headers: { 'Authorization': 'Bearer ' + access }
  });
  const searchJson = await searchRes.json();
  const playlists = (searchJson.playlists && searchJson.playlists.items) || [];

  // For each playlist, fetch first few tracks
  const results = [];
  for (const p of playlists) {
    try {
      const plRes = await fetch(`https://api.spotify.com/v1/playlists/${p.id}/tracks?limit=6`, {
        headers: { 'Authorization': 'Bearer ' + access }
      });
      const plJson = await plRes.json();
      const tracks = (plJson.items || []).map(it => {
        const t = it.track || {};
        return {
          id: t.id,
          name: t.name,
          artists: (t.artists||[]).map(a=>a.name).join(', '),
          preview_url: t.preview_url, // may be null for many tracks
          spotify_url: t.external_urls ? t.external_urls.spotify : null
        };
      });
      results.push({
        playlist: { id: p.id, name: p.name, description: p.description, url: p.external_urls ? p.external_urls.spotify : null },
        tracks
      });
    } catch(e){
      console.error('playlist fetch error', e.message);
    }
  }

  res.json({ query, results });
});

// fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('HearMeOut server running on port', PORT));
