"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard, Upload, Check, Clock, X, Loader2,
  AlertTriangle, Image, ArrowLeft, Shield,
} from "lucide-react";
import { PageShell, PageHeader } from "@/components/layouts";
import { Button, Card, Badge } from "@/components/ui";
import toast from "react-hot-toast";

export default function RechargePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [paymentQR, setPaymentQR] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myRequests, setMyRequests] = useState([]);

  const getToken = () => {
    const match = document.cookie.match(/oncallrescue_token=([^;]+)/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    const role = document.cookie.match(/oncallrescue_role=([^;]+)/);
    if (!role || role[1] !== "customer") {
      router.push("/customer/login");
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    const token = getToken();
    try {
      // Fetch customer profile
      const meRes = await fetch("/api/customers/me", { headers: { Authorization: `Bearer ${token}` } });
      const meData = await meRes.json();
      if (meData.success) {
        setCustomer(meData.data.customer);

        // Fetch my recharge requests
        const reqRes = await fetch(`/api/recharge?customerId=${meData.data.customer._id}`);
        const reqData = await reqRes.json();
        if (reqData.success) setMyRequests(reqData.data.items);
      } else {
        router.push("/customer/login");
        return;
      }

      // Fetch payment QR
      const qrRes = await fetch("/api/admin/settings?key=phonepe_qr");
      const qrData = await qrRes.json();
      if (qrData.success && qrData.data.value) {
        setPaymentQR(qrData.data.value);
      }
    } catch {
      toast.error("Failed to load data");
    }
    setLoading(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max 5MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files allowed");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      setScreenshot({ base64, type: file.type, name: file.name });
      setScreenshotPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!screenshot || !customer) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request",
          customerId: customer._id,
          customerPhone: customer.phone,
          customerName: customer.fullName,
          screenshotBase64: screenshot.base64,
          screenshotType: screenshot.type,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setSubmitted(true);
        setScreenshot(null);
        setScreenshotPreview(null);
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to submit");
    }
    setSubmitting(false);
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return <PageShell><div className="flex items-center justify-center pt-32"><Loader2 size={28} className="animate-spin text-brand-600" /></div></PageShell>;
  }

  return (
    <PageShell>
      <PageHeader title="Recharge Credits" subtitle="₹49 for 5 emergency calls" backHref="/customer/dashboard" />

      {/* Current Credits */}
      <Card className="mb-4 !p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-400 font-semibold">Current Credits</p>
            <p className={`text-2xl font-extrabold ${(customer?.callCredits || 0) > 3 ? "text-success-500" : "text-warning-500"}`}>
              {customer?.callCredits || 0}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-400">Recharge Pack</p>
            <p className="text-lg font-extrabold text-brand-600">₹49</p>
            <p className="text-[10px] text-ink-400">5 emergency calls</p>
          </div>
        </div>
      </Card>

      {/* Payment QR */}
      {paymentQR ? (
        <Card className="mb-4 text-center">
          <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-3">Step 1: Pay via PhonePe / UPI</p>
          <div className="inline-block bg-white p-3 rounded-xl border border-surface-300 mb-3">
            <img
              src={`data:${paymentQR.type || "image/png"};base64,${paymentQR.base64}`}
              alt="Payment QR"
              className="w-48 h-48 object-contain"
            />
          </div>
          <p className="text-xs text-ink-500">Scan this QR with PhonePe, Google Pay, or any UPI app</p>
          <p className="text-lg font-extrabold text-brand-600 mt-1">Pay ₹49</p>
        </Card>
      ) : (
        <Card className="mb-4 !bg-warning-50 !border-warning-100">
          <div className="flex items-center gap-3">
            <CreditCard size={18} className="text-warning-500" />
            <div>
              <p className="text-sm font-bold text-warning-600">Payment Gateway Coming Soon</p>
              <p className="text-xs text-warning-500 mt-0.5">Admin hasn't uploaded the payment QR yet. Please contact support.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Upload Screenshot */}
      {!submitted ? (
        <Card className="mb-4">
          <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-3">Step 2: Upload Payment Screenshot</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {screenshotPreview ? (
            <div className="mb-3">
              <div className="rounded-xl border border-surface-300 overflow-hidden mb-2">
                <img src={screenshotPreview} alt="Screenshot" className="w-full max-h-64 object-contain bg-surface-50" />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => { setScreenshot(null); setScreenshotPreview(null); }} className="flex-1">
                  <X size={13} /> Remove
                </Button>
                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="flex-1">
                  <Image size={13} /> Change
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-surface-400 rounded-xl flex flex-col items-center justify-center gap-2 text-ink-400 hover:border-brand-300 hover:text-brand-600 transition-all mb-3"
            >
              <Upload size={24} />
              <span className="text-sm font-semibold">Tap to upload screenshot</span>
              <span className="text-[10px] text-ink-300">JPG, PNG • Max 5MB</span>
            </button>
          )}

          <Button
            full
            onClick={handleSubmit}
            disabled={!screenshot || submitting}
          >
            {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : <><Send size={14} /> Submit for Verification</>}
          </Button>
        </Card>
      ) : (
        <Card className="mb-4 !bg-success-50 !border-success-500 text-center">
          <Check size={28} className="text-success-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-success-600">Recharge Request Submitted!</p>
          <p className="text-xs text-success-500 mt-1">Admin will verify your payment and add credits within 24 hours.</p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => setSubmitted(false)}>
            Submit Another
          </Button>
        </Card>
      )}

      {/* My Recharge History */}
      {myRequests.length > 0 && (
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400 mb-3">Recharge History</h3>
          {myRequests.map((req) => (
            <Card key={req._id} className="mb-2 !p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-ink-900">₹{req.amount}</span>
                    <span className="text-xs text-ink-400">→ {req.credits} credits</span>
                  </div>
                  <p className="text-[10px] text-ink-400 mt-0.5">{formatDate(req.createdAt)}</p>
                </div>
                <Badge variant={req.status === "approved" ? "success" : req.status === "rejected" ? "brand" : "warning"}>
                  {req.status === "approved" && <Check size={9} />}
                  {req.status === "pending" && <Clock size={9} />}
                  {req.status === "rejected" && <X size={9} />}
                  {req.status}
                </Badge>
              </div>
              {req.adminNote && (
                <p className="text-[11px] text-ink-500 mt-1 pl-0 border-l-2 border-surface-300 ml-0 pl-2">{req.adminNote}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
