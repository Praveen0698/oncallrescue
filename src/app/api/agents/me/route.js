import dbConnect from "@/lib/mongodb";
import { Agent, Sticker } from "@/lib/models";
import { verifyAgentAuth } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(request) {
  const { error, agent: authAgent } = await verifyAgentAuth(request);
  if (error) return error;

  try {
    await dbConnect();

    const agent = await Agent.findById(authAgent.id).select("-password");
    if (!agent) return apiError("Agent not found", 404);

    // Get today's sales count
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todaySales = await Sticker.countDocuments({
      agentId: agent._id,
      status: "activated",
      activatedAt: { $gte: todayStart },
    });

    const allocatedStickers = await Sticker.countDocuments({
      agentId: agent._id,
      status: "allocated",
    });

    return apiSuccess({
      ...agent.toObject(),
      todaySales,
      stickersRemaining: allocatedStickers,
      todayRevenue: todaySales * 199,
    });
  } catch (err) {
    return apiError(err.message, 500);
  }
}
