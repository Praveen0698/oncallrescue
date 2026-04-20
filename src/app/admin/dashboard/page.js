"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, Users, QrCode, TrendingUp, Phone,
  Check, X, Clock, MapPin, Eye, Package, AlertTriangle,
  LogOut, Loader2, BarChart3, UserCheck, UserX, Plus,
  CreditCard, MessageSquare, Upload, Image, Send, ChevronDown, IndianRupee,
} from "lucide-react";
import { PageShell, PageHeader } from "@/components/layouts";
import { Button, Card, Badge, Input } from "@/components/ui";
import StickerTable from "@/components/ui/StickerTable";
import toast from "react-hot-toast";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [agents, setAgents] = useState([]);
  const [scans, setScans] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [stickerCount, setStickerCount] = useState("50");
  const [creatingStickers, setCreatingStickers] = useState(false);
  const [allocateAgentId, setAllocateAgentId] = useState("");
  const [allocateCount, setAllocateCount] = useState("50");
  const [allocating, setAllocating] = useState(false);

  const getToken = () => {
    const match = document.cookie.match(/oncallrescue_token=([^;]+)/);
    return match ? match[1] : null;
  };

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push("/admin/login"); return; }

    try {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setStats(data.data.overview);
        setAgents(data.data.topAgents);
        setScans(data.data.recentScans);
      } else {
        toast.error("Session expired");
        router.push("/admin/login");
      }
    } catch {
      toast.error("Failed to load data");
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const role = document.cookie.match(/oncallrescue_role=([^;]+)/);
    if (!role || role[1] !== "admin") {
      router.push("/admin/login");
      return;
    }
    fetchData();
  }, [fetchData, router]);

  const handleLogout = () => {
    document.cookie = "oncallrescue_token=; path=/; max-age=0";
    document.cookie = "oncallrescue_role=; path=/; max-age=0";
    router.push("/admin/login");
  };

  const handleAgentAction = async (agentId, action) => {
    const token = getToken();
    try {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ agentId, action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Action failed");
    }
  };

  const handleCreateStickers = async () => {
    const token = getToken();
    setCreatingStickers(true);
    try {
      const res = await fetch("/api/stickers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "batch-create", count: parseInt(stickerCount) || 50 }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to create stickers");
    }
    setCreatingStickers(false);
  };

  const handleAllocateStickers = async () => {
    if (!allocateAgentId) { toast.error("Select an agent"); return; }
    const token = getToken();
    setAllocating(true);
    try {
      const res = await fetch("/api/stickers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "allocate-to-agent", agentId: allocateAgentId, count: parseInt(allocateCount) || 50 }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setAllocateAgentId("");
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to allocate stickers");
    }
    setAllocating(false);
  };

  if (loading) {
    return (
      <PageShell maxWidth="max-w-2xl">
        <div className="flex items-center justify-center pt-32">
          <Loader2 size={28} className="animate-spin text-brand-600" />
        </div>
      </PageShell>
    );
  }

  const tabs = [
    { key: "overview", label: "Overview", icon: <BarChart3 size={14} /> },
    { key: "agents", label: "Agents", icon: <Users size={14} /> },
    { key: "stickers", label: "Stickers", icon: <QrCode size={14} /> },
    { key: "settlements", label: "Settle", icon: <IndianRupee size={14} /> },
    { key: "recharge", label: "Recharge", icon: <CreditCard size={14} /> },
    { key: "support", label: "Support", icon: <MessageSquare size={14} /> },
    { key: "scans", label: "Scans", icon: <Eye size={14} /> },
  ];

  const formatTime = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.floor((now - d) / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)} hr ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <PageShell maxWidth="max-w-2xl">
      <PageHeader
        title="Admin Dashboard"
        subtitle="OnCallRescue Operations"
        action={
          <button onClick={handleLogout} className="flex items-center gap-1 text-xs text-ink-400 hover:text-brand-600 transition-colors">
            <LogOut size={13} /> Logout
          </button>
        }
      />

      {/* Tabs  ll-rjcs5y */}
      <div className="flex flex-wrap gap-1 mb-6 bg-surface-200 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.key ? "bg-white text-ink-900 shadow-soft" : "text-ink-400 hover:text-ink-600"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {activeTab === "overview" && stats && (
        <div className="">
          {/* Revenue */}
          <Card className="!bg-ink-900 mb-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600/10 rounded-full -translate-y-8 translate-x-8" />
            <div className="relative z-10">
              <p className="text-[10px] font-bold font-mono text-white/50 uppercase tracking-wider mb-1">Total Revenue</p>
              <p className="text-3xl font-black text-white">₹{(stats.totalRevenue || 0).toLocaleString("en-IN")}</p>
              <p className="text-xs text-white/50 mt-1">{stats.activatedStickers} stickers × ₹199</p>
              <div className="flex gap-4 mt-3 pt-3 border-t border-white/10">
                <div>
                  <p className="text-lg font-bold text-white">{stats.todaySales || 0}</p>
                  <p className="text-[9px] text-white/40 uppercase">Today's Sales</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">₹{(stats.todayRevenue || 0).toLocaleString("en-IN")}</p>
                  <p className="text-[9px] text-white/40 uppercase">Today's Revenue</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <Card className="!p-4">
              <div className="flex items-center gap-2 mb-2">
                <QrCode size={14} className="text-brand-600" />
                <span className="text-[10px] font-bold text-ink-400 uppercase">Stickers</span>
              </div>
              <p className="text-2xl font-extrabold text-ink-900">{stats.activatedStickers}</p>
              <p className="text-[11px] text-ink-400">of {stats.totalStickers} total • {stats.unallocatedStickers} free</p>
            </Card>
            <Card className="!p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users size={14} className="text-success-500" />
                <span className="text-[10px] font-bold text-ink-400 uppercase">Agents</span>
              </div>
              <p className="text-2xl font-extrabold text-ink-900">{stats.verifiedAgents}</p>
              <p className="text-[11px] text-ink-400">{stats.totalAgents} total • {stats.pendingAgents} pending</p>
            </Card>
            <Card className="!p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-brand-600" />
                <span className="text-[10px] font-bold text-ink-400 uppercase">Customers</span>
              </div>
              <p className="text-2xl font-extrabold text-ink-900">{stats.completeProfiles}</p>
              <p className="text-[11px] text-ink-400">{stats.totalCustomers} total • {stats.totalCustomers - stats.completeProfiles} incomplete</p>
            </Card>
            <Card className="!p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-warning-500" />
                <span className="text-[10px] font-bold text-ink-400 uppercase">Emergencies</span>
              </div>
              <p className="text-2xl font-extrabold text-ink-900">{stats.totalScans}</p>
              <p className="text-[11px] text-ink-400">{stats.activeScans} active • {stats.cancelledScans} cancelled</p>
            </Card>
          </div>
        </div>
      )}

      {/* ═══ AGENTS ═══ */}
      {activeTab === "agents" && (
        <div className="">
          {agents.length === 0 ? (
            <Card className="text-center py-10">
              <Users size={28} className="text-ink-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-ink-900">No Agents Yet</p>
              <p className="text-xs text-ink-400 mt-1">Agents will appear here once they register</p>
            </Card>
          ) : (
            agents.map((agent, i) => (
              <Card key={agent._id} className="mb-2 !p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-200 flex items-center justify-center text-ink-500 font-bold text-sm">
                      #{i + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-ink-900">{agent.fullName}</p>
                        <Badge variant={agent.status === "verified" ? "success" : agent.status === "pending" ? "warning" : "brand"}>
                          {agent.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-ink-400">{agent.address?.city || "—"} • {agent.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-ink-900">{agent.stickersSold || 0}</p>
                    <p className="text-[10px] text-ink-400">₹{(agent.totalRevenue || 0).toLocaleString("en-IN")}</p>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-2 mt-2 pt-2 border-t border-surface-200">
                  {agent.status === "pending" && (
                    <Button variant="success" size="sm" onClick={() => handleAgentAction(agent._id, "verify")}>
                      <UserCheck size={12} /> Verify
                    </Button>
                  )}
                  {agent.status === "verified" && (
                    <Button variant="ghost" size="sm" onClick={() => handleAgentAction(agent._id, "suspend")}>
                      <UserX size={12} /> Suspend
                    </Button>
                  )}
                  {agent.status === "suspended" && (
                    <Button variant="ghost" size="sm" onClick={() => handleAgentAction(agent._id, "reactivate")}>
                      <UserCheck size={12} /> Reactivate
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ═══ STICKERS ═══ */}
      {activeTab === "stickers" && (
        <div className="">
          {/* Quick action bar */}
          <div className="flex gap-2 mb-4">
            <Button size="sm" onClick={() => router.push("/admin/stickers")} className="flex-1">
              <QrCode size={13} /> Generate QR
            </Button>
            <Button size="sm" variant="secondary" onClick={() => {
              const el = document.getElementById("allocate-section");
              el && el.classList.toggle("hidden");
            }} className="flex-1">
              <Package size={13} /> Allocate
            </Button>
          </div>

          {/* Collapsible Allocate Section */}
          <div id="allocate-section" className="hidden mb-4">
            <Card>
              <h3 className="text-xs font-bold text-ink-900 mb-2">Allocate Stickers to Agent</h3>
              <select
                value={allocateAgentId}
                onChange={(e) => setAllocateAgentId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-surface-300 rounded-lg text-ink-900 text-sm mb-2 cursor-pointer"
              >
                <option value="">Select Agent...</option>
                {agents.filter(a => a.status === "verified").map((a) => (
                  <option key={a._id} value={a._id}>{a.fullName} — {a.address?.city || ""}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Input placeholder="Count" type="number" value={allocateCount} onChange={(e) => setAllocateCount(e.target.value)} className="!mb-0 flex-1" />
                <Button variant="success" size="sm" onClick={handleAllocateStickers} disabled={!allocateAgentId || allocating}>
                  {allocating ? "..." : "Allocate"}
                </Button>
              </div>
            </Card>
          </div>

          {/* Stats row */}
          {stats && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { v: stats.totalStickers, l: "Total", c: "text-ink-900" },
                { v: stats.unallocatedStickers, l: "Free", c: "text-warning-500" },
                { v: stats.allocatedStickers || 0, l: "Allocated", c: "text-blue-600" },
                { v: stats.activatedStickers, l: "Active", c: "text-success-500" },
              ].map((s, i) => (
                <div key={i} className="bg-white border border-surface-300 rounded-xl p-2.5 text-center">
                  <p className={`text-lg font-extrabold ${s.c}`}>{s.v}</p>
                  <p className="text-[8px] font-bold text-ink-400 uppercase">{s.l}</p>
                </div>
              ))}
            </div>
          )}

          {/* Sticker Tracking Table */}
          <StickerTable mode="admin" />
        </div>
      )}

      {/* ═══ SETTLEMENTS ═══ */}
      {activeTab === "settlements" && (
        <SettlementTab getToken={getToken} agents={agents} />
      )}

      {/* ═══ RECHARGE ═══ */}
      {activeTab === "recharge" && (
        <RechargeTab getToken={getToken} />
      )}

      {/* ═══ SUPPORT ═══ */}
      {activeTab === "support" && (
        <SupportTab getToken={getToken} />
      )}

      {/* ═══ SCANS ═══ */}
      {activeTab === "scans" && (
        <div className="">
          {scans.length === 0 ? (
            <Card className="text-center py-10">
              <Eye size={28} className="text-ink-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-ink-900">No Scans Yet</p>
              <p className="text-xs text-ink-400 mt-1">Emergency scans will appear here</p>
            </Card>
          ) : (
            scans.map((scan, i) => (
              <Card key={scan._id || i} className="mb-2 !p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      scan.status === "triggered" ? "bg-brand-50 text-brand-600" :
                      scan.status === "cancelled" ? "bg-surface-200 text-ink-400" :
                      "bg-success-50 text-success-500"
                    }`}>
                      {scan.status === "triggered" ? <AlertTriangle size={14} /> :
                       scan.status === "cancelled" ? <X size={14} /> :
                       <Check size={14} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-brand-600">{scan.qrId}</span>
                        <span className="text-[10px] text-ink-400">{formatTime(scan.createdAt)}</span>
                      </div>
                      {scan.scannerLocation?.address && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin size={10} className="text-ink-300" />
                          <span className="text-[11px] text-ink-400">{scan.scannerLocation.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={
                    scan.status === "triggered" ? "brand" :
                    scan.status === "cancelled" ? "neutral" : "success"
                  }>
                    {scan.status}
                  </Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════
// RECHARGE TAB — view pending requests, approve/reject, upload QR
// ═══════════════════════════════════════════════════════════════════
function RechargeTab({ getToken }) {
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({});
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [viewScreenshot, setViewScreenshot] = useState(null);
  const [qrUploading, setQrUploading] = useState(false);
  const [hasQR, setHasQR] = useState(false);
  const fileRef = useRef(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/recharge?status=${filter}`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.data.items);
        setCounts(data.data.counts);
      }
    } catch {}
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchRequests(); checkQR(); }, [fetchRequests]);

  const checkQR = async () => {
    try {
      const res = await fetch("/api/admin/settings?key=phonepe_qr");
      const data = await res.json();
      setHasQR(!!(data.success && data.data.value));
    } catch {}
  };

  const handleUploadQR = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(",")[1];
      const token = getToken();
      try {
        const res = await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ key: "phonepe_qr", value: { base64, type: file.type } }),
        });
        const data = await res.json();
        if (data.success) { toast.success("Payment QR uploaded!"); setHasQR(true); }
        else toast.error(data.message);
      } catch { toast.error("Upload failed"); }
      setQrUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleViewScreenshot = async (id) => {
    const token = getToken();
    try {
      const res = await fetch("/api/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "get-screenshot", rechargeId: id }),
      });
      const data = await res.json();
      if (data.success) {
        setViewScreenshot(`data:${data.data.screenshotType};base64,${data.data.screenshotBase64}`);
      }
    } catch { toast.error("Failed to load screenshot"); }
  };

  const handleAction = async (id, action, note = "") => {
    const token = getToken();
    try {
      const res = await fetch("/api/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, rechargeId: id, note }),
      });
      const data = await res.json();
      if (data.success) { toast.success(data.message); fetchRequests(); }
      else toast.error(data.message);
    } catch { toast.error("Action failed"); }
  };

  return (
    <div className="">
      {/* Screenshot Modal */}
      {viewScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setViewScreenshot(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-heavy max-w-sm w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewScreenshot(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center z-10"><X size={16} /></button>
            <img src={viewScreenshot} alt="Payment Screenshot" className="w-full" />
          </div>
        </div>
      )}

      {/* Upload Payment QR */}
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-ink-900">Payment QR (PhonePe/UPI)</p>
            <p className="text-xs text-ink-400 mt-0.5">{hasQR ? "QR uploaded — customers can see it" : "Upload your UPI QR for customers to pay"}</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUploadQR} className="hidden" />
          <Button size="sm" variant={hasQR ? "secondary" : "primary"} onClick={() => fileRef.current?.click()} disabled={qrUploading}>
            {qrUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            {hasQR ? "Update" : "Upload"}
          </Button>
        </div>
      </Card>

      {/* Filter */}
      <div className="flex gap-1 mb-3">
        {["pending", "approved", "rejected", "all"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
              filter === f ? "bg-brand-600 text-white" : "bg-surface-200 text-ink-400"
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)} {counts[f] !== undefined && <span className="ml-0.5 opacity-70">{counts[f]}</span>}
          </button>
        ))}
      </div>

      {/* Requests */}
      {loading ? (
        <div className="text-center py-10"><Loader2 size={24} className="animate-spin text-brand-600 mx-auto" /></div>
      ) : requests.length === 0 ? (
        <Card className="text-center py-8">
          <CreditCard size={24} className="text-ink-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-ink-900">No recharge requests</p>
        </Card>
      ) : (
        requests.map((req) => (
          <Card key={req._id} className="mb-2 !p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-bold text-ink-900">{req.customerName || req.customerPhone}</p>
                <p className="text-[10px] text-ink-400">{req.customerPhone} • ₹{req.amount} → {req.credits} credits</p>
              </div>
              <Badge variant={req.status === "approved" ? "success" : req.status === "rejected" ? "brand" : "warning"}>
                {req.status}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => handleViewScreenshot(req._id)}>
                <Image size={12} /> Screenshot
              </Button>
              {req.status === "pending" && (
                <>
                  <Button size="sm" variant="success" onClick={() => handleAction(req._id, "approve")}>
                    <Check size={12} /> Approve
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleAction(req._id, "reject", "Payment not verified")}>
                    <X size={12} /> Reject
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SUPPORT TAB — view feedback, reply
// ═══════════════════════════════════════════════════════════════════
function SupportTab({ getToken }) {
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [filter, setFilter] = useState("open");
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/feedback?status=${filter}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data.items);
        setCounts(data.data.counts);
      }
    } catch {}
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  const handleReply = async (id) => {
    if (!replyText.trim()) return;
    const token = getToken();
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "reply", feedbackId: id, reply: replyText }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Reply saved"); setReplyTo(null); setReplyText(""); fetchFeedback(); }
      else toast.error(data.message);
    } catch { toast.error("Failed"); }
  };

  const handleClose = async (id) => {
    const token = getToken();
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "close", feedbackId: id }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Closed"); fetchFeedback(); }
    } catch {}
  };

  const typeColors = { query: "neutral", feedback: "success", complaint: "brand", suggestion: "warning" };

  return (
    <div className="">
      <div className="flex gap-1 mb-3">
        {["open", "replied", "closed", "all"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
              filter === f ? "bg-brand-600 text-white" : "bg-surface-200 text-ink-400"
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)} {counts[f] !== undefined && <span className="ml-0.5 opacity-70">{counts[f]}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10"><Loader2 size={24} className="animate-spin text-brand-600 mx-auto" /></div>
      ) : items.length === 0 ? (
        <Card className="text-center py-8">
          <MessageSquare size={24} className="text-ink-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-ink-900">No messages</p>
        </Card>
      ) : (
        items.map((item) => (
          <Card key={item._id} className="mb-2 !p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-ink-900">{item.name}</p>
                <Badge variant={typeColors[item.type] || "neutral"}>{item.type}</Badge>
              </div>
              <Badge variant={item.status === "open" ? "warning" : item.status === "replied" ? "success" : "neutral"}>
                {item.status}
              </Badge>
            </div>
            {item.phone && <p className="text-[10px] text-ink-400 mb-1">{item.phone} {item.email && `• ${item.email}`}</p>}
            <p className="text-sm text-ink-700 mb-2 leading-relaxed">{item.message}</p>

            {item.adminReply && (
              <div className="bg-success-50 border border-success-100 rounded-lg p-2.5 mb-2">
                <p className="text-[10px] font-bold text-success-600 mb-0.5">Your Reply</p>
                <p className="text-xs text-success-700">{item.adminReply}</p>
              </div>
            )}

            {replyTo === item._id ? (
              <div className="mt-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply..."
                  className="w-full px-3 py-2 bg-white border border-surface-300 rounded-lg text-sm text-ink-900 mb-2 resize-y"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => { setReplyTo(null); setReplyText(""); }}>Cancel</Button>
                  <Button size="sm" onClick={() => handleReply(item._id)} disabled={!replyText.trim()}>
                    <Send size={12} /> Send
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 mt-1">
                {item.status !== "closed" && (
                  <Button size="sm" variant="secondary" onClick={() => { setReplyTo(item._id); setReplyText(item.adminReply || ""); }}>
                    <MessageSquare size={12} /> Reply
                  </Button>
                )}
                {item.status !== "closed" && (
                  <Button size="sm" variant="ghost" onClick={() => handleClose(item._id)}>
                    <X size={12} /> Close
                  </Button>
                )}
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SETTLEMENT TAB
// ═══════════════════════════════════════════════════════════════════
function SettlementTab({ getToken, agents }) {
  const [selectedAgent, setSelectedAgent] = useState("");
  const [preview, setPreview] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchSettlements = useCallback(async () => {
    const token = getToken();
    try {
      let url = "/api/settlements?";
      if (selectedAgent) url += "agentId=" + selectedAgent;
      const res = await fetch(url, { headers: { Authorization: "Bearer " + token } });
      const data = await res.json();
      if (data.success) setSettlements(data.data);
    } catch {}
  }, [getToken, selectedAgent]);

  useEffect(() => { fetchSettlements(); }, [fetchSettlements]);

  const handlePreview = async () => {
    if (!selectedAgent) { toast.error("Select an agent"); return; }
    setLoading(true);
    const token = getToken();
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ action: "preview", agentId: selectedAgent }),
      });
      const data = await res.json();
      if (data.success) setPreview(data.data);
      else toast.error(data.message);
    } catch { toast.error("Failed"); }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!selectedAgent) return;
    setCreating(true);
    const token = getToken();
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ action: "create", agentId: selectedAgent }),
      });
      const data = await res.json();
      if (data.success) { toast.success(data.message); setPreview(null); fetchSettlements(); }
      else toast.error(data.message);
    } catch { toast.error("Failed"); }
    setCreating(false);
  };

  const handleSettle = async (id) => {
    const token = getToken();
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ action: "settle", settlementId: id }),
      });
      const data = await res.json();
      if (data.success) { toast.success(data.message); fetchSettlements(); }
      else toast.error(data.message);
    } catch { toast.error("Failed"); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "—";
  const verifiedAgents = agents.filter(a => a.status === "verified");

  return (
    <div className="">
      <Card className="mb-4">
        <h3 className="text-sm font-bold text-ink-900 mb-3">Calculate Settlement</h3>
        <select value={selectedAgent} onChange={(e) => { setSelectedAgent(e.target.value); setPreview(null); }}
          className="w-full px-3 py-2.5 bg-white border border-surface-300 rounded-lg text-ink-900 text-sm mb-3 cursor-pointer">
          <option value="">Select Agent...</option>
          {verifiedAgents.map(a => (
            <option key={a._id} value={a._id}>{a.fullName} — {a.address?.city || ""}</option>
          ))}
        </select>
        <Button full onClick={handlePreview} disabled={!selectedAgent || loading} variant="secondary">
          {loading ? "Calculating..." : "Preview Settlement"}
        </Button>
      </Card>

      {preview && (
        <Card className="mb-4 animate-fade-up-in">
          <h3 className="text-sm font-bold text-ink-900 mb-3">{preview.agentName} — Unsettled</h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-surface-50 rounded-lg p-2.5 text-center">
              <p className="text-lg font-extrabold text-ink-900">{preview.totalSales}</p>
              <p className="text-[8px] font-bold text-ink-400 uppercase">Sales</p>
            </div>
            <div className="bg-surface-50 rounded-lg p-2.5 text-center">
              <p className="text-lg font-extrabold text-ink-900">{preview.cashSales}</p>
              <p className="text-[8px] font-bold text-ink-400 uppercase">Cash</p>
            </div>
            <div className="bg-surface-50 rounded-lg p-2.5 text-center">
              <p className="text-lg font-extrabold text-ink-900">{preview.upiSales}</p>
              <p className="text-[8px] font-bold text-ink-400 uppercase">UPI</p>
            </div>
          </div>
          <div className="space-y-1.5 mb-4 text-sm">
            <div className="flex justify-between"><span className="text-ink-400">Revenue</span><span className="font-bold">₹{preview.totalRevenue}</span></div>
            <div className="flex justify-between"><span className="text-ink-400">Cash with Agent</span><span className="font-bold">₹{preview.cashCollected}</span></div>
            <div className="flex justify-between"><span className="text-ink-400">UPI (Direct)</span><span className="font-bold">₹{preview.upiCollected}</span></div>
            <div className="flex justify-between border-t border-surface-300 pt-1.5"><span className="text-ink-400">Commission (₹{preview.commissionRate}/sale)</span><span className="font-bold text-success-500">₹{preview.totalCommission}</span></div>
          </div>
          <Card className={"!p-3 text-center mb-3 " + (preview.netDirection === "agent_owes_admin" ? "!bg-brand-50 !border-brand-200" : preview.netDirection === "admin_owes_agent" ? "!bg-success-50 !border-success-500" : "!bg-surface-100")}>
            <p className="text-xs text-ink-400 mb-1">Net Settlement</p>
            <p className="text-xl font-extrabold">
              {preview.netDirection === "agent_owes_admin" && <span className="text-brand-600">Agent owes ₹{preview.netAmount}</span>}
              {preview.netDirection === "admin_owes_agent" && <span className="text-success-500">Admin owes ₹{preview.netAmount}</span>}
              {preview.netDirection === "settled" && <span className="text-ink-400">All settled ✓</span>}
            </p>
          </Card>
          {preview.totalSales > 0 && (
            <Button full variant="success" onClick={handleCreate} disabled={creating}>
              {creating ? "Creating..." : "Create Settlement Record"}
            </Button>
          )}
        </Card>
      )}

      <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400 mb-3">History</h3>
      {settlements.length === 0 ? (
        <Card className="text-center py-6">
          <IndianRupee size={20} className="text-ink-300 mx-auto mb-2" />
          <p className="text-xs text-ink-400">No settlements yet</p>
        </Card>
      ) : settlements.map(s => (
        <Card key={s._id} className="mb-2 !p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-bold text-ink-900">{s.agentId?.fullName || "Agent"}</p>
              <p className="text-[10px] text-ink-400">{formatDate(s.periodStart)} → {formatDate(s.periodEnd)} • {s.totalSales} sales</p>
            </div>
            <Badge variant={s.status === "settled" ? "success" : "warning"}>{s.status}</Badge>
          </div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-ink-400">Cash: {s.cashSales} | UPI: {s.upiSales}</span>
            <span className="font-bold">₹{s.totalCommission} commission</span>
          </div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-ink-400">Net</span>
            <span className={"font-bold " + (s.netSettlement > 0 ? "text-brand-600" : "text-success-500")}>
              {s.netSettlement > 0 ? "Agent owes ₹" + s.netSettlement : s.netSettlement < 0 ? "Admin owes ₹" + Math.abs(s.netSettlement) : "Settled"}
            </span>
          </div>
          {s.status === "pending" && (
            <Button size="sm" variant="success" full onClick={() => handleSettle(s._id)}>
              <Check size={12} /> Mark as Settled
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
}
