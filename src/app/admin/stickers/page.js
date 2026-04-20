"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  QrCode, Download, Plus, Loader2, Shield, Check,
  Printer, Eye, Package, ChevronLeft, ChevronRight,
} from "lucide-react";
import { PageShell, PageHeader } from "@/components/layouts";
import { Button, Card, Input, Badge } from "@/components/ui";
import toast from "react-hot-toast";

// ─── Generate real scannable QR code using Canvas ────────────────
// Uses the 'qrcode' npm package via dynamic import
async function generateRealQR(text, size = 200) {
  // Dynamically import qrcode library
  const QRCode = (await import("qrcode")).default;
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, text, {
    width: size,
    margin: 1,
    color: { dark: "#1A1A18", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
  });
  return canvas;
}

// ─── Draw a single premium sticker on a canvas context ───────────
async function drawSticker(ctx, x, y, w, h, qrId, appUrl) {
  const url = `${appUrl}/emergency/scan?id=${qrId}`;
  const qrSize = Math.min(w - 40, h - 90);
  const r = 10;

  // Rounded rect background
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = "#FAFAF7";
  ctx.fill();
  ctx.strokeStyle = "#D1CFC5";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Red header bar
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, 34, [r, r, 0, 0]);
  ctx.fillStyle = "#C8372D";
  ctx.fill();
  ctx.restore();

  // Brand text in header
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 13px 'Arial', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("OnCallRescue", x + 12, y + 22);

  ctx.font = "bold 8px 'Arial', sans-serif";
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText("EMERGENCY ID", x + w - 10, y + 22);

  // Generate real QR code
  const qrCanvas = await generateRealQR(url, qrSize);
  const qrX = x + (w - qrSize) / 2;
  const qrY = y + 44;

  // QR background
  ctx.fillStyle = "#FFFFFF";
  const pad = 6;
  ctx.fillRect(qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2);
  ctx.strokeStyle = "#E2E0D8";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2);

  // Draw QR
  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

  // Center brand dot
  const dotSize = qrSize * 0.13;
  ctx.fillStyle = "#C8372D";
  ctx.beginPath();
  ctx.roundRect(
    qrX + qrSize / 2 - dotSize / 2,
    qrY + qrSize / 2 - dotSize / 2,
    dotSize, dotSize, 3
  );
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${dotSize * 0.55}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("L", qrX + qrSize / 2, qrY + qrSize / 2 + 1);
  ctx.textBaseline = "alphabetic";

  // QR ID below
  ctx.fillStyle = "#1A1A18";
  ctx.font = "bold 11px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText(qrId, x + w / 2, qrY + qrSize + 20);

  // Instruction text
  ctx.fillStyle = "#8A8A7F";
  ctx.font = "8px Arial, sans-serif";
  ctx.fillText("Scan in emergency to contact family", x + w / 2, qrY + qrSize + 33);
}

// ─── Generate printable sticker sheets ───────────────────────────
async function generateStickerSheets(qrIds, appUrl, onProgress) {
  const COLS = 3, ROWS = 4, PER_PAGE = COLS * ROWS;
  const PAGE_W = 794, PAGE_H = 1123; // A4 at ~96dpi
  const MARGIN = 36, GAP = 10;
  const stickerW = Math.floor((PAGE_W - 2 * MARGIN - (COLS - 1) * GAP) / COLS);
  const stickerH = Math.floor((PAGE_H - 2 * MARGIN - (ROWS - 1) * GAP) / ROWS);
  const pages = Math.ceil(qrIds.length / PER_PAGE);
  const canvases = [];

  for (let page = 0; page < pages; page++) {
    const canvas = document.createElement("canvas");
    canvas.width = PAGE_W;
    canvas.height = PAGE_H;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    for (let i = 0; i < PER_PAGE; i++) {
      const idx = page * PER_PAGE + i;
      if (idx >= qrIds.length) break;

      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const sx = MARGIN + col * (stickerW + GAP);
      const sy = MARGIN + row * (stickerH + GAP);

      await drawSticker(ctx, sx, sy, stickerW, stickerH, qrIds[idx], appUrl);
      if (onProgress) onProgress(idx + 1, qrIds.length);
    }

    // Footer
    ctx.fillStyle = "#B5B5AA";
    ctx.font = "9px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`OnCallRescue Emergency Stickers — Page ${page + 1} of ${pages}`, PAGE_W / 2, PAGE_H - 14);

    // Cut guides
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "#D1CFC5";
    ctx.lineWidth = 0.5;
    for (let row = 1; row < ROWS; row++) {
      const ly = MARGIN + row * (stickerH + GAP) - GAP / 2;
      ctx.beginPath();
      ctx.moveTo(MARGIN - 8, ly);
      ctx.lineTo(PAGE_W - MARGIN + 8, ly);
      ctx.stroke();
    }
    for (let col = 1; col < COLS; col++) {
      const lx = MARGIN + col * (stickerW + GAP) - GAP / 2;
      ctx.beginPath();
      ctx.moveTo(lx, MARGIN - 8);
      ctx.lineTo(lx, PAGE_H - MARGIN + 8);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    canvases.push(canvas);
  }

  return canvases;
}

// ═══════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function StickerGeneratorPage() {
  const router = useRouter();
  const [count, setCount] = useState("12");
  const [createdIds, setCreatedIds] = useState([]);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [sheets, setSheets] = useState([]);
  const [previewPage, setPreviewPage] = useState(0);
  const [previewSrc, setPreviewSrc] = useState(null);

  const getToken = () => {
    const match = document.cookie.match(/oncallrescue_token=([^;]+)/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    const role = document.cookie.match(/oncallrescue_role=([^;]+)/);
    if (!role || role[1] !== "admin") router.push("/admin/login");
  }, [router]);

  // Update preview when page changes
  useEffect(() => {
    if (sheets.length > 0 && sheets[previewPage]) {
      setPreviewSrc(sheets[previewPage].toDataURL("image/png"));
    }
  }, [sheets, previewPage]);

  const handleCreate = async () => {
    const token = getToken();
    if (!token) { router.push("/admin/login"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/stickers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "batch-create", count: parseInt(count) || 12 }),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedIds(data.data.qrIds);
        toast.success(`${data.data.count} stickers created in database!`);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to create stickers");
    }
    setCreating(false);
  };

  const handleGenerate = async () => {
    if (createdIds.length === 0) { toast.error("Create stickers first"); return; }
    setGenerating(true);
    setProgress({ done: 0, total: createdIds.length });

    try {
      const appUrl = window.location.origin;
      const canvases = await generateStickerSheets(createdIds, appUrl, (done, total) => {
        setProgress({ done, total });
      });
      setSheets(canvases);
      setPreviewPage(0);
      toast.success(`${canvases.length} printable sheet(s) generated!`);
    } catch (err) {
      toast.error("Generation failed: " + err.message);
    }
    setGenerating(false);
  };

  const handleDownload = () => {
    sheets.forEach((canvas, i) => {
      const link = document.createElement("a");
      link.download = `oncallrescue-stickers-page-${i + 1}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
    toast.success("Downloading...");
  };

  const handlePrint = () => {
    if (sheets.length === 0) return;
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>OnCallRescue Stickers</title><style>
      body{margin:0;padding:0}img{width:100%;page-break-after:always}img:last-child{page-break-after:auto}
      @media print{body{margin:0}}
    </style></head><body>`);
    sheets.forEach((c) => w.document.write(`<img src="${c.toDataURL("image/png")}"/>`));
    w.document.write("</body></html>");
    w.document.close();
    w.onload = () => w.print();
  };

  return (
    <PageShell maxWidth="max-w-2xl">
      <PageHeader title="QR Sticker Generator" subtitle="Create, preview & print" backHref="/admin/dashboard" />

      {/* Step 1: Create */}
      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-md bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">1</span>
          <h3 className="text-sm font-bold text-ink-900">Create Sticker IDs</h3>
        </div>
        <p className="text-xs text-ink-400 mb-3">Generates unique IDs (e.g., LL-A8K3P2) in the database.</p>
        <div className="flex gap-2">
          <Input placeholder="How many?" type="number" value={count} onChange={(e) => setCount(e.target.value)} className="!mb-0 flex-1" />
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} {creating ? "..." : "Create"}
          </Button>
        </div>
      </Card>

      {/* Created IDs chips */}
      {createdIds.length > 0 && (
        <Card className="mb-4 !bg-success-50 !border-success-500">
          <div className="flex items-center gap-2 mb-2">
            <Check size={14} className="text-success-500" />
            <span className="text-sm font-bold text-success-600">{createdIds.length} Created</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {createdIds.map((id) => (
              <span key={id} className="px-2 py-0.5 bg-white rounded text-[10px] font-mono font-bold text-ink-700 border border-success-200">{id}</span>
            ))}
          </div>
        </Card>
      )}

      {/* Step 2: Generate sheets */}
      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-md bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">2</span>
          <h3 className="text-sm font-bold text-ink-900">Generate Scannable QR Sheets</h3>
        </div>
        <p className="text-xs text-ink-400 mb-3">
          Creates A4 sheets (12 per page) with real, scannable QR codes. Each QR links to your emergency scan page.
        </p>

        {generating && (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-ink-400 font-mono mb-1">
              <span>Generating QR codes...</span>
              <span>{progress.done}/{progress.total}</span>
            </div>
            <div className="w-full h-1.5 bg-surface-300 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600 rounded-full transition-all" style={{ width: `${(progress.done / Math.max(progress.total, 1)) * 100}%` }} />
            </div>
          </div>
        )}

        <Button full onClick={handleGenerate} disabled={createdIds.length === 0 || generating}>
          {generating ? <><Loader2 size={14} className="animate-spin" /> Generating...</> : <><QrCode size={14} /> Generate {createdIds.length} QR Stickers</>}
        </Button>
      </Card>

      {/* Step 3: Preview + Download */}
      {sheets.length > 0 && (
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">3</span>
              <h3 className="text-sm font-bold text-ink-900">Preview & Download</h3>
            </div>
            <Badge variant="success">{sheets.length} page{sheets.length > 1 ? "s" : ""}</Badge>
          </div>

          {/* Preview image */}
          {previewSrc && (
            <div className="mb-3 rounded-xl overflow-hidden border border-surface-300">
              <img src={previewSrc} alt={`Page ${previewPage + 1}`} className="w-full" />
            </div>
          )}

          {/* Pagination */}
          {sheets.length > 1 && (
            <div className="flex items-center justify-center gap-3 mb-4">
              <button
                onClick={() => setPreviewPage(Math.max(0, previewPage - 1))}
                disabled={previewPage === 0}
                className="w-8 h-8 rounded-lg border border-surface-300 flex items-center justify-center text-ink-400 hover:text-ink-900 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-mono text-ink-500">
                Page {previewPage + 1} of {sheets.length}
              </span>
              <button
                onClick={() => setPreviewPage(Math.min(sheets.length - 1, previewPage + 1))}
                disabled={previewPage === sheets.length - 1}
                className="w-8 h-8 rounded-lg border border-surface-300 flex items-center justify-center text-ink-400 hover:text-ink-900 disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button full onClick={handleDownload}><Download size={14} /> Download</Button>
            <Button variant="secondary" full onClick={handlePrint}><Printer size={14} /> Print</Button>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="!bg-surface-50">
        <h4 className="text-xs font-bold text-ink-900 mb-2">Printing Tips</h4>
        {["Use adhesive / vinyl sticker paper (A4)", "Print at 100% scale — don't 'fit to page'", "Cut along dotted lines between stickers", "Each QR is scannable by any phone camera or Google Lens", "After printing, allocate stickers to agents from dashboard"].map((t, i) => (
          <div key={i} className="flex gap-2 items-start mb-1.5 last:mb-0">
            <Check size={11} className="text-success-500 flex-shrink-0 mt-0.5" />
            <span className="text-[11px] text-ink-500 leading-relaxed">{t}</span>
          </div>
        ))}
      </Card>
    </PageShell>
  );
}
