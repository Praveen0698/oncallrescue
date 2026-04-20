import { sendRegistrationEmail } from "@/lib/email";
import { verifyAgentAuth } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function POST(request) {
  // Only agents can trigger this
  const { error } = await verifyAgentAuth(request);
  if (error) return error;

  try {
    const { email, phone, qrId, registrationUrl } = await request.json();

    if (!email) return apiError("Email is required");
    if (!qrId) return apiError("QR ID is required");

    const result = await sendRegistrationEmail({
      to: email,
      customerPhone: phone,
      qrId,
      registrationUrl,
    });

    if (result.success) {
      return apiSuccess(null, `Registration email sent to ${email}`);
    } else {
      return apiError(`Email not sent: ${result.reason}. You can share the link manually.`);
    }
  } catch (err) {
    return apiError(err.message, 500);
  }
}
