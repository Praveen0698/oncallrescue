import dbConnect from "@/lib/mongodb";
import { Agent } from "@/lib/models";
import { verifyAdminAuth } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function POST(request) {
  const { error } = await verifyAdminAuth(request);
  if (error) return error;

  try {
    await dbConnect();
    const { action, agentId } = await request.json();

    const agent = await Agent.findById(agentId);
    if (!agent) return apiError("Agent not found", 404);

    if (action === "verify") {
      agent.status = "verified";
      await agent.save();
      return apiSuccess({ id: agent._id, status: agent.status }, `${agent.fullName} verified successfully`);
    }

    if (action === "suspend") {
      agent.status = "suspended";
      await agent.save();
      return apiSuccess({ id: agent._id, status: agent.status }, `${agent.fullName} suspended`);
    }

    if (action === "reactivate") {
      agent.status = "verified";
      await agent.save();
      return apiSuccess({ id: agent._id, status: agent.status }, `${agent.fullName} reactivated`);
    }

    return apiError("Invalid action");
  } catch (err) {
    return apiError(err.message, 500);
  }
}
