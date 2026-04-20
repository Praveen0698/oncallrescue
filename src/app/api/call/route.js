import dbConnect from "@/lib/mongodb";
import { Customer, ScanLog, Sticker } from "@/lib/models";
import { makeCall, sendSMS, isTwilioConfigured } from "@/lib/twilio";
import { apiSuccess, apiError } from "@/lib/utils";

export async function POST(request) {
  try {
    await dbConnect();
    const { action, scanLogId, contactIndex } = await request.json();

    if (!scanLogId) return apiError("Scan log ID required");

    const scanLog = await ScanLog.findById(scanLogId);
    if (!scanLog) return apiError("Scan log not found", 404);
    if (scanLog.status === "cancelled") return apiError("Emergency was cancelled by owner");

    const customer = await Customer.findById(scanLog.customerId);
    if (!customer) return apiError("Customer not found", 404);

    if (!isTwilioConfigured()) {
      return apiError("Calling service not configured yet. Please call 112 directly.", 503);
    }

    // Sort contacts: primary first
    const contacts = [...customer.emergencyContacts].sort(
      (a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)
    );

    // ─── CALL SINGLE CONTACT ─────────────────────────
    if (action === "call" && contactIndex !== undefined) {
      const contact = contacts[contactIndex];
      if (!contact) return apiError("Contact not found");

      // Deduct credit
      if (customer.callCredits > 0) {
        customer.callCredits -= 1;
        await customer.save();
      } else {
        return apiError("No call credits remaining. Please recharge.");
      }

      const result = await makeCall(contact.phone, {
        ownerName: customer.fullName,
        qrId: scanLog.qrId,
        helperPhone: scanLog.helperPhone || "",
        location: scanLog.scannerLocation?.address || "",
      });

      // Log the call
      scanLog.callsMade += 1;
      scanLog.notificationsSent.push({
        contactName: contact.name,
        channel: "call",
        sentAt: new Date(),
        delivered: result.success,
      });
      await scanLog.save();

      if (result.success) {
        return apiSuccess({
          callSid: result.callSid,
          contactName: contact.name,
          creditsRemaining: customer.callCredits,
        }, `Calling ${contact.name}... They will receive a call from our virtual number.`);
      } else {
        // Refund the credit if call failed
        customer.callCredits += 1;
        await customer.save();
        return apiError(`Call failed: ${result.reason}. Try the next contact or call 112.`);
      }
    }

    // ─── SEND SMS TO CONTACT ─────────────────────────
    if (action === "sms" && contactIndex !== undefined) {
      const contact = contacts[contactIndex];
      if (!contact) return apiError("Contact not found");

      const locationText = scanLog.scannerLocation?.address || "Location unavailable";
      const mapsLink = scanLog.scannerLocation?.lat
        ? `https://maps.google.com/?q=${scanLog.scannerLocation.lat},${scanLog.scannerLocation.lng}`
        : "";

      const message = `OnCallRescue EMERGENCY: ${customer.fullName}'s QR scanned. ${locationText !== "Location unavailable" ? locationText + ". " : ""}Reporter: ${scanLog.helperPhone || "N/A"}. Call 112 if needed.`;

      console.log("[SMS] Sending to:", contact.phone, "Message length:", message.length);
      const result = await sendSMS(contact.phone, message);
      console.log("[SMS] Result:", JSON.stringify(result));

      scanLog.notificationsSent.push({
        contactName: contact.name,
        channel: "sms",
        sentAt: new Date(),
        delivered: result.success,
      });
      await scanLog.save();

      if (result.success) {
        return apiSuccess(null, `SMS sent to ${contact.name}`);
      } else {
        return apiError(`SMS failed: ${result.reason}`);
      }
    }

    return apiError("Invalid action");
  } catch (err) {
    return apiError(err.message, 500);
  }
}
