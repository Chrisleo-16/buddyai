import { useEffect, useRef, useState, useCallback } from 'react';

export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [state, setState] = useState('idle'); // idle | starting | on | error
  const start = useCallback(async () => {
    setState('starting');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: false });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play().catch(() => {}); }
      setState('on');
    } catch { setState('error'); }
  }, []);
  useEffect(() => { start(); return () => streamRef.current?.getTracks().forEach((t) => t.stop()); }, [start]);
  /** Grab a downscaled JPEG frame (kept in memory only). */
  const capture = useCallback(() => new Promise((resolve) => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return resolve(null);
    const scale = Math.min(1, 768 / v.videoWidth);
    const c = document.createElement('canvas');
    c.width = Math.round(v.videoWidth * scale); c.height = Math.round(v.videoHeight * scale);
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    c.toBlob((b) => resolve(b), 'image/jpeg', 0.8);
  }), []);
  return { videoRef, state, start, capture };
}

export function speak(text, lang) {
  if (!('speechSynthesis' in window) || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === 'sw' ? 'sw-KE' : 'en-US';
  const v = window.speechSynthesis.getVoices().find((x) => x.lang?.toLowerCase().startsWith(lang === 'sw' ? 'sw' : 'en'));
  if (v) u.voice = v;
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}
