import dbConnect from "@/lib/mongodb";
import { AdminSettings } from "@/lib/models";
import { verifyAdminAuth } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

// GET - Get a setting (public for payment QR)
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    if (!key) return apiError("Key is required");

    const setting = await AdminSettings.findOne({ key });
    if (!setting) return apiSuccess({ key, value: null }, "Setting not found");

    return apiSuccess({ key: setting.key, value: setting.value });
  } catch (err) {
    return apiError(err.message, 500);
  }
}

// POST - Set a setting (admin only)
export async function POST(request) {
  const { error } = await verifyAdminAuth(request);
  if (error) return error;

  try {
    await dbConnect();
    const { key, value } = await request.json();
    if (!key) return apiError("Key is required");

    await AdminSettings.findOneAndUpdate(
      { key },
      { key, value },
      { upsert: true, new: true }
    );

    return apiSuccess(null, `Setting "${key}" updated`);
  } catch (err) {
    return apiError(err.message, 500);
  }
}
