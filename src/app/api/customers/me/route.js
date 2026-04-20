import dbConnect from "@/lib/mongodb";
import { Customer, ScanLog, Sticker } from "@/lib/models";
import { verifyToken, apiSuccess, apiError } from "@/lib/utils";

export async function GET(request) {
  // Verify customer token
  const authHeader = request.headers.get("authorization");
  const cookieMatch = request.headers.get("cookie")?.match(/oncallrescue_token=([^;]+)/);
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : cookieMatch?.[1];

  if (!token) return apiError("Authentication required", 401);

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "customer") {
    return apiError("Invalid token", 401);
  }

  try {
    await dbConnect();

    const customer = await Customer.findById(decoded.id).select("-password");
    if (!customer) return apiError("Customer not found", 404);

    // Get scan history
    const scanLogs = await ScanLog.find({ customerId: customer._id })
      .sort({ createdAt: -1 })
      .limit(20);

    // Get sticker info
    const sticker = await Sticker.findOne({
      $or: [
        { customerPhone: customer.phone },
        { customerId: customer._id },
      ],
    });

    return apiSuccess({
      customer: customer.toObject(),
      scanLogs,
      sticker: sticker ? {
        qrId: sticker.qrId,
        status: sticker.status,
        callCredits: sticker.callCredits,
        emergencyCount: sticker.emergencyCount,
      } : null,
    });
  } catch (err) {
    return apiError(err.message, 500);
  }
}
