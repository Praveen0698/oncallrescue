import { verifyAgentAuth } from "@/lib/auth";
import { sendRegistrationEmail } from "@/lib/email";
import { apiSuccess, apiError } from "@/lib/utils";

export async function POST(request) {
  // Only agents can trigger this
  const { error } = await verifyAgentAuth(request);
  if (error) return error;

  try {
    const { email, qrId, phone } = await request.json();

    if (!email || !qrId) {
      return apiError("Email and QR ID are required");
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const registrationUrl = `${appUrl}/customer/register?qrId=${qrId}&phone=${phone || ""}`;

    const result = await sendRegistrationEmail({
      to: email,
      qrId,
      phone: phone || "",
      registrationUrl,
    });

    if (result.success) {
      return apiSuccess({ messageId: result.messageId }, "Registration email sent successfully!");
    } else {
      return apiError(`Failed to send email: ${result.reason}`, 500);
    }
  } catch (err) {
    return apiError(err.message, 500);
  }
}
