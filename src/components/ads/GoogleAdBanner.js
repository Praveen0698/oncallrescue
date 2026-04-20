'use client';
// src/components/ads/GoogleAdBanner.js

import { useEffect, useRef } from 'react';

export default function GoogleAdBanner({ adSlot, className = '' }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const tryPush = () => {
      try {
        if (typeof window !== 'undefined') {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (e) {
        // Silently ignore — common during dev hot reload
      }
    };

    if (document.readyState === 'complete') {
      tryPush();
    } else {
      window.addEventListener('load', tryPush, { once: true });
    }
  }, []);

  return (
    <div className={`w-full flex justify-center py-3 ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', minHeight: '100px' }}
        data-ad-client="ca-pub-9588686587625852"
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}