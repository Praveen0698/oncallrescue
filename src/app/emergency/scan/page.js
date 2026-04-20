"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Shield,
  Phone,
  AlertTriangle,
  Heart,
  Droplet,
  Activity,
  Pill,
  Check,
  X,
  Bell,
  Loader2,
  FlipHorizontal2,
  Search,
  MapPin,
  ExternalLink,
  Ambulance,
  Siren,
  Smartphone,
} from "lucide-react";
import { PageShell } from "@/components/layouts";
import { Button, Card, Badge, Input } from "@/components/ui";
import toast from "react-hot-toast";

// ═══ QR SCANNER HOOK — BarcodeDetector + jsQR fallback ═══
function useQRScanner({ onResult, active }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const startingRef = useRef(false);
  const jsQRRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  // jsQR canvas-based scanning (works on all browsers including iOS Safari)
  const startJsQRScanning = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    scanIntervalRef.current = setInterval(() => {
      if (!video || video.readyState < 2) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (jsQRRef.current) {
          const code = jsQRRef.current(
            imageData.data,
            imageData.width,
            imageData.height,
            { inversionAttempts: "dontInvert" },
          );
          if (code && code.data) {
            clearInterval(scanIntervalRef.current);
            onResult(code.data);
          }
        }
      } catch {}
    }, 350);
  }, [onResult]);

  const startCamera = useCallback(
    async (facing) => {
      if (startingRef.current) return;
      startingRef.current = true;
      stopCamera();
      setCameraError(null);
      const mode = facing || facingMode;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 640 },
            height: { ideal: 640 },
          },
          audio: false,
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);

          // Try BarcodeDetector first (Chrome Android)
          if ("BarcodeDetector" in window) {
            const detector = new BarcodeDetector({ formats: ["qr_code"] });
            scanIntervalRef.current = setInterval(async () => {
              if (!videoRef.current || videoRef.current.readyState < 2) return;
              try {
                const b = await detector.detect(videoRef.current);
                if (b.length > 0 && b[0].rawValue) {
                  clearInterval(scanIntervalRef.current);
                  onResult(b[0].rawValue);
                }
              } catch {}
            }, 300);
          } else {
            // Fallback to jsQR (iOS Safari, Firefox, etc.)
            try {
              const jsQRModule = await import("jsqr");
              jsQRRef.current = jsQRModule.default;
              startJsQRScanning();
            } catch (err) {
              console.error("jsQR load failed:", err);
              setCameraError(
                "QR scanning failed to load. Use manual entry or your phone's camera app.",
              );
            }
          }
        }
      } catch (err) {
        setCameraError(
          err.name === "NotAllowedError"
            ? "Camera permission denied. Please allow camera access."
            : "Could not access camera. Try using your phone's camera app to scan the QR.",
        );
      }
      startingRef.current = false;
    },
    [facingMode, stopCamera, onResult, startJsQRScanning],
  );

  const flipCamera = useCallback(() => {
    const m = facingMode === "environment" ? "user" : "environment";
    setFacingMode(m);
    startCamera(m);
  }, [facingMode, startCamera]);

  useEffect(() => {
    if (active) {
      const t = setTimeout(() => startCamera(), 100);
      return () => {
        clearTimeout(t);
        stopCamera();
      };
    } else stopCamera();
  }, [active]);

  return {
    videoRef,
    canvasRef,
    cameraReady,
    cameraError,
    flipCamera,
    stopCamera,
  };
}

function EmergencyScanPageContent() {
  const searchParams = useSearchParams();
  const urlQrId = searchParams.get("id");

  const [phase, setPhase] = useState(urlQrId ? "validating" : "scanner");
  const [qrId, setQrId] = useState(urlQrId || "");
  const [manualInput, setManualInput] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [helperPhone, setHelperPhone] = useState("");
  const [scanLogId, setScanLogId] = useState(null);
  const [medicalInfo, setMedicalInfo] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [locationData, setLocationData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [callStatus, setCallStatus] = useState("");
  const [smsStatus, setSmsStatus] = useState("");

  console.log(urlQrId)

  const handleQRResult = useCallback((rawValue) => {
    let id = null;
    try {
      if (rawValue.includes("id=")) {
        const u = new URL(rawValue);
        id = u.searchParams.get("id");
      } else if (rawValue.startsWith("LL-")) {
        id = rawValue;
      }
    } catch {
      const m = rawValue.match(/id=([A-Z0-9-]+)/i);
      if (m) id = m[1];
    }
    if (id) {
      setQrId(id.toUpperCase());
      setPhase("validating");
      toast.success("QR detected!");
    } else toast.error("Not a valid OnCallRescue QR");
  }, []);

  const {
    videoRef,
    canvasRef,
    cameraReady,
    cameraError,
    flipCamera,
    stopCamera,
  } = useQRScanner({ onResult: handleQRResult, active: phase === "scanner" });

  useEffect(() => {
    if (phase === "validating" && qrId) validateQrId(qrId);
  }, [phase, qrId]);

  const validateQrId = async (id) => {
    try {
      const res = await fetch("/api/emergency?qrId=" + encodeURIComponent(id));
      const data = await res.json();
      if (data.success && data.data.hasProfile) {
        stopCamera();
        setPhase("initial");
      } else {
        setErrorMsg(data.message || "No profile linked.");
        setPhase("not-found");
        stopCamera();
      }
    } catch {
      setErrorMsg("Failed to verify.");
      setPhase("error");
      stopCamera();
    }
  };

  const handleManualSubmit = () => {
    const id = manualInput.trim().toUpperCase();
    if (!id) return;
    setQrId(id);
    setPhase("validating");
  };

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      triggerEmergency();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  const handleTrigger = () => {
    if (helperPhone.length !== 10) {
      toast.error("Enter your 10-digit mobile number");
      return;
    }
    setPhase("countdown");
    setCountdown(5);
  };

  const handleCancel = () => {
    if (scanLogId)
      fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", scanLogId }),
      }).catch(() => {});
    setPhase("cancelled");
  };

  const triggerEmergency = async () => {
    setPhase("loading");
    let location = {};
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, {
          enableHighAccuracy: true,
          timeout: 5000,
        }),
      );
      location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {}

    try {
      const res = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "trigger",
          qrId,
          deviceInfo: navigator.userAgent,
          location,
          helperPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setScanLogId(data.data.scanLogId);
        setMedicalInfo(data.data.medicalInfo);
        setContacts(data.data.contacts);
        setLocationData(data.data.location);
        setPhase("triggered");
        fireNotifications(data.data.scanLogId);
      } else {
        setErrorMsg(data.message);
        setPhase("error");
      }
    } catch {
      setErrorMsg("Failed to connect. Call 112 directly.");
      setPhase("error");
    }
  };

  const fireNotifications = async (logId) => {
    setCallStatus("calling");
    try {
      const r = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "call",
          scanLogId: logId,
          contactIndex: 0,
        }),
      });
      const d = await r.json();
      setCallStatus(d.success ? "initiated" : "failed");
    } catch {
      setCallStatus("failed");
    }

    setSmsStatus("sending");
    try {
      const r = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sms",
          scanLogId: logId,
          contactIndex: 0,
        }),
      });
      const d = await r.json();
      setSmsStatus(d.success ? "sent" : "failed");
    } catch {
      setSmsStatus("failed");
    }
  };

  const primaryContact = contacts[0];

  return (
    <PageShell>
      {/* ═══ SCANNER ═══ */}
      {phase === "scanner" && (
        <div>
          <div className="flex items-center gap-3 mb-4 pt-2">
            <a
              href="/"
              className="w-9 h-9 rounded-xl bg-white border border-surface-300 flex items-center justify-center text-ink-400 hover:text-ink-900 flex-shrink-0"
            >
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </a>
            <div>
              <h1 className="text-xl font-extrabold text-ink-900">
                Scan Emergency QR
              </h1>
              <p className="text-xs text-ink-400 mt-0.5">
                Point camera at the OnCallRescue sticker
              </p>
            </div>
          </div>
          <div className="relative w-full aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden bg-black mb-4">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute -left-[9999px] -top-[9999px]"
            />
            {!cameraReady && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-white" />
              </div>
            )}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <p className="text-sm text-white text-center bg-black/60 rounded-xl p-4">
                  {cameraError}
                </p>
              </div>
            )}
            {cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-white/40 rounded-2xl" />
              </div>
            )}
            {cameraReady && (
              <button
                onClick={flipCamera}
                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white"
              >
                <FlipHorizontal2 size={18} />
              </button>
            )}
          </div>
          <Card>
            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">
              Or enter ID manually
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., LL-A8K3P2"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                className="!mb-0 flex-1"
                icon={<Search size={14} />}
              />
              <Button
                onClick={handleManualSubmit}
                disabled={!manualInput.trim()}
              >
                Go
              </Button>
            </div>
            <p className="text-[10px] text-ink-400 mt-2 flex items-center gap-1">
              <Smartphone size={10} /> On iPhone, you can also scan QR using
              your default Camera app
            </p>
          </Card>
        </div>
      )}

      {/* ═══ VALIDATING ═══ */}
      {phase === "validating" && (
        <div className="pt-32 text-center">
          <Loader2
            size={32}
            className="animate-spin text-brand-600 mx-auto mb-4"
          />
          <p className="text-sm text-ink-500">
            Verifying{" "}
            <span className="font-mono font-bold text-brand-600">{qrId}</span>
            ...
          </p>
        </div>
      )}

      {/* ═══ INITIAL — Helper phone + trigger ═══ */}
      {phase === "initial" && (
        <div>
          <div className="brand-gradient rounded-2xl p-5 mb-5 text-center">
            <Shield size={28} className="text-white mx-auto mb-2" />
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/60 mb-1">
              OnCallRescue Emergency
            </p>
            <p className="text-lg font-extrabold text-white">
              Sticker Verified
            </p>
            <p className="text-xs text-white/70 font-mono mt-1">{qrId}</p>
          </div>

          <Card className="mb-4">
            <p className="text-sm font-bold text-ink-900 mb-1">
              Your Mobile Number
            </p>
            <p className="text-xs text-ink-400 mb-3">
              Required — emergency contacts will be able to reach you
            </p>
            <Input
              placeholder="Your 10-digit number"
              type="tel"
              value={helperPhone}
              onChange={(e) =>
                setHelperPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              maxLength={10}
              icon={<Phone size={14} />}
              required
            />
            {helperPhone.length > 0 && helperPhone.length < 10 && (
              <p className="text-[11px] text-warning-500 -mt-2 mb-2">
                Enter all 10 digits
              </p>
            )}
          </Card>

          <button
            onClick={handleTrigger}
            disabled={helperPhone.length !== 10}
            className={
              "w-full py-5 rounded-2xl text-white text-lg font-extrabold transition-all " +
              (helperPhone.length === 10
                ? "brand-gradient emergency-ripple hover:opacity-90 active:scale-[0.98]"
                : "bg-ink-300 cursor-not-allowed")
            }
          >
            <div className="flex items-center justify-center gap-3">
              <Bell size={22} /> Emergency — Contact Family
            </div>
          </button>
          <p className="text-center text-[11px] text-ink-400 mt-3">
            Owner will be notified. They can cancel within 5 seconds.
          </p>
        </div>
      )}

      {/* ═══ COUNTDOWN ═══ */}
      {phase === "countdown" && (
        <div className="pt-16 text-center">
          <div className="w-28 h-28 rounded-full brand-gradient flex items-center justify-center mx-auto mb-6 emergency-ripple">
            <span className="text-5xl font-black text-white">{countdown}</span>
          </div>
          <p className="text-lg font-bold text-ink-900 mb-2">
            Contacting family...
          </p>
          <p className="text-sm text-ink-500 mb-8">
            Owner notified. Cancel if not needed.
          </p>
          <div className="h-1.5 bg-surface-300 rounded-full overflow-hidden mb-8 max-w-xs mx-auto">
            <div className="h-full bg-brand-600 rounded-full countdown-bar" />
          </div>
          <Button variant="secondary" full onClick={handleCancel}>
            <X size={16} /> Cancel — Not Emergency
          </Button>
        </div>
      )}

      {/* ═══ LOADING ═══ */}
      {phase === "loading" && (
        <div className="pt-32 text-center">
          <Loader2
            size={32}
            className="animate-spin text-brand-600 mx-auto mb-4"
          />
          <p className="text-sm text-ink-500">Triggering emergency alerts...</p>
        </div>
      )}

      {/* ═══ TRIGGERED ═══ */}
      {phase === "triggered" && medicalInfo && (
        <div>
          {/* Header */}
          <div className="brand-gradient rounded-2xl p-5 mb-4 text-center">
            <Check size={28} className="text-white mx-auto mb-2" />
            <p className="text-lg font-extrabold text-white">
              Emergency Triggered
            </p>
            <p className="text-xs text-white/70 mt-1">Alerts sent • {qrId}</p>
          </div>

          {/* Status */}
          <Card className="mb-4">
            <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-3">
              Alert Status
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div
                  className={
                    "w-8 h-8 rounded-lg flex items-center justify-center " +
                    (callStatus === "initiated"
                      ? "bg-success-50 text-success-500"
                      : callStatus === "failed"
                        ? "bg-brand-50 text-brand-600"
                        : "bg-surface-200 text-ink-400")
                  }
                >
                  <Phone size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-900">
                    Call to {primaryContact?.name || "Primary"}
                  </p>
                  <p className="text-[11px] text-ink-400">
                    {callStatus === "calling"
                      ? "Connecting..."
                      : callStatus === "initiated"
                        ? "Voice message delivered"
                        : callStatus === "failed"
                          ? "Failed — call 112"
                          : "Preparing..."}
                  </p>
                </div>
                {callStatus === "initiated" && (
                  <Check size={16} className="text-success-500" />
                )}
                {callStatus === "calling" && (
                  <Loader2 size={16} className="animate-spin text-ink-400" />
                )}
                {callStatus === "failed" && (
                  <X size={16} className="text-brand-600" />
                )}
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={
                    "w-8 h-8 rounded-lg flex items-center justify-center " +
                    (smsStatus === "sent"
                      ? "bg-success-50 text-success-500"
                      : smsStatus === "failed"
                        ? "bg-brand-50 text-brand-600"
                        : "bg-surface-200 text-ink-400")
                  }
                >
                  <Phone size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-900">
                    SMS to {primaryContact?.name || "Primary"}
                  </p>
                  <p className="text-[11px] text-ink-400">
                    {smsStatus === "sending"
                      ? "Sending..."
                      : smsStatus === "sent"
                        ? "Sent with location"
                        : smsStatus === "failed"
                          ? "Failed"
                          : "Preparing..."}
                  </p>
                </div>
                {smsStatus === "sent" && (
                  <Check size={16} className="text-success-500" />
                )}
                {smsStatus === "sending" && (
                  <Loader2 size={16} className="animate-spin text-ink-400" />
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-success-50 text-success-500 flex items-center justify-center">
                  <Bell size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-900">
                    Email alerts sent
                  </p>
                  <p className="text-[11px] text-ink-400">
                    All contacts + admin notified
                  </p>
                </div>
                <Check size={16} className="text-success-500" />
              </div>
            </div>
          </Card>

          {/* Location */}
          {locationData?.address && (
            <Card className="mb-4 !p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={13} className="text-brand-600" />
                <span className="text-[10px] font-bold text-ink-400 uppercase">
                  Location Shared
                </span>
              </div>
              <p className="text-sm text-ink-800">{locationData.address}</p>
              {locationData.mapsLink && (
                <a
                  href={locationData.mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-600 font-semibold flex items-center gap-1 mt-1"
                >
                  <ExternalLink size={11} /> Google Maps
                </a>
              )}
            </Card>
          )}

          {/* Helper number */}
          <Card className="mb-4 !p-3.5 !bg-brand-50/50 !border-brand-200">
            <p className="text-[10px] font-bold text-brand-600 uppercase mb-0.5">
              Your Contact Shared
            </p>
            <p className="text-sm font-mono font-bold text-ink-900">
              +91 {helperPhone}
            </p>
          </Card>

          {/* Primary contact only */}
          {primaryContact && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-400 mb-2">
                Emergency Contact
              </p>
              <Card className="mb-4 !p-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-ink-900">
                      {primaryContact.name}
                    </span>
                    <Badge variant="brand" className="ml-2">
                      Primary
                    </Badge>
                    <p className="text-xs text-ink-400 mt-0.5">
                      {primaryContact.relation} • {primaryContact.maskedPhone}
                    </p>
                  </div>
                  {callStatus === "initiated" && (
                    <Badge variant="success">
                      <Check size={8} /> Called
                    </Badge>
                  )}
                </div>
              </Card>
            </>
          )}

          {/* Medical Info */}
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-400 mb-2">
            Medical Information
          </p>
          <div className="grid grid-cols-2 gap-2 responsive-grid-2 mb-3">
            <Card
              className={
                "text-center !p-3 " +
                (medicalInfo.bloodType && medicalInfo.bloodType !== "Unknown"
                  ? "!bg-brand-50 !border-brand-200"
                  : "")
              }
            >
              <Droplet size={14} className="text-brand-600 mx-auto mb-1" />
              <div className="text-[9px] text-ink-400 uppercase">Blood</div>
              <div className="text-xl font-black text-brand-600">
                {medicalInfo.bloodType || "—"}
              </div>
            </Card>
            <Card className="text-center !p-3">
              <Heart
                size={14}
                className={
                  (medicalInfo.organDonor
                    ? "text-success-500"
                    : "text-ink-300") + " mx-auto mb-1"
                }
              />
              <div className="text-[9px] text-ink-400 uppercase">
                Organ Donor
              </div>
              <div className="text-sm font-bold">
                {medicalInfo.organDonor ? "Yes" : "No"}
              </div>
            </Card>
          </div>
          {medicalInfo.allergies && (
            <Card className="mb-2 !p-3 !bg-brand-50/30 !border-brand-200">
              <div className="flex items-center gap-2 mb-1">
                <Activity size={12} className="text-brand-600" />
                <span className="text-[10px] font-bold text-brand-600 uppercase">
                  Allergies
                </span>
              </div>
              <p className="text-sm text-ink-800">{medicalInfo.allergies}</p>
            </Card>
          )}
          {medicalInfo.medicalConditions && (
            <Card className="mb-2 !p-3">
              <div className="flex items-center gap-2 mb-1">
                <Activity size={12} className="text-warning-500" />
                <span className="text-[10px] font-bold text-warning-500 uppercase">
                  Conditions
                </span>
              </div>
              <p className="text-sm text-ink-800">
                {medicalInfo.medicalConditions}
              </p>
            </Card>
          )}
          {medicalInfo.medications && (
            <Card className="mb-2 !p-3">
              <div className="flex items-center gap-2 mb-1">
                <Pill size={12} className="text-success-500" />
                <span className="text-[10px] font-bold text-success-500 uppercase">
                  Medications
                </span>
              </div>
              <p className="text-sm text-ink-800">{medicalInfo.medications}</p>
            </Card>
          )}

          {/* Emergency Services */}
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-400 mb-2 mt-5">
            Emergency Services
          </p>
          <div className="grid grid-cols-2 gap-2 responsive-grid-2 mb-6">
            <a
              href="tel:112"
              className="flex items-center gap-2 p-3.5 bg-brand-600 text-white rounded-xl font-bold text-sm active:scale-[0.97]"
            >
              <Siren size={16} /> Emergency 112
            </a>
            <a
              href="tel:108"
              className="flex items-center gap-2 p-3.5 bg-white border border-surface-300 rounded-xl font-bold text-sm text-ink-900 active:scale-[0.97]"
            >
              <Ambulance size={16} className="text-brand-600" /> Ambulance 108
            </a>
            <a
              href="tel:100"
              className="flex items-center gap-2 p-3.5 bg-white border border-surface-300 rounded-xl font-bold text-sm text-ink-900 active:scale-[0.97]"
            >
              <Shield size={16} className="text-blue-600" /> Police 100
            </a>
            <a
              href="tel:101"
              className="flex items-center gap-2 p-3.5 bg-white border border-surface-300 rounded-xl font-bold text-sm text-ink-900 active:scale-[0.97]"
            >
              <AlertTriangle size={16} className="text-orange-500" /> Fire 101
            </a>
          </div>
        </div>
      )}

      {/* ═══ CANCELLED ═══ */}
      {phase === "cancelled" && (
        <div className="pt-20 text-center">
          <div className="w-20 h-20 rounded-full bg-success-50 border-2 border-success-500 flex items-center justify-center mx-auto mb-5">
            <Check size={32} className="text-success-500" />
          </div>
          <h2 className="text-xl font-extrabold text-ink-900 mb-2">
            Cancelled
          </h2>
          <p className="text-sm text-ink-500 mb-6">
            No contacts were notified.
          </p>
          <Button
            full
            onClick={() => {
              setPhase(urlQrId ? "initial" : "scanner");
              setHelperPhone("");
            }}
          >
            Start Over
          </Button>
        </div>
      )}

      {/* ═══ NOT FOUND ═══ */}
      {phase === "not-found" && (
        <div className="pt-20 text-center">
          <div className="w-20 h-20 rounded-full bg-warning-50 border-2 border-warning-500 flex items-center justify-center mx-auto mb-5">
            <Search size={32} className="text-warning-500" />
          </div>
          <h2 className="text-xl font-extrabold text-ink-900 mb-2">
            Not Found
          </h2>
          <p className="text-sm text-ink-500 mb-2">{errorMsg}</p>
          <p className="text-sm text-ink-500 mb-6">
            If emergency, call <strong>112</strong> directly.
          </p>
          <a
            href="tel:112"
            className="block w-full py-4 rounded-2xl brand-gradient text-white text-base font-extrabold text-center mb-3"
          >
            Call 112
          </a>
          <Button
            full
            variant="secondary"
            onClick={() => {
              setPhase("scanner");
              setQrId("");
              setManualInput("");
            }}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* ═══ ERROR ═══ */}
      {phase === "error" && (
        <div className="pt-20 text-center">
          <div className="w-20 h-20 rounded-full bg-brand-50 border-2 border-brand-600 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle size={32} className="text-brand-600" />
          </div>
          <h2 className="text-xl font-extrabold text-ink-900 mb-2">Error</h2>
          <p className="text-sm text-ink-500 mb-6">{errorMsg}</p>
          <a
            href="tel:112"
            className="block w-full py-4 rounded-2xl brand-gradient text-white text-base font-extrabold text-center mb-3"
          >
            Call 112
          </a>
          <Button
            full
            variant="secondary"
            onClick={() => {
              setPhase("scanner");
              setQrId("");
              setManualInput("");
            }}
          >
            Try Again
          </Button>
        </div>
      )}
    </PageShell>
  );
}

export default function EmergencyScanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <EmergencyScanPageContent />
    </Suspense>
  );
}
