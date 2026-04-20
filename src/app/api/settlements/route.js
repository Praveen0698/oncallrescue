import dbConnect from "@/lib/mongodb";
import { Settlement, Sticker, Agent, AdminSettings } from "@/lib/models";
import { verifyAdminAuth } from "@/lib/auth";
import { apiSuccess, apiError, apiCreated } from "@/lib/utils";

// GET - List settlements
export async function GET(request) {
  const { error } = await verifyAdminAuth(request);
  if (error) return error;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");
    const status = searchParams.get("status");

    const filter = {};
    if (agentId) filter.agentId = agentId;
    if (status) filter.status = status;

    const settlements = await Settlement.find(filter)
      .populate("agentId", "fullName phone address.city")
      .sort({ createdAt: -1 })
      .limit(50);

    return apiSuccess(settlements);
  } catch (err) {
    return apiError(err.message, 500);
  }
}

// POST - Calculate preview, create settlement, mark settled
export async function POST(request) {
  const { error } = await verifyAdminAuth(request);
  if (error) return error;

  try {
    await dbConnect();
    const body = await request.json();

    // Get commission rate from settings
    const commSetting = await AdminSettings.findOne({ key: "commission_per_sticker" });
    const commissionRate = commSetting?.value || 30;

    // ─── PREVIEW — calculate without saving ──────────
    if (body.action === "preview") {
      const { agentId } = body;
      const agent = await Agent.findById(agentId);
      if (!agent) return apiError("Agent not found");

      // Get unsettled stickers for this agent
      const unsettled = await Sticker.find({
        agentId,
        status: { $in: ["sold", "active"] },
        settlementId: null,
      });

      const cashSales = unsettled.filter(s => s.paymentMethod === "cash");
      const upiSales = unsettled.filter(s => s.paymentMethod === "upi");

      const totalRevenue = unsettled.length * 199;
      const cashCollected = cashSales.length * 199;
      const upiCollected = upiSales.length * 199;
      const totalCommission = unsettled.length * commissionRate;

      // Cash with agent minus their commission from cash = agent owes admin from cash
      const agentOwesFromCash = cashCollected - (cashSales.length * commissionRate);
      // Admin owes agent commission on UPI sales
      const adminOwesForUPI = upiSales.length * commissionRate;
      // Net: positive = agent owes, negative = admin owes
      const netSettlement = agentOwesFromCash - adminOwesForUPI;

      return apiSuccess({
        agentName: agent.fullName,
        totalSales: unsettled.length,
        cashSales: cashSales.length,
        upiSales: upiSales.length,
        totalRevenue,
        cashCollected,
        upiCollected,
        commissionRate,
        totalCommission,
        agentOwesFromCash,
        adminOwesForUPI,
        netSettlement,
        netDirection: netSettlement > 0 ? "agent_owes_admin" : netSettlement < 0 ? "admin_owes_agent" : "settled",
        netAmount: Math.abs(netSettlement),
      });
    }

    // ─── CREATE SETTLEMENT ───────────────────────────
    if (body.action === "create") {
      const { agentId } = body;
      const agent = await Agent.findById(agentId);
      if (!agent) return apiError("Agent not found");

      const unsettled = await Sticker.find({
        agentId,
        status: { $in: ["sold", "active"] },
        settlementId: null,
      });

      if (unsettled.length === 0) return apiError("No unsettled sales for this agent");

      const cashSales = unsettled.filter(s => s.paymentMethod === "cash");
      const upiSales = unsettled.filter(s => s.paymentMethod === "upi");
      const totalCommission = unsettled.length * commissionRate;
      const cashCollected = cashSales.length * 199;
      const adminOwesForUPI = upiSales.length * commissionRate;
      const agentOwesFromCash = cashCollected - (cashSales.length * commissionRate);
      const netSettlement = agentOwesFromCash - adminOwesForUPI;

      const settlement = await Settlement.create({
        agentId,
        periodStart: unsettled[unsettled.length - 1].soldAt || unsettled[unsettled.length - 1].createdAt,
        periodEnd: new Date(),
        totalSales: unsettled.length,
        cashSales: cashSales.length,
        upiSales: upiSales.length,
        totalRevenue: unsettled.length * 199,
        cashCollected,
        upiCollected: upiSales.length * 199,
        commissionRate,
        totalCommission,
        netSettlement,
        stickerIds: unsettled.map(s => s._id),
      });

      // Link stickers to this settlement
      await Sticker.updateMany(
        { _id: { $in: unsettled.map(s => s._id) } },
        { settlementId: settlement._id, commissionAmount: commissionRate }
      );

      // Update agent commission tracking
      agent.commissionEarned += totalCommission;
      await agent.save();

      return apiCreated(settlement, "Settlement created. Mark as settled after payment exchange.");
    }

    // ─── MARK AS SETTLED ─────────────────────────────
    if (body.action === "settle") {
      const settlement = await Settlement.findById(body.settlementId);
      if (!settlement) return apiError("Settlement not found");

      settlement.status = "settled";
      settlement.settledAt = new Date();
      settlement.note = body.note || "";
      await settlement.save();

      // Update agent
      await Agent.findByIdAndUpdate(settlement.agentId, {
        $inc: { commissionSettled: settlement.totalCommission },
      });

      return apiSuccess(null, "Settlement marked as completed");
    }

    return apiError("Invalid action");
  } catch (err) {
    return apiError(err.message, 500);
  }
}
