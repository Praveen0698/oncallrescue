import dbConnect from "@/lib/mongodb";
import { RechargeRequest, Customer } from "@/lib/models";
import { verifyAdminAuth } from "@/lib/auth";
import { verifyToken, apiSuccess, apiError, apiCreated } from "@/lib/utils";

// GET - List recharge requests (admin or customer)
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (customerId) filter.customerId = customerId;

    const [items, total] = await Promise.all([
      RechargeRequest.find(filter)
        .select("-screenshotBase64")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      RechargeRequest.countDocuments(filter),
    ]);

    const counts = {
      all: await RechargeRequest.countDocuments(customerId ? { customerId } : {}),
      pending: await RechargeRequest.countDocuments({ ...(customerId ? { customerId } : {}), status: "pending" }),
      approved: await RechargeRequest.countDocuments({ ...(customerId ? { customerId } : {}), status: "approved" }),
      rejected: await RechargeRequest.countDocuments({ ...(customerId ? { customerId } : {}), status: "rejected" }),
    };

    return apiSuccess({ items, counts, pagination: { page, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    return apiError(err.message, 500);
  }
}

// POST - Submit recharge request or admin approve/reject
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    // ─── CUSTOMER SUBMITS RECHARGE ───────────────────
    if (body.action === "request") {
      const { customerId, customerPhone, customerName, screenshotBase64, screenshotType } = body;

      if (!customerId || !screenshotBase64) {
        return apiError("Customer ID and payment screenshot are required");
      }

      // Check base64 size (~5MB max)
      if (screenshotBase64.length > 7 * 1024 * 1024) {
        return apiError("Screenshot too large. Please use a smaller image.");
      }

      const recharge = await RechargeRequest.create({
        customerId,
        customerPhone: customerPhone || "",
        customerName: customerName || "",
        amount: 49,
        credits: 5,
        screenshotBase64,
        screenshotType: screenshotType || "image/jpeg",
      });

      return apiCreated(
        { id: recharge._id, status: recharge.status },
        "Recharge request submitted! Admin will verify and update your credits."
      );
    }

    // ─── ADMIN VIEWS SCREENSHOT ──────────────────────
    if (body.action === "get-screenshot") {
      const { error } = await verifyAdminAuth(request);
      if (error) return error;

      const recharge = await RechargeRequest.findById(body.rechargeId).select("screenshotBase64 screenshotType");
      if (!recharge) return apiError("Not found", 404);

      return apiSuccess({
        screenshotBase64: recharge.screenshotBase64,
        screenshotType: recharge.screenshotType,
      });
    }

    // ─── ADMIN APPROVES ──────────────────────────────
    if (body.action === "approve") {
      const { error } = await verifyAdminAuth(request);
      if (error) return error;

      const recharge = await RechargeRequest.findById(body.rechargeId);
      if (!recharge) return apiError("Not found", 404);
      if (recharge.status !== "pending") return apiError("Already processed");

      recharge.status = "approved";
      recharge.approvedAt = new Date();
      recharge.adminNote = body.note || "";
      await recharge.save();

      // Add credits to customer
      await Customer.findByIdAndUpdate(recharge.customerId, {
        $inc: { callCredits: recharge.credits },
      });

      return apiSuccess(null, `Approved! ${recharge.credits} credits added to customer.`);
    }

    // ─── ADMIN REJECTS ───────────────────────────────
    if (body.action === "reject") {
      const { error } = await verifyAdminAuth(request);
      if (error) return error;

      const recharge = await RechargeRequest.findById(body.rechargeId);
      if (!recharge) return apiError("Not found", 404);
      if (recharge.status !== "pending") return apiError("Already processed");

      recharge.status = "rejected";
      recharge.adminNote = body.note || "Payment could not be verified";
      await recharge.save();

      return apiSuccess(null, "Recharge request rejected.");
    }

    return apiError("Invalid action");
  } catch (err) {
    return apiError(err.message, 500);
  }
}
