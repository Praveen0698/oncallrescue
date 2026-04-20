"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

export default function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    setIsStandalone(!!standalone);
    if (standalone) return; // Already installed, don't show banner

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service worker registered:", reg.scope);
        })
        .catch((err) => {
          console.error("[PWA] SW registration failed:", err);
        });
    }

    // Android/Chrome: Capture beforeinstallprompt
    const handler = (e) => {
      console.log("[PWA] beforeinstallprompt fired");
      e.preventDefault();
      setInstallPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS: Show manual instruction banner after 5 seconds
    if (ios) {
      const dismissed = localStorage.getItem("oncallrescue_pwa_dismissed");
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 5000);
      }
    }

    // Fallback: If no prompt after 10 seconds on Android, show anyway for iOS-style manual install
    const fallbackTimer = setTimeout(() => {
      if (!installPrompt && !ios) {
        console.log("[PWA] No install prompt detected. Check: HTTPS, manifest.json, icons, service worker.");
      }
    }, 10000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      console.log("[PWA] Install choice:", result.outcome);
      if (result.outcome === "accepted") {
        setShowBanner(false);
        setInstallPrompt(null);
      }
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("oncallrescue_pwa_dismissed", "1");
  };

  // Don't show if already installed or dismissed
  if (isStandalone || !showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-up-in">
      <div className="bg-white border border-surface-300 rounded-2xl shadow-heavy p-4 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl brand-gradient flex items-center justify-center flex-shrink-0">
            <Download size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-ink-900">Install OnCallRescue</p>
            <p className="text-[11px] text-ink-400">
              {isIOS
                ? "Tap Share ↗ then 'Add to Home Screen'"
                : "Add to home screen for app-like experience"}
            </p>
          </div>

          {/* Android: Install button */}
          {installPrompt && !isIOS && (
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-700 transition-all flex-shrink-0"
            >
              Install
            </button>
          )}

          {/* iOS: Show share instruction */}
          {isIOS && (
            <div className="flex items-center gap-1 text-brand-600 flex-shrink-0">
              <Share size={16} />
              <span className="text-xs font-semibold">Share → Add</span>
            </div>
          )}

          <button onClick={handleDismiss} className="text-ink-300 hover:text-ink-600 flex-shrink-0 ml-1">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
