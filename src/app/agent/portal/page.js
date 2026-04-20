"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Scan,
  Phone,
  Send,
  Check,
  Plus,
  QrCode,
  LogOut,
  Loader2,
  Mail,
  Package,
  Copy,
  CheckCheck,
} from "lucide-react";
import { PageShell, PageHeader } from "@/components/layouts";
import { Button, Card, Input, Badge, ProgressSteps } from "@/components/ui";
import StickerTable from "@/components/ui/StickerTable";
import toast from "react-hot-toast";

// Dynamic imports prevent SSR — fixes "Cannot read properties of undefined" AdSense error
const InterstitialAd = dynamic(
  () => import("@/components/ads/InterstitialAd"),
  { ssr: false },
);
const GoogleAdBanner = dynamic(
  () => import("@/components/ads/GoogleAdBanner"),
  { ssr: false },
);

export default function AgentPortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState(null);
  const [activeTab, setActiveTab] = useState("onboard");
  const [step, setStep] = useState(0);
  const [qrId, setQrId] = useState("");
  const [qrInput, setQrInput] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [paymentDone, setPaymentDone] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [adminUpiQR, setAdminUpiQR] = useState(null);
  const [activating, setActivating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const getToken = () => {
    const match = document.cookie.match(/oncallrescue_token=([^;]+)/);
    return match ? match[1] : null;
  };

  const fetchAdminQR = async () => {
    if (adminUpiQR) return;
    try {
      const res = await fetch("/api/admin/settings?key=phonepe_qr");
      const data = await res.json();
      if (data.success && data.data.value) setAdminUpiQR(data.data.value);
    } catch {}
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/agent/login");
      return;
    }
    fetch("/api/agents/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAgent(data.data);
        else {
          toast.error("Session expired");
          router.push("/agent/login");
        }
      })
      .catch(() => router.push("/agent/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleScanSubmit = () => {
    const id = qrInput.trim().toUpperCase();
    if (!id) {
      toast.error("Enter the QR sticker ID");
      return;
    }
    setQrId(id);
    setStep(1);
    toast.success(`Sticker ${id} ready!`);
  };

  const handleActivate = async () => {
    setActivating(true);
    const token = getToken();
    try {
      const res = await fetch("/api/stickers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "activate",
          qrId,
          customerPhone: phone,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setStep(2);
        const meRes = await fetch("/api/agents/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meData = await meRes.json();
        if (meData.success) setAgent(meData.data);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to activate sticker");
    }
    setActivating(false);
  };

  const getRegLink = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/customer/register?qrId=${qrId}&phone=${phone}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getRegLink());
    setLinkCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const msg = encodeURIComponent(
      `Welcome to OnCallRescue! 🛡️\n\nYour emergency sticker (${qrId}) is activated.\n\nPlease complete your registration:\n${getRegLink()}\n\nThis links your emergency contacts to the QR sticker on your vehicle.`,
    );
    window.open(`https://wa.me/91${phone}?text=${msg}`, "_blank");
    toast.success("WhatsApp opened!");
  };

  const handleShareEmail = async () => {
    if (!email) {
      toast.error("No email provided");
      return;
    }
    setSendingEmail(true);
    const token = getToken();
    try {
      const res = await fetch("/api/send-registration-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          qrId,
          phone,
          registrationUrl: getRegLink(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailSent(true);
        toast.success("Email sent to " + email);
      } else toast.error(data.message);
    } catch {
      toast.error("Failed to send email");
    }
    setSendingEmail(false);
  };

  const handleReset = () => {
    setStep(0);
    setPhone("");
    setEmail("");
    setQrId("");
    setQrInput("");
    setPaymentDone(false);
    setPaymentMethod("cash");
    setLinkCopied(false);
    setEmailSent(false);
    setSendingEmail(false);
  };

  const handleLogout = () => {
    document.cookie = "oncallrescue_token=; path=/; max-age=0";
    document.cookie = "oncallrescue_role=; path=/; max-age=0";
    router.push("/agent/login");
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center pt-32">
          <Loader2 size={28} className="animate-spin text-brand-600" />
        </div>
      </PageShell>
    );
  }
  if (!agent) return null;

  return (
    <PageShell>
      {/* oncallrescue-agent-portal-interstitial — once per session */}
      <InterstitialAd storageKey="agent_portal_ad_shown" adSlot="3521789714" />

      <PageHeader
        title={`Hi, ${agent.fullName?.split(" ")[0]}`}
        subtitle="Agent Portal"
        action={
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-brand-600 transition-colors"
          >
            <LogOut size={13} /> Logout
          </button>
        }
      />

      {agent.status === "pending" && (
        <Card className="!bg-warning-50 !border-warning-100 mb-4">
          <p className="text-sm font-bold text-warning-600">
            Account Pending Verification
          </p>
          <p className="text-xs text-warning-500 mt-1">
            You can start selling once admin verifies your KYC.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-brand-50 rounded-xl p-3 text-center">
          <div className="text-xl font-extrabold text-brand-600">
            {agent.todaySales || 0}
          </div>
          <div className="text-[9px] font-bold text-ink-400 uppercase tracking-wider">
            Today
          </div>
        </div>
        <div className="bg-success-50 rounded-xl p-3 text-center">
          <div className="text-xl font-extrabold text-success-500">
            ₹{agent.todayRevenue || 0}
          </div>
          <div className="text-[9px] font-bold text-ink-400 uppercase tracking-wider">
            Revenue
          </div>
        </div>
        <div className="bg-warning-50 rounded-xl p-3 text-center">
          <div className="text-xl font-extrabold text-warning-500">
            {agent.stickersRemaining || 0}
          </div>
          <div className="text-[9px] font-bold text-ink-400 uppercase tracking-wider">
            Left
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-4 bg-surface-200 rounded-xl p-1">
        {[
          { key: "onboard", label: "Onboard", icon: <Plus size={13} /> },
          {
            key: "stickers",
            label: "My Stickers",
            icon: <Package size={13} />,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-white text-ink-900 shadow-soft"
                : "text-ink-400 hover:text-ink-600"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "onboard" && (
        <Card>
          <ProgressSteps
            steps={["Scan QR", "Details + Payment", "Share Link"]}
            current={step}
          />

          {step === 0 && (
            <div className="text-center py-4 animate-fade-up-in">
              <div className="w-20 h-20 rounded-2xl bg-surface-100 border-2 border-dashed border-surface-400 flex items-center justify-center mx-auto mb-4 text-ink-400">
                <Scan size={32} />
              </div>
              <p className="text-sm text-ink-500 mb-4">
                Enter the sticker ID from the QR sticker
              </p>
              <Input
                placeholder="e.g., LL-A8K3P2"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value.toUpperCase())}
                icon={<QrCode size={15} />}
              />
              <Button
                onClick={handleScanSubmit}
                disabled={!qrInput.trim() || agent.status !== "verified"}
                full
              >
                <Scan size={16} /> Verify & Continue
              </Button>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-surface-50 rounded-xl mb-4 border border-surface-300">
                <QrCode size={15} className="text-brand-600" />
                <span className="font-mono text-sm font-medium text-brand-600">
                  {qrId}
                </span>
                <Badge variant="success">
                  <Check size={10} /> Ready
                </Badge>
              </div>
              <Input
                label="Customer Phone Number"
                placeholder="10-digit mobile number"
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                required
                maxLength={10}
                icon={<Phone size={15} />}
              />
              <Input
                label="Customer Email (optional)"
                placeholder="customer@email.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={15} />}
                helper="Registration link will also be sent to email"
              />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 mb-2">
                Payment Method
              </p>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border ${paymentMethod === "cash" ? "bg-brand-50 border-brand-600 text-brand-600" : "bg-surface-50 border-surface-300 text-ink-400"}`}
                >
                  💵 Cash
                </button>
                <button
                  onClick={() => {
                    setPaymentMethod("upi");
                    fetchAdminQR();
                  }}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border ${paymentMethod === "upi" ? "bg-brand-50 border-brand-600 text-brand-600" : "bg-surface-50 border-surface-300 text-ink-400"}`}
                >
                  📱 UPI
                </button>
              </div>
              {paymentMethod === "upi" && (
                <div className="text-center mb-4">
                  {adminUpiQR ? (
                    <div className="bg-white border border-surface-300 rounded-xl p-4 inline-block mb-2">
                      <img
                        src={`data:${adminUpiQR.type || "image/png"};base64,${adminUpiQR.base64}`}
                        alt="UPI QR"
                        className="w-48 h-48 object-contain mx-auto"
                      />
                      <p className="text-xs text-ink-500 mt-2">
                        Customer scans to pay ₹199
                      </p>
                    </div>
                  ) : (
                    <div className="bg-warning-50 border border-warning-100 rounded-xl p-3 mb-2">
                      <p className="text-xs text-warning-600">
                        UPI QR not uploaded by admin yet. Use cash instead.
                      </p>
                    </div>
                  )}
                </div>
              )}
              <label
                onClick={() => setPaymentDone(!paymentDone)}
                className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all mb-4 ${paymentDone ? "bg-success-50 border border-success-500" : "bg-surface-50 border border-surface-300"}`}
              >
                <div
                  className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${paymentDone ? "bg-success-500 border-success-500" : "border-ink-300 bg-transparent"}`}
                >
                  {paymentDone && <Check size={14} className="text-white" />}
                </div>
                <div>
                  <div className="text-sm font-bold text-ink-900">
                    ₹199 Payment{" "}
                    {paymentMethod === "upi"
                      ? "Received via UPI"
                      : "Collected (Cash)"}
                  </div>
                  <div className="text-[11px] text-ink-400">
                    {paymentMethod === "upi"
                      ? "Confirm customer has paid"
                      : "Cash collected from customer"}
                  </div>
                </div>
              </label>
              <Button
                variant="success"
                full
                onClick={handleActivate}
                disabled={phone.length !== 10 || !paymentDone || activating}
              >
                {activating ? (
                  "Activating..."
                ) : (
                  <>
                    <Send size={15} /> Activate & Generate Link
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-4 animate-fade-up-in">
              <div className="w-16 h-16 rounded-full bg-success-50 border-2 border-success-500 flex items-center justify-center mx-auto mb-4">
                <Check size={28} className="text-success-500" />
              </div>
              <h3 className="text-lg font-extrabold text-ink-900 mb-1">
                Sticker Sold!
              </h3>
              <p className="text-xs text-ink-400 mb-4">
                <span className="font-mono text-brand-600">{qrId}</span> → +91{" "}
                {phone}
              </p>
              <div className="space-y-2 mb-4">
                <Button full onClick={handleShareWhatsApp} variant="success">
                  <Send size={14} /> Share via WhatsApp
                </Button>
                {email && (
                  <Button
                    full
                    onClick={handleShareEmail}
                    variant="secondary"
                    disabled={sendingEmail || emailSent}
                  >
                    {emailSent ? (
                      <>
                        <Check size={14} /> Email Sent to {email}
                      </>
                    ) : sendingEmail ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Sending
                        Email...
                      </>
                    ) : (
                      <>
                        <Mail size={14} /> Send Email to {email}
                      </>
                    )}
                  </Button>
                )}
                <Button full onClick={handleCopyLink} variant="ghost" size="sm">
                  {linkCopied ? (
                    <>
                      <CheckCheck size={13} /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={13} /> Copy Link
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-warning-50 border border-warning-100 rounded-xl p-3.5 mb-4 text-left">
                <p className="text-xs text-warning-600 leading-relaxed">
                  <strong>Hand the sticker to the customer.</strong> They'll
                  register using the link you shared. Once they complete
                  registration, the sticker goes live.
                </p>
              </div>
              <Button full onClick={handleReset}>
                <Plus size={15} /> Onboard Next Customer
              </Button>
            </div>
          )}
        </Card>
      )}

      {activeTab === "stickers" && agent._id && (
        <div>
          <StickerTable mode="agent" agentId={agent._id} />
        </div>
      )}

      <Card className="!p-3.5 mt-4">
        <div className="flex justify-between items-center">
          <span className="text-xs text-ink-400">Lifetime</span>
          <span className="text-sm font-bold text-ink-900">
            {agent.stickersSold || 0} sold • ₹
            {(agent.totalRevenue || 0).toLocaleString("en-IN")}
          </span>
        </div>
      </Card>

      <div className="mt-3 text-center">
        <a
          href="/agent/change-password"
          className="text-xs text-ink-400 hover:text-brand-600 transition-colors"
        >
          Change Password
        </a>
      </div>

      {/* oncallrescue-agent-portal-bottom */}
      <GoogleAdBanner adSlot="9895626377" className="mt-4" />
    </PageShell>
  );
}
