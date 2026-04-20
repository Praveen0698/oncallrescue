'use client';
// src/components/ads/InterstitialAd.js

import { useEffect, useState, useRef } from 'react';

export default function InterstitialAd({ storageKey = 'ad_shown', adSlot }) {
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const initialized = useRef(false);

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem(storageKey);
    if (!alreadyShown) {
      setVisible(true);
      sessionStorage.setItem(storageKey, 'true');
    }
  }, [storageKey]);

  useEffect(() => {
    if (!visible) return;

    // Push ad unit once visible
    if (!initialized.current) {
      initialized.current = true;

      const tryPush = () => {
        try {
          if (typeof window !== 'undefined') {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          }
        } catch (e) {
          // Silently ignore
        }
      };

      if (document.readyState === 'complete') {
        tryPush();
      } else {
        window.addEventListener('load', tryPush, { once: true });
      }
    }

    // Countdown before close button appears
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-xs text-gray-400 font-medium">Advertisement</span>
          {countdown > 0 ? (
            <span className="text-sm font-semibold text-gray-500">Close in {countdown}s</span>
          ) : (
            <button
              onClick={() => setVisible(false)}
              className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors px-3 py-1 rounded-lg hover:bg-red-50"
            >
              ✕ Close
            </button>
          )}
        </div>

        <div className="p-4 flex justify-center min-h-[250px] items-center">
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', minHeight: '250px' }}
            data-ad-client="ca-pub-9588686587625852"
            data-ad-slot={adSlot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>

        <div className="px-4 py-2 bg-gray-50 text-center">
          <p className="text-xs text-gray-400">Ad revenue helps keep OnCallRescue running</p>
        </div>
      </div>
    </div>
  );
}