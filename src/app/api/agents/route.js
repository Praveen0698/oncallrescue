import dbConnect from "@/lib/mongodb";
import { Agent } from "@/lib/models";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  validatePhone,
  validateAadhar,
  validatePan,
  apiSuccess,
  apiError,
  apiCreated,
} from "@/lib/utils";

// GET - List all agents (admin use)
export async function GET(request) {
  try {
    await dbConnect();
    const agents = await Agent.find({})
      .select("-password -aadhar -pan")
      .sort({ createdAt: -1 });
    return apiSuccess(agents);
  } catch (error) {
    return apiError(error.message, 500);
  }
}

// POST - Register new agent
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    const {
      fullName, phone, email, dob, gender,
      aadhar, pan, address, bankDetails, password,
    } = body;

    // Validations
    if (!fullName || !phone || !email || !aadhar || !pan || !password) {
      return apiError("All required fields must be provided");
    }
    if (!validatePhone(phone)) {
      return apiError("Invalid phone number");
    }
    if (!validateAadhar(aadhar)) {
      return apiError("Invalid Aadhar number");
    }
    if (!validatePan(pan)) {
      return apiError("Invalid PAN number");
    }

    // Check existing
    const existing = await Agent.findOne({
      $or: [{ phone }, { email }, { aadhar }],
    });
    if (existing) {
      return apiError("Agent with this phone, email, or Aadhar already exists");
    }

    const hashedPassword = await hashPassword(password);

    const agent = await Agent.create({
      fullName,
      phone,
      email,
      dob: dob ? new Date(dob) : undefined,
      gender,
      aadhar,
      pan: pan.toUpperCase(),
      address,
      bankDetails,
      password: hashedPassword,
      status: "pending",
    });

    const token = generateToken({
      id: agent._id,
      role: "agent",
      phone: agent.phone,
    });

    return apiCreated(
      {
        agent: {
          id: agent._id,
          fullName: agent.fullName,
          phone: agent.phone,
          status: agent.status,
        },
        token,
      },
      "Agent registered successfully. Pending verification."
    );
  } catch (error) {
    if (error.code === 11000) {
      return apiError("Agent with these details already exists");
    }
    return apiError(error.message, 500);
  }
}
