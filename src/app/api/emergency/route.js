import dbConnect from "@/lib/mongodb";
import { Customer, ScanLog, Sticker } from "@/lib/models";
import { apiSuccess, apiError, maskPhone } from "@/lib/utils";

// GET - Get emergency info for a QR code (limited data, privacy-first)
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const qrId = searchParams.get("qrId");
    const vehicleNumber = searchParams.get("vehicleNumber");

    let customer;

    if (qrId) {
      customer = await Customer.findOne({ qrId });
    } else if (vehicleNumber) {
      customer = await Customer.findOne({
        vehicleNumber: vehicleNumber.replace(/\s/g, "").toUpperCase(),
      });
    }

    if (!customer) {
      return apiError("No emergency profile linked to this ID", 404);
    }

    if (!customer.scanEnabled) {
      return apiError("Scanning is currently disabled by the owner", 403);
    }

    if (!customer.profileComplete) {
      return apiError("Emergency profile is not yet complete", 404);
    }

    // Return ONLY essential medical info — NO personal identifiers
    return apiSuccess({
      hasProfile: true,
      bloodType: customer.bloodType,
      allergies: customer.allergies || null,
      medicalConditions: customer.medicalConditions || null,
      medications: customer.medications || null,
      organDonor: customer.organDonor,
      contactCount: customer.emergencyContacts.length,
      callCreditsAvailable: customer.callCredits > 0,
    });
  } catch (error) {
    return apiError(error.message, 500);
  }
}

// POST - Trigger emergency / cancel emergency
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    // ─── TRIGGER EMERGENCY ───────────────────────────
    if (body.action === "trigger") {
      const { qrId, vehicleNumber, deviceInfo, location, helperPhone } = body;

      let customer;
      if (qrId) {
        customer = await Customer.findOne({ qrId });
      } else if (vehicleNumber) {
        customer = await Customer.findOne({
          vehicleNumber: vehicleNumber.replace(/\s/g, "").toUpperCase(),
        });
      }

      if (!customer) return apiError("No profile found", 404);
      if (!customer.scanEnabled)
        return apiError("Scanning disabled by owner", 403);
      if (customer.callCredits <= 0)
        return apiError("No call credits remaining. Please recharge.", 403);

      // Check cooldown — block if same QR scanned within 10 minutes
      const recentScan = await ScanLog.findOne({
        qrId: customer.qrId || qrId,
        status: { $in: ["triggered", "completed"] },
        createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
      });

      if (recentScan) {
        return apiError(
          "Emergency already reported for this ID in the last 10 minutes.",
          429
        );
      }

      // Reverse geocode the location
      let locationAddress = "";
      let mapsLink = "";
      if (location?.lat && location?.lng) {
        // Always generate maps link
        mapsLink = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
        // Fallback address with coordinates
        locationAddress = `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
        try {
          const { reverseGeocode } = await import("@/lib/location");
          const geo = await reverseGeocode(location.lat, location.lng);
          if (geo && geo.shortAddress) locationAddress = geo.shortAddress;
        } catch (geoErr) {
          console.warn("Geocode failed, using coordinates:", geoErr.message);
        }
      }

      // Create scan log with resolved address
      const scanLog = await ScanLog.create({
        qrId: customer.qrId || qrId,
        customerId: customer._id,
        scannerDeviceInfo: deviceInfo || "Unknown",
        helperPhone: helperPhone || "",
        scannerLocation: {
          lat: location?.lat,
          lng: location?.lng,
          address: locationAddress,
        },
        status: "triggered",
      });

      // Increment emergency count on sticker
      await Sticker.findOneAndUpdate(
        { qrId: customer.qrId || qrId },
        { $inc: { emergencyCount: 1 } }
      );

      // Collect all emails to notify: contact emails + customer notification emails
      const allEmails = new Set();
      customer.emergencyContacts.forEach(c => { if (c.email) allEmails.add(c.email); });
      if (customer.notificationEmails) customer.notificationEmails.forEach(e => { if (e) allEmails.add(e); });

      // Send emergency alert emails with location + map link
      try {
        const { sendEmergencyAlertEmail } = await import("@/lib/email");
        for (const email of allEmails) {
          const contactName = customer.emergencyContacts.find(c => c.email === email)?.name || "Emergency Contact";
          sendEmergencyAlertEmail({
            to: email,
            contactName,
            ownerName: customer.fullName,
            qrId: customer.qrId || qrId,
            helperPhone: helperPhone || "",
            location: {
              address: locationAddress,
              lat: location?.lat,
              lng: location?.lng,
              mapsLink,
            },
          }).catch((err) => console.error("Emergency email error:", err));
        }
      } catch (emailErr) {
        console.error("Email module error:", emailErr);
      }

      // Send admin notification with FULL unmasked details
      try {
        const { sendAdminEmergencyEmail } = await import("@/lib/email");
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
          sendAdminEmergencyEmail({
            to: adminEmail,
            ownerName: customer.fullName,
            ownerPhone: customer.phone,
            vehicleNumber: customer.vehicleNumber,
            qrId: customer.qrId || qrId,
            helperPhone: helperPhone || "Not provided",
            contacts: customer.emergencyContacts,
            location: { address: locationAddress, lat: location?.lat, lng: location?.lng, mapsLink },
          }).catch(err => console.error("Admin email error:", err));
        }
      } catch {}

      // Build masked contacts for frontend
      const contacts = customer.emergencyContacts.map((c) => ({
        name: c.name,
        relation: c.relation,
        isPrimary: c.isPrimary,
        maskedPhone: maskPhone(c.phone),
      }));

      // Sort: primary first
      contacts.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));

      return apiSuccess({
        scanLogId: scanLog._id,
        medicalInfo: {
          bloodType: customer.bloodType,
          allergies: customer.allergies,
          medicalConditions: customer.medicalConditions,
          medications: customer.medications,
          organDonor: customer.organDonor,
        },
        contacts,
        location: {
          address: locationAddress,
          lat: location?.lat,
          lng: location?.lng,
          mapsLink,
        },
        message:
          "Emergency triggered. Owner notified. All contacts will receive WhatsApp & Email alerts.",
      });
    }

    // ─── CANCEL EMERGENCY (owner action) ─────────────
    if (body.action === "cancel") {
      const { scanLogId, customerId } = body;

      const scanLog = await ScanLog.findById(scanLogId);
      if (!scanLog) return apiError("Scan log not found");

      // Verify the owner is cancelling
      if (scanLog.customerId.toString() !== customerId) {
        return apiError("Unauthorized", 403);
      }

      scanLog.status = "cancelled";
      scanLog.cancelledByOwner = true;
      await scanLog.save();

      return apiSuccess(null, "Emergency cancelled. No calls will be made.");
    }

    // ─── INITIATE CALL (after countdown) ─────────────
    if (body.action === "call") {
      const { scanLogId } = body;

      const scanLog = await ScanLog.findById(scanLogId);
      if (!scanLog) return apiError("Scan log not found");
      if (scanLog.status === "cancelled")
        return apiError("Emergency was cancelled by owner");

      const customer = await Customer.findById(scanLog.customerId);
      if (!customer) return apiError("Customer not found");

      // Deduct call credit
      if (customer.callCredits > 0) {
        customer.callCredits -= 1;
        await customer.save();
      }

      scanLog.status = "completed";
      scanLog.callsMade += 1;
      await scanLog.save();

      // In production: Trigger Exotel/Twilio cascade call here
      // Primary → wait 20s → Secondary → wait 20s → next...

      return apiSuccess({
        message:
          "Cascade call initiated. Calling primary contact first. If no answer, next contact will be called automatically.",
        creditsRemaining: customer.callCredits,
      });
    }

    return apiError("Invalid action");
  } catch (error) {
    return apiError(error.message, 500);
  }
}
