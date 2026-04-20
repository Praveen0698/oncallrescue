import dbConnect from "@/lib/mongodb";
import { Sticker, Agent, Customer } from "@/lib/models";
import { verifyAgentAuth, verifyAdminAuth } from "@/lib/auth";
import { generateQrId, validatePhone, apiSuccess, apiError, apiCreated } from "@/lib/utils";

// GET - List stickers with pagination and filters
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const agentId = searchParams.get("agentId");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = Math.min(parseInt(searchParams.get("limit")) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (agentId) filter.agentId = agentId;

    const [stickers, total] = await Promise.all([
      Sticker.find(filter)
        .populate("agentId", "fullName phone address.city")
        .populate("customerId", "fullName phone vehicleNumber profileComplete")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Sticker.countDocuments(filter),
    ]);

    // Get status counts
    const baseFilter = agentId ? { agentId } : {};
    const [countAll, countUnallocated, countAllocated, countSold, countActive] = await Promise.all([
      Sticker.countDocuments(baseFilter),
      Sticker.countDocuments({ ...baseFilter, status: "unallocated" }),
      Sticker.countDocuments({ ...baseFilter, status: "allocated" }),
      Sticker.countDocuments({ ...baseFilter, status: "sold" }),
      Sticker.countDocuments({ ...baseFilter, status: "active" }),
    ]);

    return apiSuccess({
      stickers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      counts: {
        all: countAll,
        unallocated: countUnallocated,
        allocated: countAllocated,
        sold: countSold,
        active: countActive,
      },
    });
  } catch (error) {
    return apiError(error.message, 500);
  }
}

// POST - Sticker actions
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    // ─── BATCH CREATE (admin only) ───────────────────
    if (body.action === "batch-create") {
      const { error } = await verifyAdminAuth(request);
      if (error) return error;

      const count = Math.min(body.count || 50, 500);
      const stickers = [];

      for (let i = 0; i < count; i++) {
        let qrId, attempts = 0;
        do {
          qrId = generateQrId();
          const exists = await Sticker.findOne({ qrId });
          if (!exists) break;
          attempts++;
        } while (attempts < 10);
        stickers.push({ qrId, status: "unallocated" });
      }

      const created = await Sticker.insertMany(stickers);
      return apiCreated(
        { count: created.length, qrIds: created.map((s) => s.qrId) },
        `${created.length} stickers created`
      );
    }

    // ─── ALLOCATE TO AGENT (admin only) ──────────────
    if (body.action === "allocate-to-agent") {
      const { error } = await verifyAdminAuth(request);
      if (error) return error;

      const { agentId, count } = body;
      const requestedCount = parseInt(count) || 50;

      const agent = await Agent.findById(agentId);
      if (!agent) return apiError("Agent not found");
      if (agent.status !== "verified") return apiError("Agent must be verified first");

      // Only allocate from unallocated pool
      const unallocated = await Sticker.find({ status: "unallocated" })
        .sort({ createdAt: 1 })
        .limit(requestedCount);

      if (unallocated.length === 0) {
        return apiError("No unallocated stickers available. Create more stickers first.");
      }

      if (unallocated.length < requestedCount) {
        return apiError(
          `Only ${unallocated.length} unallocated stickers available. Cannot allocate ${requestedCount}.`
        );
      }

      const ids = unallocated.map((s) => s._id);
      await Sticker.updateMany(
        { _id: { $in: ids } },
        { status: "allocated", agentId: agent._id }
      );

      agent.stickersAllotted += unallocated.length;
      await agent.save();

      const allocatedQrIds = unallocated.map((s) => s.qrId);

      return apiSuccess(
        { allocated: unallocated.length, qrIds: allocatedQrIds },
        `${unallocated.length} stickers allocated to ${agent.fullName}`
      );
    }

    // ─── ACTIVATE / SELL STICKER (agent action) ──────
    if (body.action === "activate") {
      const { error, agent: authAgent } = await verifyAgentAuth(request);
      if (error) return error;

      const { qrId, customerPhone, paymentMethod } = body;
      if (!qrId || !customerPhone) return apiError("QR ID and customer phone are required");
      if (!validatePhone(customerPhone)) return apiError("Invalid phone number");

      const sticker = await Sticker.findOne({ qrId: qrId.toUpperCase() });
      if (!sticker) return apiError("Sticker not found. Check the QR ID.");
      if (sticker.status === "sold" || sticker.status === "active") {
        return apiError("This sticker is already sold");
      }
      if (sticker.status === "unallocated") {
        return apiError("This sticker is not allocated to any agent yet");
      }
      if (sticker.agentId && sticker.agentId.toString() !== authAgent.id) {
        return apiError("This sticker is not allocated to you");
      }

      sticker.status = "sold";
      sticker.customerPhone = customerPhone;
      sticker.soldAt = new Date();
      sticker.paymentStatus = "collected";
      sticker.paymentMethod = paymentMethod || "cash";
      await sticker.save();

      await Agent.findByIdAndUpdate(authAgent.id, {
        $inc: { stickersSold: 1, totalRevenue: 199 },
      });

      return apiSuccess(
        { qrId: sticker.qrId, customerPhone },
        "Sticker sold! Customer can now register using their link."
      );
    }

    // ─── VERIFY STICKER STATUS ───────────────────────
    if (body.action === "verify") {
      const { qrId } = body;
      const sticker = await Sticker.findOne({ qrId: qrId.toUpperCase() });
      if (!sticker) return apiError("Sticker not found", 404);
      return apiSuccess({
        qrId: sticker.qrId,
        status: sticker.status,
        hasCustomer: !!sticker.customerId,
      });
    }

    return apiError("Invalid action");
  } catch (error) {
    return apiError(error.message, 500);
  }
}
