import { useState, useRef } from 'react';

const ATC_PRESETS = [
  { id: 'kjfk-app', name: 'JFK Approach', url: 'https://www.liveatc.net/play/kjfk3.pls' },
  { id: 'klax-twr', name: 'LAX Tower',    url: 'https://www.liveatc.net/play/klax1.pls' },
  { id: 'egll-app', name: 'LHR Approach', url: 'https://www.liveatc.net/play/egll.pls' },
  { id: 'eddf-dep', name: 'FRA Delivery', url: 'https://www.liveatc.net/play/eddf2.pls' },
  { id: 'vidp-del', name: 'DEL Control',  url: 'https://www.liveatc.net/play/vidp.pls' },
  { id: 'omdb-twr', name: 'DXB Tower',    url: 'https://www.liveatc.net/play/omdb2.pls' },
];

export default function ATCPlayer() {
  const [playing, setPlaying]       = useState(false);
  const [volume, setVolume]         = useState(0.7);
  const [activePreset, setActive]   = useState(null);
  const [customUrl, setCustomUrl]   = useState('');
  const [minimized, setMinimized]   = useState(false);
  const [currentName, setName]      = useState('Select a station\u2026');
  const [error, setError]           = useState(null);
  const audioRef                    = useRef(null);

  const loadStream = (url, name) => {
    setError(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    const audio = new Audio();
    audio.volume = volume;
    audio.crossOrigin = 'anonymous';
    audio.src = url;
    audio.onerror = () => {
      setError('Stream unavailable. Try another station or paste a direct stream URL.');
      setPlaying(false);
    };
    audio.onended = () => setPlaying(false);
    audioRef.current = audio;
    audio.play()
      .then(() => { setPlaying(true); setName(name); })
      .catch(e => {
        setError('Playback blocked. Please click Play after selecting a station.');
        setPlaying(false);
      });
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    }
  };

  const handlePreset = (preset) => {
    setActive(preset.id);
    setCustomUrl('');
    loadStream(preset.url, preset.name);
  };

  const handleCustom = () => {
    if (!customUrl.trim()) return;
    setActive(null);
    loadStream(customUrl.trim(), 'Custom Stream');
  };

  const handleVolume = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  if (minimized) {
    return (
      <div
        className=\"atc-player\"
        style={{ width: 'auto', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
        onClick={() => setMinimized(false)}
      >\n        <span style={{ fontSize: 18 }}>\ud83c\udfa7</span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ATC Audio</span>
        {playing && <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 16 }}>
          {[...Array(5)].map((_, i) => <div key={i} className=\"atc-bar\" style={{ width: 3, animationDelay: `${i * 0.1}s` }} />)}
        </div>}
      </div>
    );
  }

  return (
    <div className=\"atc-player\" role=\"region\" aria-label=\"ATC Audio Player\">
      <div className=\"atc-player__header\">
        <span style={{ fontSize: 16 }}>\ud83c\udfa7</span>
        <span className=\"atc-player__title\">ATC Live Audio</span>
        <button
          onClick={() => setMinimized(true)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
          aria-label=\"Minimize\"\n        >\u2212</button>
      </div>

      <div className=\"atc-player__station\">{currentName}</div>

      {/* Visualizer */}
      <div className=\"atc-visualizer\" aria-hidden=\"true\">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`atc-bar ${!playing ? 'atc-bar--paused' : ''}`}
            style={{
              animationDelay: `${i * 0.08}s`,
              animationDuration: `${0.6 + Math.random() * 0.6}s`,
            }}
          />
        ))}
      </div>

      {/* Controls */}
      <div className=\"atc-controls\">
        <button id=\"atc-play-btn\" className=\"atc-btn atc-btn--play\" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? '\u23f8' : '\u25b6'}
        </button>
        <input
          id=\"atc-volume\"
          className=\"atc-volume\"
          type=\"range\"
          min=\"0\"
          max=\"1\"
          step=\"0.05\"
          value={volume}
          onChange={handleVolume}
          aria-label=\"Volume\"\n        />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 28 }}>{Math.round(volume * 100)}%</span>
      </div>

      {/* Presets */}
      <div className=\"atc-presets\">
        {ATC_PRESETS.map(p => (
          <button
            key={p.id}
            className={`atc-preset ${activePreset === p.id ? 'active' : ''}`}
            onClick={() => handlePreset(p)}
          >{p.name}</button>
        ))}
      </div>

      {/* Custom URL */}
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          id=\"atc-custom-url\"
          className=\"atc-url-input\"
          style={{ flex: 1 }}
          placeholder=\"Paste stream URL (.mp3 / .pls)\"\n          value={customUrl}
          onChange={e => setCustomUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCustom()}
          aria-label=\"Custom stream URL\"
        />
        <button
          className=\"airport-btn\"
          style={{ padding: '5px 10px', fontSize: 11 }}
          onClick={handleCustom}
        >\u25b6</button>
      </div>

      {error && (
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--accent-amber)', lineHeight: 1.4 }}>
          \u26a0 {error}
        </div>
      )}
    </div>
  );
}
