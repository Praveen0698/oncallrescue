import dbConnect from "@/lib/mongodb";
import { Customer } from "@/lib/models";
import { verifyToken, apiSuccess, apiError } from "@/lib/utils";

export async function POST(request) {
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
    const { enabled } = await request.json();

    const customer = await Customer.findByIdAndUpdate(
      decoded.id,
      { scanEnabled: !!enabled },
      { new: true }
    );

    if (!customer) return apiError("Customer not found", 404);

    return apiSuccess(
      { scanEnabled: customer.scanEnabled },
      customer.scanEnabled ? "Scanning enabled" : "Scanning paused — QR won't work until re-enabled"
    );
  } catch (err) {
    return apiError(err.message, 500);
  }
}
