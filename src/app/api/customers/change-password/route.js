import dbConnect from "@/lib/mongodb";
import { Customer } from "@/lib/models";
import { verifyToken, hashPassword, verifyPassword, apiSuccess, apiError } from "@/lib/utils";

export async function POST(request) {
  const authHeader = request.headers.get("authorization");
  const cookieMatch = request.headers.get("cookie")?.match(/oncallrescue_token=([^;]+)/);
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : cookieMatch?.[1];
  if (!token) return apiError("Authentication required", 401);

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "customer") return apiError("Invalid token", 401);

  try {
    await dbConnect();
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) return apiError("Both current and new password are required");
    if (newPassword.length < 6) return apiError("New password must be at least 6 characters");

    const customer = await Customer.findById(decoded.id);
    if (!customer) return apiError("Customer not found", 404);

    const isValid = await verifyPassword(currentPassword, customer.password);
    if (!isValid) return apiError("Current password is incorrect", 401);

    customer.password = await hashPassword(newPassword);
    await customer.save();

    return apiSuccess(null, "Password changed successfully");
  } catch (err) {
    return apiError(err.message, 500);
  }
}
