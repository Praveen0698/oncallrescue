import { apiSuccess } from "@/lib/utils";

// Twilio sends status updates here
export async function POST(request) {
  try {
    const formData = await request.formData();
    const status = formData.get("CallStatus");
    const callSid = formData.get("CallSid");
    const duration = formData.get("CallDuration");

    console.log(`[Twilio Status] ${callSid}: ${status} (${duration || 0}s)`);

    return apiSuccess(null);
  } catch {
    return apiSuccess(null);
  }
}
