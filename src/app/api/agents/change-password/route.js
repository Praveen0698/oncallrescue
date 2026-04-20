import dbConnect from "@/lib/mongodb";
import { Agent } from "@/lib/models";
import { verifyPassword, hashPassword, apiSuccess, apiError } from "@/lib/utils";
import { verifyAgentAuth } from "@/lib/auth";

export async function POST(request) {
  const { error, agent: authAgent } = await verifyAgentAuth(request);
  if (error) return error;

  try {
    await dbConnect();
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) return apiError("Both passwords required");
    if (newPassword.length < 6) return apiError("Min 6 characters");

    const agent = await Agent.findById(authAgent.id);
    if (!agent) return apiError("Agent not found", 404);

    const isValid = await verifyPassword(currentPassword, agent.password);
    if (!isValid) return apiError("Current password is incorrect", 401);

    agent.password = await hashPassword(newPassword);
    await agent.save();

    return apiSuccess(null, "Password changed successfully");
  } catch (err) {
    return apiError(err.message, 500);
  }
}
