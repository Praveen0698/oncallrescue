import dbConnect from "@/lib/mongodb";
import { Agent } from "@/lib/models";
import { verifyPassword, generateToken, apiSuccess, apiError } from "@/lib/utils";

export async function POST(request) {
  try {
    await dbConnect();
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return apiError("Phone and password are required");
    }

    const agent = await Agent.findOne({ phone });
    if (!agent) {
      return apiError("No agent found with this phone number", 404);
    }

    const isValid = await verifyPassword(password, agent.password);
    if (!isValid) {
      return apiError("Invalid password", 401);
    }

    if (agent.status === "suspended") {
      return apiError("Your account has been suspended. Contact admin.", 403);
    }

    const token = generateToken({
      id: agent._id,
      role: "agent",
      phone: agent.phone,
      name: agent.fullName,
      status: agent.status,
    });

    return apiSuccess({
      token,
      agent: {
        id: agent._id,
        fullName: agent.fullName,
        phone: agent.phone,
        email: agent.email,
        status: agent.status,
        stickersAllotted: agent.stickersAllotted,
        stickersSold: agent.stickersSold,
        totalRevenue: agent.totalRevenue,
      },
    }, "Login successful");
  } catch (error) {
    return apiError(error.message, 500);
  }
}
