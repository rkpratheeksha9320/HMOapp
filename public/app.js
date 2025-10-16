const status = document.getElementById('status');
const results = document.getElementById('results');
const connBtn = document.getElementById('connectBtn');
const searchBtn = document.getElementById('searchBtn');
const emotionInput = document.getElementById('emotion');

connBtn.onclick = () => { window.location.href = '/auth/login'; };

async function checkConnected(){
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('connected')) {
    status.innerText = 'Connected to Spotify! You can now search.';
  }
}
checkConnected();

searchBtn.onclick = async () => {
  const mood = emotionInput.value.trim();
  if (!mood) { alert('Type an emotion or sentence.'); return; }
  results.innerHTML = '<em>Searching Spotify…</em>';
  try {
    const r = await fetch('/api/playlists?mood=' + encodeURIComponent(mood));
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
      const p = document.createElement('div'); p.className='playlist';
      p.innerHTML = `<strong>Playlist:</strong> <a target="_blank" href="${group.playlist.url}">${group.playlist.name}</a><div>${group.playlist.description || ''}</div>`;
      group.tracks.forEach(t => {
        const tr = document.createElement('div'); tr.className='track';
        tr.innerHTML = `<div><em>${t.name}</em> — ${t.artists} ${t.preview_url ? '' : '<small>(no preview)</small>'}</div>`;
        if (t.preview_url) {
          const audio = document.createElement('audio');
          audio.controls = true;
          audio.src = t.preview_url;
          audio.style.display = 'block';
          tr.appendChild(audio);
        }
        if (t.spotify_url) {
          const link = document.createElement('a'); link.href = t.spotify_url; link.target='_blank'; link.innerText='Open in Spotify';
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
