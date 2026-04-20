import dbConnect from "@/lib/mongodb";
import { Customer } from "@/lib/models";
import { apiSuccess, apiError } from "@/lib/utils";

// GET - Check if a vehicle number has a OnCallRescue profile
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const vehicleNumber = searchParams.get("vehicleNumber");

    if (!vehicleNumber) {
      return apiError("Vehicle number is required");
    }

    const normalized = vehicleNumber.replace(/\s/g, "").toUpperCase();
    const customer = await Customer.findOne({ vehicleNumber: normalized });

    if (!customer) {
      return apiSuccess(
        { found: false },
        "No OnCallRescue profile found for this vehicle number"
      );
    }

    if (!customer.scanEnabled) {
      return apiError("Scanning is currently disabled by the owner", 403);
    }

    return apiSuccess({
      found: true,
      qrId: customer.qrId,
      profileComplete: customer.profileComplete,
    });
  } catch (error) {
    return apiError(error.message, 500);
  }
}
