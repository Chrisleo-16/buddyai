import { useEffect, useRef, useState, useCallback } from 'react';
import { fitWithin, toGray } from './frames.js';

export const MAX_EDGE = 640;
export const JPEG_QUALITY = 0.7;

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
  /** Grab a frame downscaled to <=640px JPEG q0.7 (kept in memory only) plus a 32px grayscale thumb for change detection. */
  const capture = useCallback(() => new Promise((resolve) => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return resolve(null);
    const { width, height } = fitWithin(v.videoWidth, v.videoHeight, MAX_EDGE);
    const c = document.createElement('canvas');
    c.width = width; c.height = height;
    c.getContext('2d').drawImage(v, 0, 0, width, height);
    const tc = document.createElement('canvas');
    const tw = fitWithin(width, height, 32);
    tc.width = tw.width; tc.height = tw.height;
    const tctx = tc.getContext('2d');
    tctx.drawImage(c, 0, 0, tw.width, tw.height);
    const thumb = toGray(tctx.getImageData(0, 0, tw.width, tw.height).data);
    c.toBlob((blob) => resolve(blob ? { blob, thumb } : null), 'image/jpeg', JPEG_QUALITY);
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
