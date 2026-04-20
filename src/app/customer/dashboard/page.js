"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Phone,
  Bell,
  Eye,
  EyeOff,
  Edit,
  MapPin,
  Check,
  X,
  AlertTriangle,
  User,
  Loader2,
  LogOut,
  CreditCard,
  QrCode,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
  Lock,
  Upload,
  Settings,
  Home,
  Download,
  Share,
} from "lucide-react";
import { PageShell, PageHeader } from "@/components/layouts";
import { Button, Card, Badge, Select, Textarea } from "@/components/ui";
import toast from "react-hot-toast";

const FAQS = [
  {
    q: "What is OnCallRescue?",
    a: "OnCallRescue is an emergency medical ID system. A QR sticker on your vehicle allows any bystander to scan it during an emergency and instantly alert your family — without needing access to your phone.",
  },
  {
    q: "How does the QR work?",
    a: "A bystander scans your QR → enters their mobile number → taps Emergency → 5-second countdown (you get notified and can cancel) → if not cancelled, your primary contact receives an automated call + SMS, and emails are sent to all your emergency contacts with the bystander's location and phone number.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. Your real phone numbers are never shown to the bystander. They only see masked numbers. Calls go through our virtual number. Only blood type and allergies are revealed during emergencies. Every scan is logged with time, location, and device info.",
  },
  {
    q: "Who gets notified during an emergency?",
    a: "Your primary contact gets an automated voice call + SMS. Both primary and secondary contacts receive email alerts with the bystander's location and Google Maps link. Our admin is also notified and can manually call your secondary contact.",
  },
  {
    q: "What are call credits?",
    a: "Each emergency trigger uses 1 credit (covers the call + SMS to primary contact). You get 5 credits with your ₹199 purchase. Cancelled emergencies (owner taps 'I'm Safe' within 5 seconds) don't use credits.",
  },
  {
    q: "How to recharge credits?",
    a: "Go to the Recharge tab in your dashboard → pay ₹49 via the UPI QR shown → upload your payment screenshot → admin verifies and adds 5 credits to your account.",
  },
  {
    q: "Can I temporarily disable scanning?",
    a: "Yes. Go to Settings tab → toggle 'Pause Scanning'. Your QR sticker won't trigger any emergency until you re-enable it. Useful when your vehicle is parked at home.",
  },
  {
    q: "What does the bystander need to do?",
    a: "Just scan the QR sticker with their phone camera, enter their mobile number, and tap the emergency button. No app download needed — it works in the browser. Their number and location are shared with your contacts so they can coordinate.",
  },
  {
    q: "What if my sticker is damaged?",
    a: "Contact us via the Support tab in your dashboard. We'll arrange a replacement sticker linked to your existing profile.",
  },
  {
    q: "How do I update my emergency contacts?",
    a: "Go to Settings → Edit Profile. You can update your primary and secondary contacts, medical info, and notification emails anytime.",
  },
];

function InstallButton() {
  const [prompt, setPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone;
    if (standalone) {
      setInstalled(true);
      return;
    }
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (prompt) {
      prompt.prompt();
      const r = await prompt.userChoice;
      if (r.outcome === "accepted") setInstalled(true);
    }
  };

  if (installed) return null;
  if (prompt) {
    return (
      <button
        onClick={handleInstall}
        className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 px-2.5 py-1.5 rounded-lg transition-all"
      >
        <Download size={12} /> Install
      </button>
    );
  }
  if (isIOS) {
    return (
      <span className="text-[10px] text-ink-400 flex items-center gap-1">
        <Share size={10} /> → Add to Home
      </span>
    );
  }
  return null;
}

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [scanLogs, setScanLogs] = useState([]);
  const [sticker, setSticker] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [togglingScans, setTogglingScans] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [paymentQR, setPaymentQR] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [submittingRecharge, setSubmittingRecharge] = useState(false);
  const [rechargeRequests, setRechargeRequests] = useState([]);
  const fileRef = useRef(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [showQueryForm, setShowQueryForm] = useState(false);
  const [queryForm, setQueryForm] = useState({ type: "query", message: "" });
  const [sendingQuery, setSendingQuery] = useState(false);

  const getToken = () =>
    document.cookie.match(/oncallrescue_token=([^;]+)/)?.[1];

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push("/customer/login");
      return;
    }
    try {
      const res = await fetch("/api/customers/me", {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (data.success) {
        setCustomer(data.data.customer);
        setScanLogs(data.data.scanLogs || []);
        setSticker(data.data.sticker);
      } else {
        router.push("/customer/login");
        return;
      }
    } catch {
      router.push("/customer/login");
      return;
    }
    setLoading(false);
  }, [router]);

  const fetchRechargeData = useCallback(async () => {
    if (!customer) return;
    try {
      const [qrRes, reqRes] = await Promise.all([
        fetch("/api/admin/settings?key=phonepe_qr"),
        fetch("/api/recharge?customerId=" + customer._id),
      ]);
      const qrData = await qrRes.json();
      const reqData = await reqRes.json();
      if (qrData.success && qrData.data.value) setPaymentQR(qrData.data.value);
      if (reqData.success) setRechargeRequests(reqData.data.items);
    } catch {}
  }, [customer]);

  const fetchFeedbacks = useCallback(async () => {
    if (!customer) return;
    try {
      const res = await fetch("/api/feedback?status=all");
      const data = await res.json();
      if (data.success) {
        setFeedbacks(data.data.items.filter((f) => f.phone === customer.phone));
      }
    } catch {}
  }, [customer]);

  useEffect(() => {
    const role = document.cookie.match(/oncallrescue_role=([^;]+)/);
    if (!role || role[1] !== "customer") {
      router.push("/customer/login");
      return;
    }
    fetchData();
  }, [fetchData, router]);

  useEffect(() => {
    if (customer && activeTab === "recharge") fetchRechargeData();
    if (customer && activeTab === "support") fetchFeedbacks();
  }, [customer, activeTab, fetchRechargeData, fetchFeedbacks]);

  const handleToggleScan = async () => {
    const token = getToken();
    if (!token || !customer) return;
    setTogglingScans(true);
    try {
      const res = await fetch("/api/customers/toggle-scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ enabled: !customer.scanEnabled }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomer((p) => ({ ...p, scanEnabled: data.data.scanEnabled }));
        toast.success(data.message);
      } else toast.error(data.message);
    } catch {
      toast.error("Failed");
    }
    setTogglingScans(false);
  };

  const handleLogout = () => {
    document.cookie = "oncallrescue_token=; path=/; max-age=0";
    document.cookie = "oncallrescue_role=; path=/; max-age=0";
    router.push("/customer/login");
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Images only");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshot({ base64: reader.result.split(",")[1], type: file.type });
      setScreenshotPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitRecharge = async () => {
    if (!screenshot || !customer) return;
    setSubmittingRecharge(true);
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
        setScreenshot(null);
        setScreenshotPreview(null);
        fetchRechargeData();
      } else toast.error(data.message);
    } catch {
      toast.error("Failed");
    }
    setSubmittingRecharge(false);
  };

  const handleSubmitQuery = async () => {
    if (!queryForm.message.trim()) {
      toast.error("Enter your message");
      return;
    }
    setSendingQuery(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customer.fullName,
          phone: customer.phone,
          email: "",
          type: queryForm.type,
          message: queryForm.message,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setQueryForm({ type: "query", message: "" });
        setShowQueryForm(false);
        fetchFeedbacks();
      } else toast.error(data.message);
    } catch {
      toast.error("Failed");
    }
    setSendingQuery(false);
  };

  const formatTime = (d) => {
    if (!d) return "—";
    const date = new Date(d);
    const now = new Date();
    const diff = Math.floor((now - date) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return diff + "m ago";
    if (diff < 1440) return Math.floor(diff / 60) + "h ago";
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  if (loading)
    return (
      <PageShell>
        <div className="flex items-center justify-center pt-32">
          <Loader2 size={28} className="animate-spin text-brand-600" />
        </div>
      </PageShell>
    );
  if (!customer) return null;

  const primaryContact = customer.emergencyContacts?.find((c) => c.isPrimary);
  const tabs = [
    { key: "home", label: "Home", icon: <Home size={13} /> },
    { key: "recharge", label: "Recharge", icon: <CreditCard size={13} /> },
    { key: "support", label: "Support", icon: <HelpCircle size={13} /> },
    { key: "settings", label: "Settings", icon: <Settings size={13} /> },
  ];

  return (
    <PageShell>
      <PageHeader
        title={"Hi, " + (customer.fullName?.split(" ")[0] || "")}
        subtitle="Your Emergency Dashboard"
        action={
          <div className="flex items-center gap-3">
            <InstallButton />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs text-ink-400 hover:text-brand-600"
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        }
      />

      {activeAlert && (
        <Card className="!bg-brand-50 !border-brand-600 mb-4 animate-fade-up-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0 emergency-ripple">
              <Bell size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-brand-700">
                Emergency Alert!
              </p>
              <Button
                variant="success"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setActiveAlert(null);
                  toast.success("Cancelled!");
                }}
              >
                <Check size={13} /> I'm Safe
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="flex gap-1 mb-4 bg-surface-200 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={
              "flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg text-[11px] font-semibold transition-all " +
              (activeTab === tab.key
                ? "bg-white text-ink-900 shadow-soft"
                : "text-ink-400")
            }
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "home" && (
        <div className="">
          <Card className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-base font-bold text-ink-900">
                    {customer.fullName}
                  </p>
                  <p className="text-xs text-ink-400">
                    {customer.vehicleNumber || "No vehicle"} • {customer.phone}
                  </p>
                </div>
              </div>
              <Badge variant={customer.scanEnabled ? "success" : "neutral"}>
                {customer.scanEnabled ? (
                  <>
                    <Eye size={10} /> Active
                  </>
                ) : (
                  <>
                    <EyeOff size={10} /> Paused
                  </>
                )}
              </Badge>
            </div>
          </Card>

          {sticker && (
            <Card className="mb-4 !p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode size={14} className="text-brand-600" />
                  <span className="font-mono text-xs font-bold text-brand-600">
                    {sticker.qrId}
                  </span>
                  <Badge
                    variant={
                      sticker.status === "active" ? "success" : "warning"
                    }
                  >
                    {sticker.status}
                  </Badge>
                </div>
                {sticker.emergencyCount > 0 && (
                  <Badge variant="brand">
                    <AlertTriangle size={8} /> {sticker.emergencyCount}
                  </Badge>
                )}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-3 gap-2 mb-4">
            <Card className="text-center !p-3">
              <p className="text-lg font-extrabold text-brand-600">
                {customer.bloodType || "—"}
              </p>
              <p className="text-[9px] font-bold text-ink-400 uppercase">
                Blood
              </p>
            </Card>
            <Card className="text-center !p-3">
              <p className="text-lg font-extrabold text-success-500">
                {customer.emergencyContacts?.length || 0}
              </p>
              <p className="text-[9px] font-bold text-ink-400 uppercase">
                Contacts
              </p>
            </Card>
            <Card
              className="text-center !p-3 cursor-pointer"
              onClick={() => setActiveTab("recharge")}
            >
              <p
                className={
                  "text-lg font-extrabold " +
                  ((customer.callCredits || 0) > 3
                    ? "text-success-500"
                    : "text-warning-500")
                }
              >
                {customer.callCredits || 0}
              </p>
              <p className="text-[9px] font-bold text-ink-400 uppercase">
                Credits
              </p>
            </Card>
          </div>

          {(customer.callCredits || 0) <= 3 && (
            <Card className="!bg-warning-50 !border-warning-100 mb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle size={16} className="text-warning-500" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-warning-600">
                    Low Credits
                  </p>
                  <p className="text-xs text-warning-500">
                    Only {customer.callCredits || 0} calls left
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("recharge")}
                >
                  Recharge
                </Button>
              </div>
            </Card>
          )}

          {primaryContact && (
            <Card className="mb-4 !bg-brand-50/50 !border-brand-200 !p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <Phone size={13} className="text-brand-600" />
                <span className="text-[10px] font-bold text-brand-600 uppercase">
                  Primary Contact
                </span>
              </div>
              <p className="text-sm font-bold text-ink-900">
                {primaryContact.name}
              </p>
              <p className="text-xs text-ink-400">{primaryContact.relation}</p>
            </Card>
          )}

          {(customer.allergies ||
            customer.medicalConditions ||
            customer.medications) && (
            <div className="mb-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400 mb-2">
                Medical Info
              </h3>
              {customer.allergies && (
                <Card className="mb-2 !p-3">
                  <span className="text-[10px] font-bold text-brand-600 uppercase">
                    Allergies:{" "}
                  </span>
                  <span className="text-xs text-ink-700">
                    {customer.allergies}
                  </span>
                </Card>
              )}
              {customer.medicalConditions && (
                <Card className="mb-2 !p-3">
                  <span className="text-[10px] font-bold text-warning-500 uppercase">
                    Conditions:{" "}
                  </span>
                  <span className="text-xs text-ink-700">
                    {customer.medicalConditions}
                  </span>
                </Card>
              )}
              {customer.medications && (
                <Card className="!p-3">
                  <span className="text-[10px] font-bold text-success-500 uppercase">
                    Medications:{" "}
                  </span>
                  <span className="text-xs text-ink-700">
                    {customer.medications}
                  </span>
                </Card>
              )}
            </div>
          )}

          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400 mb-2">
            Scan History
          </h3>
          {scanLogs.length === 0 ? (
            <Card className="text-center py-6">
              <Shield size={20} className="text-ink-300 mx-auto mb-2" />
              <p className="text-xs text-ink-400">No scans yet</p>
            </Card>
          ) : (
            scanLogs.map((scan) => (
              <Card key={scan._id} className="mb-2 !p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={
                        "w-8 h-8 rounded-lg flex items-center justify-center " +
                        (scan.status === "triggered"
                          ? "bg-brand-50 text-brand-600"
                          : scan.status === "cancelled"
                            ? "bg-surface-200 text-ink-400"
                            : "bg-success-50 text-success-500")
                      }
                    >
                      {scan.status === "cancelled" ? (
                        <X size={14} />
                      ) : scan.status === "triggered" ? (
                        <AlertTriangle size={14} />
                      ) : (
                        <Check size={14} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink-900">
                        {formatTime(scan.createdAt)}
                      </p>
                      {scan.scannerLocation?.address && (
                        <p className="text-[11px] text-ink-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} />
                          {scan.scannerLocation.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      scan.status === "triggered"
                        ? "brand"
                        : scan.status === "cancelled"
                          ? "neutral"
                          : "success"
                    }
                  >
                    {scan.status}
                  </Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === "recharge" && (
        <div className="">
          <Card className="mb-4 !p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-ink-400 font-semibold">
                  Current Credits
                </p>
                <p
                  className={
                    "text-2xl font-extrabold " +
                    ((customer.callCredits || 0) > 3
                      ? "text-success-500"
                      : "text-warning-500")
                  }
                >
                  {customer.callCredits || 0}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold text-brand-600">₹49</p>
                <p className="text-[10px] text-ink-400">5 calls</p>
              </div>
            </div>
          </Card>

          {paymentQR ? (
            <Card className="mb-4 text-center">
              <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-3">
                Step 1: Pay via UPI
              </p>
              <div className="inline-block bg-white p-3 rounded-xl border border-surface-300 mb-3">
                <img
                  src={
                    "data:" +
                    (paymentQR.type || "image/png") +
                    ";base64," +
                    paymentQR.base64
                  }
                  alt="Pay QR"
                  className="w-48 h-48 object-contain"
                />
              </div>
              <p className="text-xs text-ink-500">
                Scan with PhonePe, GPay, or any UPI app
              </p>
            </Card>
          ) : (
            <Card className="mb-4 !bg-warning-50 !border-warning-100">
              <p className="text-sm font-bold text-warning-600">
                Payment QR not available yet
              </p>
              <p className="text-xs text-warning-500 mt-1">
                Contact support for recharge assistance.
              </p>
            </Card>
          )}

          <Card className="mb-4">
            <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-3">
              Step 2: Upload Screenshot
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {screenshotPreview ? (
              <div className="mb-3">
                <img
                  src={screenshotPreview}
                  alt="Screenshot"
                  className="w-full max-h-48 object-contain rounded-xl border border-surface-300 mb-2"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  full
                  onClick={() => {
                    setScreenshot(null);
                    setScreenshotPreview(null);
                  }}
                >
                  <X size={13} /> Remove
                </Button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full py-6 border-2 border-dashed border-surface-400 rounded-xl flex flex-col items-center gap-2 text-ink-400 hover:border-brand-300 hover:text-brand-600 transition-all mb-3"
              >
                <Upload size={24} />
                <span className="text-sm font-semibold">
                  Upload payment screenshot
                </span>
                <span className="text-[10px]">Max 5MB</span>
              </button>
            )}
            <Button
              full
              onClick={handleSubmitRecharge}
              disabled={!screenshot || submittingRecharge}
            >
              {submittingRecharge ? (
                "Submitting..."
              ) : (
                <>
                  <Send size={14} /> Submit for Verification
                </>
              )}
            </Button>
          </Card>

          {rechargeRequests.length > 0 && (
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400 mb-2">
                History
              </h3>
              {rechargeRequests.map((req) => (
                <Card key={req._id} className="mb-2 !p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-ink-900">
                        ₹{req.amount}
                      </span>
                      <span className="text-xs text-ink-400 ml-1">
                        → {req.credits} credits
                      </span>
                      <p className="text-[10px] text-ink-400 mt-0.5">
                        {formatTime(req.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        req.status === "approved"
                          ? "success"
                          : req.status === "rejected"
                            ? "brand"
                            : "warning"
                      }
                    >
                      {req.status}
                    </Badge>
                  </div>
                  {req.adminNote && (
                    <p className="text-[11px] text-ink-500 mt-1 border-l-2 border-surface-300 pl-2">
                      {req.adminNote}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "support" && (
        <div className="">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400 mb-2">
            FAQ
          </h3>
          <div className="mb-5">
            {FAQS.map((faq, i) => (
              <Card
                key={i}
                className={
                  "mb-1.5 !p-0 overflow-hidden cursor-pointer " +
                  (openFaq === i ? "!border-brand-200" : "")
                }
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="flex items-center justify-between p-3.5">
                  <span className="text-sm font-semibold text-ink-900 pr-4">
                    {faq.q}
                  </span>
                  {openFaq === i ? (
                    <ChevronUp
                      size={14}
                      className="text-ink-400 flex-shrink-0"
                    />
                  ) : (
                    <ChevronDown
                      size={14}
                      className="text-ink-400 flex-shrink-0"
                    />
                  )}
                </div>
                {openFaq === i && (
                  <div className="px-3.5 pb-3.5 pt-0">
                    <p className="text-sm text-ink-600 leading-relaxed border-l-2 border-brand-100 pl-3">
                      {faq.a}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400">
              My Queries
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQueryForm(!showQueryForm)}
            >
              {showQueryForm ? (
                <>
                  <X size={12} /> Cancel
                </>
              ) : (
                <>
                  <MessageSquare size={12} /> New Query
                </>
              )}
            </Button>
          </div>

          {showQueryForm && (
            <Card className="mb-3 animate-fade-up-in">
              <Select
                label="Type"
                value={queryForm.type}
                onChange={(e) =>
                  setQueryForm((p) => ({ ...p, type: e.target.value }))
                }
                options={[
                  { value: "query", label: "Query" },
                  { value: "feedback", label: "Feedback" },
                  { value: "complaint", label: "Complaint" },
                  { value: "suggestion", label: "Suggestion" },
                ]}
              />
              <Textarea
                label="Message"
                placeholder="How can we help?"
                value={queryForm.message}
                onChange={(e) =>
                  setQueryForm((p) => ({ ...p, message: e.target.value }))
                }
                rows={3}
              />
              <Button
                full
                onClick={handleSubmitQuery}
                disabled={!queryForm.message.trim() || sendingQuery}
              >
                {sendingQuery ? (
                  "Sending..."
                ) : (
                  <>
                    <Send size={13} /> Submit
                  </>
                )}
              </Button>
            </Card>
          )}

          {feedbacks.length === 0 && !showQueryForm ? (
            <Card className="text-center py-6">
              <MessageSquare size={20} className="text-ink-300 mx-auto mb-2" />
              <p className="text-xs text-ink-400">
                No queries yet. Tap "New Query" to ask us anything.
              </p>
            </Card>
          ) : (
            feedbacks.map((fb) => (
              <Card key={fb._id} className="mb-2 !p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <Badge
                    variant={
                      fb.type === "complaint"
                        ? "brand"
                        : fb.type === "feedback"
                          ? "success"
                          : "warning"
                    }
                  >
                    {fb.type}
                  </Badge>
                  <Badge
                    variant={
                      fb.status === "open"
                        ? "warning"
                        : fb.status === "replied"
                          ? "success"
                          : "neutral"
                    }
                  >
                    {fb.status}
                  </Badge>
                </div>
                <p className="text-sm text-ink-800 mb-1">{fb.message}</p>
                <p className="text-[10px] text-ink-400">
                  {formatTime(fb.createdAt)}
                </p>
                {fb.adminReply && (
                  <div className="mt-2 bg-success-50 border border-success-100 rounded-lg p-2.5">
                    <p className="text-[10px] font-bold text-success-600 mb-0.5">
                      Admin Reply
                    </p>
                    <p className="text-xs text-success-700">{fb.adminReply}</p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === "settings" && (
        <div className="animate-fade-up-in space-y-2">
          <Card
            hover
            onClick={handleToggleScan}
            className={"!p-4 " + (togglingScans ? "opacity-50" : "")}
          >
            <div className="flex items-center gap-3">
              {customer.scanEnabled ? (
                <EyeOff size={18} className="text-warning-500" />
              ) : (
                <Eye size={18} className="text-success-500" />
              )}
              <div className="flex-1">
                <p className="text-sm font-bold text-ink-900">
                  {customer.scanEnabled ? "Pause Scanning" : "Enable Scanning"}
                </p>
                <p className="text-xs text-ink-400">
                  {customer.scanEnabled
                    ? "QR won't work until re-enabled"
                    : "Re-enable emergency scanning"}
                </p>
              </div>
              <Badge variant={customer.scanEnabled ? "success" : "neutral"}>
                {customer.scanEnabled ? "ON" : "OFF"}
              </Badge>
            </div>
          </Card>

          <Link href={"/customer/register?edit=true&phone=" + customer.phone}>
            <Card hover className="!p-4">
              <div className="flex items-center gap-3">
                <Edit size={18} className="text-brand-600" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-ink-900">Edit Profile</p>
                  <p className="text-xs text-ink-400">
                    Update personal, medical, and contact info
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/customer/change-password">
            <Card hover className="!p-4">
              <div className="flex items-center gap-3">
                <Lock size={18} className="text-ink-600" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-ink-900">
                    Change Password
                  </p>
                  <p className="text-xs text-ink-400">
                    Update your login password
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Card className="!p-4 !bg-surface-50">
            <p className="text-[10px] font-bold text-ink-400 uppercase tracking-wider mb-2">
              Account
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-xs text-ink-400">Phone</span>
                <span className="text-xs font-mono text-ink-700">
                  {customer.phone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-ink-400">QR ID</span>
                <span className="text-xs font-mono text-brand-600">
                  {customer.qrId || sticker?.qrId || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-ink-400">Vehicle</span>
                <span className="text-xs text-ink-700">
                  {customer.vehicleNumber || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-ink-400">Joined</span>
                <span className="text-xs text-ink-700">
                  {new Date(customer.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
