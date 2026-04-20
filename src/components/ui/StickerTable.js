"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  QrCode, User, Phone, Check, Clock, AlertTriangle,
  ChevronLeft, ChevronRight, Search, Loader2, X,
  Droplet, Mail, Shield, Download,
} from "lucide-react";
import { Card, Badge, Input, Button } from "@/components/ui";

const STATUS_CONFIG = {
  unallocated: { label: "Unallocated", color: "neutral", bg: "bg-surface-200", text: "text-ink-400" },
  allocated: { label: "Allocated", color: "warning", bg: "bg-warning-50", text: "text-warning-500" },
  sold: { label: "Sold", color: "brand", bg: "bg-blue-50", text: "text-blue-600" },
  active: { label: "Active", color: "success", bg: "bg-success-50", text: "text-success-500" },
  disabled: { label: "Disabled", color: "neutral", bg: "bg-surface-200", text: "text-ink-300" },
};

// ─── QR Modal Component ──────────────────────────────────────────
function QRModal({ sticker, onClose }) {
  const canvasRef = useRef(null);
  const [qrReady, setQrReady] = useState(false);

  useEffect(() => {
    if (!sticker || !canvasRef.current) return;
    generateQR();
  }, [sticker]);

  const generateQR = async () => {
    try {
      const QRCode = (await import("qrcode")).default;
      const url = `${window.location.origin}/emergency/scan?id=${sticker.qrId}`;
      await QRCode.toCanvas(canvasRef.current, url, {
        width: 220,
        margin: 2,
        color: { dark: "#1A1A18", light: "#FFFFFF" },
        errorCorrectionLevel: "M",
      });
      setQrReady(true);
    } catch (err) {
      console.error("QR generation failed:", err);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `oncallrescue-${sticker.qrId}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  if (!sticker) return null;

  const sc = STATUS_CONFIG[sticker.status] || STATUS_CONFIG.unallocated;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-heavy w-full max-w-sm overflow-hidden animate-fade-up-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center text-ink-400 hover:text-ink-900 hover:bg-surface-300 transition-all z-10"
        >
          <X size={16} />
        </button>

        {/* Red header */}
        <div className="brand-gradient px-5 py-4 text-center">
          <p className="text-[9px] font-bold font-mono uppercase tracking-[0.2em] text-white/60">OnCallRescue Emergency ID</p>
          <p className="text-lg font-extrabold text-white font-mono mt-1">{sticker.qrId}</p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center py-6">
          <div className="bg-white p-3 rounded-xl border border-surface-300 shadow-soft relative">
            <canvas ref={canvasRef} />
            {!qrReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-white rounded-xl">
                <Loader2 size={24} className="animate-spin text-brand-600" />
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="px-5 pb-5">
          {/* Status */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-ink-400">Status</span>
            <Badge variant={sc.color}>{sc.label}</Badge>
          </div>

          {/* Agent */}
          {sticker.agentId && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-ink-400">Agent</span>
              <span className="text-xs font-bold text-ink-900">
                {sticker.agentId.fullName || "—"}
                {sticker.agentId.address?.city && <span className="text-ink-400 font-normal"> • {sticker.agentId.address.city}</span>}
              </span>
            </div>
          )}

          {/* Customer */}
          {sticker.customerPhone && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-ink-400">Customer</span>
              <span className="text-xs font-mono text-ink-700">
                {sticker.customerPhone.slice(0, 2)}****{sticker.customerPhone.slice(-2)}
              </span>
            </div>
          )}

          {/* Registration */}
          {sticker.status === "sold" && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-ink-400">Registration</span>
              <span className="text-xs font-semibold text-blue-600">Pending</span>
            </div>
          )}
          {sticker.status === "active" && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-ink-400">Registration</span>
              <span className="text-xs font-semibold text-success-500">Complete</span>
            </div>
          )}

          {/* Emergency count */}
          {sticker.emergencyCount > 0 && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-ink-400">Emergencies</span>
              <Badge variant="brand"><AlertTriangle size={9} /> {sticker.emergencyCount} triggered</Badge>
            </div>
          )}

          {/* Dates */}
          {sticker.soldAt && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-ink-400">Sold</span>
              <span className="text-xs text-ink-500">{new Date(sticker.soldAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</span>
            </div>
          )}
          {sticker.activatedAt && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-ink-400">Activated</span>
              <span className="text-xs text-ink-500">{new Date(sticker.activatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</span>
            </div>
          )}

          {/* Scan URL */}
          <div className="bg-surface-50 border border-surface-300 rounded-lg p-2.5 mb-4">
            <p className="text-[9px] font-bold text-ink-400 uppercase tracking-wider mb-1">Scan URL</p>
            <p className="text-[11px] font-mono text-ink-600 break-all select-all">
              {typeof window !== "undefined" ? `${window.location.origin}/emergency/scan?id=${sticker.qrId}` : ""}
            </p>
          </div>

          {/* Download button */}
          <Button full variant="secondary" size="sm" onClick={handleDownload}>
            <Download size={13} /> Download QR Image
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STICKER TABLE
// ═══════════════════════════════════════════════════════════════════
export default function StickerTable({ mode = "admin", agentId = null }) {
  const [stickers, setStickers] = useState([]);
  const [counts, setCounts] = useState({});
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSticker, setSelectedSticker] = useState(null);

  const getToken = () => {
    const match = document.cookie.match(/oncallrescue_token=([^;]+)/);
    return match ? match[1] : null;
  };

  const fetchStickers = useCallback(async (page = 1) => {
    setLoading(true);
    const token = getToken();
    let url = `/api/stickers?page=${page}&limit=15`;
    if (statusFilter !== "all") url += `&status=${statusFilter}`;
    if (agentId) url += `&agentId=${agentId}`;

    try {
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setStickers(data.data.stickers);
        setPagination(data.data.pagination);
        setCounts(data.data.counts);
      }
    } catch {}
    setLoading(false);
  }, [statusFilter, agentId]);

  useEffect(() => {
    fetchStickers(1);
  }, [fetchStickers]);

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
  };

  const maskPhone = (p) => {
    if (!p || p.length < 10) return "—";
    return `${p.slice(0, 2)}****${p.slice(-2)}`;
  };

  const filtered = searchQuery
    ? stickers.filter((s) =>
        s.qrId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.customerPhone?.includes(searchQuery) ||
        s.agentId?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : stickers;

  const statusTabs = mode === "admin"
    ? [
        { key: "all", label: "All", count: counts.all },
        { key: "unallocated", label: "Free", count: counts.unallocated },
        { key: "allocated", label: "Allocated", count: counts.allocated },
        { key: "sold", label: "Sold", count: counts.sold },
        { key: "active", label: "Active", count: counts.active },
      ]
    : [
        { key: "all", label: "All", count: counts.all },
        { key: "allocated", label: "Ready", count: counts.allocated },
        { key: "sold", label: "Sold", count: counts.sold },
        { key: "active", label: "Active", count: counts.active },
      ];

  return (
    <div>
      {/* QR Modal */}
      {selectedSticker && (
        <QRModal sticker={selectedSticker} onClose={() => setSelectedSticker(null)} />
      )}

      {/* Status tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
              statusFilter === tab.key
                ? "bg-brand-600 text-white"
                : "bg-surface-200 text-ink-400 hover:text-ink-600"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-1 ${statusFilter === tab.key ? "text-white/70" : "text-ink-300"}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-3">
        <Input
          placeholder="Search QR ID, phone, or agent..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search size={13} />}
          className="!mb-0"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-10">
          <Loader2 size={24} className="animate-spin text-brand-600 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-8">
          <QrCode size={24} className="text-ink-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-ink-900">No stickers found</p>
          <p className="text-xs text-ink-400 mt-1">
            {statusFilter !== "all" ? "Try a different filter" : "Generate stickers first"}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((sticker) => {
            const sc = STATUS_CONFIG[sticker.status] || STATUS_CONFIG.unallocated;
            return (
              <Card
                key={sticker._id}
                className="!p-3.5 cursor-pointer hover:shadow-medium hover:border-brand-200 transition-all"
                onClick={() => setSelectedSticker(sticker)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${sc.bg} flex items-center justify-center ${sc.text}`}>
                      <QrCode size={14} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-ink-900">{sticker.qrId}</span>
                        <Badge variant={sc.color}>{sc.label}</Badge>
                        {sticker.emergencyCount > 0 && (
                          <Badge variant="brand"><AlertTriangle size={8} /> {sticker.emergencyCount}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {mode === "admin" && sticker.agentId && (
                          <span className="text-[10px] text-ink-400">
                            <User size={9} className="inline mr-0.5" />
                            {sticker.agentId.fullName || "Agent"}
                          </span>
                        )}
                        {sticker.customerPhone && (
                          <span className="text-[10px] text-ink-400">
                            <Phone size={9} className="inline mr-0.5" />
                            {maskPhone(sticker.customerPhone)}
                          </span>
                        )}
                        {sticker.status === "sold" && (
                          <span className="text-[10px] text-blue-500 font-medium">Pending registration</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tap hint */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <QrCode size={12} className="text-ink-300" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-[11px] text-ink-400">
            {pagination.total} total
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchStickers(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="w-8 h-8 rounded-lg border border-surface-300 flex items-center justify-center text-ink-400 hover:text-ink-900 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-mono text-ink-500 min-w-[60px] text-center">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchStickers(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="w-8 h-8 rounded-lg border border-surface-300 flex items-center justify-center text-ink-400 hover:text-ink-900 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
