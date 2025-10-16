// DOM elements
const status = document.getElementById('status');
const results = document.getElementById('results');
const connectBtn = document.getElementById('connectBtn');
const searchBtn = document.getElementById('searchBtn');
const emotionInput = document.getElementById('emotion');

// ---------- Spotify Connect Button ----------
connectBtn.addEventListener('click', () => {
  const clientId = 'd69f805b88484d37a7e0652036112a40'; // your Spotify Client ID
  const redirectUri = 'https://hm-oapp.vercel.app/api/auth/callback'; // works for localhost & Vercel
  const scopes = 'user-read-private user-read-email';

  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;

  window.location.href = authUrl;
});

// ---------- Parse Spotify token after login ----------
function getSpotifyToken() {
  const hash = window.location.hash.substring(1); // remove '#'
  const params = new URLSearchParams(hash);
  const token = params.get('access_token');
  if (token) {
    localStorage.setItem('spotifyToken', token); // save token locally
    status.innerText = 'Connected to Spotify! You can now search.';
    // remove the token from URL
    history.replaceState(null, '', window.location.pathname);
  } else if (localStorage.getItem('spotifyToken')) {
    status.innerText = 'Connected to Spotify! You can now search.';
  }
}
getSpotifyToken();

// ---------- Search by emotion ----------
searchBtn.onclick = async () => {
  const mood = emotionInput.value.trim();
  if (!mood) { 
    alert('Type an emotion or sentence.'); 
    return; 
  }

  const token = localStorage.getItem('spotifyToken');
  if (!token) {
    results.innerHTML = '<b>Not connected to Spotify.</b> Click "Connect Spotify" first.';
    return;
  }

  results.innerHTML = '<em>Searching Spotify…</em>';

  try {
    // Your API endpoint for playlists
    const r = await fetch(`/api/playlists?mood=${encodeURIComponent(mood)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (r.status === 403) {
      results.innerHTML = '<b>Not connected to Spotify.</b> Click "Connect Spotify" first.';
      return;
    }

    const data = await r.json();
    results.innerHTML = '';

    const qEl = document.createElement('div');
    qEl.innerHTML = `<p><small>Search query used: <strong>${data.query}</strong></small></p>`;
    results.appendChild(qEl);

    data.results.forEach(group => {
      const p = document.createElement('div'); 
      p.className = 'playlist';
      p.innerHTML = `<strong>Playlist:</strong> <a target="_blank" href="${group.playlist.url}">${group.playlist.name}</a><div>${group.playlist.description || ''}</div>`;

      group.tracks.forEach(t => {
        const tr = document.createElement('div'); 
        tr.className='track';
        tr.innerHTML = `<div><em>${t.name}</em> — ${t.artists} ${t.preview_url ? '' : '<small>(no preview)</small>'}</div>`;

        if (t.preview_url) {
          const audio = document.createElement('audio');
          audio.controls = true;
          audio.src = t.preview_url;
          audio.style.display = 'block';
          tr.appendChild(audio);
        }

        if (t.spotify_url) {
          const link = document.createElement('a'); 
          link.href = t.spotify_url; 
          link.target='_blank'; 
          link.innerText='Open in Spotify';
          tr.appendChild(link);
        }

        p.appendChild(tr);
      });

      results.appendChild(p);
    });

    if (data.results.length === 0) results.innerHTML = '<em>No playlists found.</em>';

  } catch(e){
    results.innerHTML = '<b>Error:</b> ' + (e.message || e);
  }
};
