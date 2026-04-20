import dbConnect from "@/lib/mongodb";
import { Customer, Sticker } from "@/lib/models";
import { apiSuccess, apiError, apiCreated, validatePhone } from "@/lib/utils";

// GET - Get customer by qrId or vehicleNumber
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const qrId = searchParams.get("qrId");
    const vehicleNumber = searchParams.get("vehicleNumber");
    const phone = searchParams.get("phone");

    let customer;

    if (qrId) {
      customer = await Customer.findOne({ qrId });
    } else if (vehicleNumber) {
      customer = await Customer.findOne({
        vehicleNumber: vehicleNumber.replace(/\s/g, "").toUpperCase(),
      });
    } else if (phone) {
      customer = await Customer.findOne({ phone });
    }

    if (!customer) {
      return apiError("Customer not found", 404);
    }

    return apiSuccess(customer);
  } catch (error) {
    return apiError(error.message, 500);
  }
}

// POST - Register / complete customer profile
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    const {
      phone, fullName, dob, gender, bloodType,
      vehicleNumber, vehicleType, allergies,
      medicalConditions, medications, organDonor,
      emergencyContacts, notificationEmails, qrId, password,
    } = body;

    if (!phone || !fullName) {
      return apiError("Phone and full name are required");
    }
    if (!validatePhone(phone)) {
      return apiError("Invalid phone number");
    }
    if (!password || password.length < 6) {
      return apiError("Password must be at least 6 characters");
    }
    if (!emergencyContacts || emergencyContacts.length === 0) {
      return apiError("At least one emergency contact is required");
    }

    const { hashPassword } = await import("@/lib/utils");

    // Ensure at least one primary contact
    const hasPrimary = emergencyContacts.some((c) => c.isPrimary);
    if (!hasPrimary) {
      emergencyContacts[0].isPrimary = true;
    }

    // Only hash password for new registrations (not edits)
    const isNewPassword = password && password !== "existing-no-change" && password.length >= 6;
    const hashedPassword = isNewPassword ? await hashPassword(password) : null;

    // Check if customer exists (via phone)
    let customer = await Customer.findOne({ phone });

    if (customer) {
      // Update existing — don't touch password
      customer.fullName = fullName;
      customer.dob = dob ? new Date(dob) : customer.dob;
      customer.gender = gender || customer.gender;
      customer.bloodType = bloodType || customer.bloodType;
      customer.vehicleNumber = vehicleNumber
        ? vehicleNumber.replace(/\s/g, "").toUpperCase()
        : customer.vehicleNumber;
      customer.vehicleType = vehicleType || customer.vehicleType;
      customer.allergies = allergies;
      customer.medicalConditions = medicalConditions;
      customer.medications = medications;
      customer.organDonor = organDonor || false;
      customer.emergencyContacts = emergencyContacts;
      if (notificationEmails) customer.notificationEmails = notificationEmails.filter(e => e);
      if (hashedPassword) customer.password = hashedPassword;
      customer.profileComplete = true;
      if (qrId) customer.qrId = qrId;
      await customer.save();

      // Link sticker
      await Sticker.findOneAndUpdate(
        { customerPhone: phone, status: "sold" },
        { customerId: customer._id, status: "active", activatedAt: new Date() }
      );

      return apiSuccess(customer, "Profile updated successfully");
    }

    // Create new
    if (!hashedPassword) {
      return apiError("Password is required for new registration");
    }

    customer = await Customer.create({
      phone,
      fullName,
      dob: dob ? new Date(dob) : undefined,
      gender,
      bloodType,
      vehicleNumber: vehicleNumber
        ? vehicleNumber.replace(/\s/g, "").toUpperCase()
        : undefined,
      vehicleType,
      allergies,
      medicalConditions,
      medications,
      organDonor: organDonor || false,
      emergencyContacts,
      notificationEmails: notificationEmails ? notificationEmails.filter(e => e) : [],
      qrId,
      password: hashedPassword,
      profileComplete: true,
      callCredits: 5,
    });

    // Link sticker if qrId provided
    if (qrId) {
      await Sticker.findOneAndUpdate(
        { qrId },
        { customerId: customer._id, status: "active", activatedAt: new Date() }
      );
    }

    // Also find sticker by customerPhone if no qrId
    if (!qrId && phone) {
      await Sticker.findOneAndUpdate(
        { customerPhone: phone, status: "sold" },
        { customerId: customer._id, status: "active", activatedAt: new Date() }
      );
    }

    return apiCreated(customer, "Profile created successfully!");
  } catch (error) {
    if (error.code === 11000) {
      return apiError("A profile with this phone number already exists");
    }
    return apiError(error.message, 500);
  }
}
