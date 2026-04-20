import dbConnect from "@/lib/mongodb";
import { Agent, Sticker, Customer, ScanLog } from "@/lib/models";
import { verifyAdminAuth } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(request) {
  const { error } = await verifyAdminAuth(request);
  if (error) return error;

  try {
    await dbConnect();

    const [
      totalAgents,
      verifiedAgents,
      pendingAgents,
      totalStickers,
      activatedStickers,
      allocatedStickers,
      unallocatedStickers,
      totalCustomers,
      completeProfiles,
      totalScans,
      activeScans,
      cancelledScans,
      completedScans,
    ] = await Promise.all([
      Agent.countDocuments(),
      Agent.countDocuments({ status: "verified" }),
      Agent.countDocuments({ status: "pending" }),
      Sticker.countDocuments(),
      Sticker.countDocuments({ status: "activated" }),
      Sticker.countDocuments({ status: "allocated" }),
      Sticker.countDocuments({ status: "unallocated" }),
      Customer.countDocuments(),
      Customer.countDocuments({ profileComplete: true }),
      ScanLog.countDocuments(),
      ScanLog.countDocuments({ status: "triggered" }),
      ScanLog.countDocuments({ status: "cancelled" }),
      ScanLog.countDocuments({ status: "completed" }),
    ]);

    // Top agents by sales
    const topAgents = await Agent.find({})
      .select("fullName phone address.city stickersSold totalRevenue status createdAt")
      .sort({ stickersSold: -1 })
      .limit(20);

    // Recent scans
    const recentScans = await ScanLog.find({})
      .sort({ createdAt: -1 })
      .limit(30);

    // Today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todaySales, todayScans] = await Promise.all([
      Sticker.countDocuments({ status: "activated", activatedAt: { $gte: todayStart } }),
      ScanLog.countDocuments({ createdAt: { $gte: todayStart } }),
    ]);

    const totalRevenue = activatedStickers * 199;

    return apiSuccess({
      overview: {
        totalAgents,
        verifiedAgents,
        pendingAgents,
        totalStickers,
        activatedStickers,
        allocatedStickers,
        unallocatedStickers,
        totalCustomers,
        completeProfiles,
        totalScans,
        activeScans,
        cancelledScans,
        completedScans,
        totalRevenue,
        todaySales,
        todayScans,
        todayRevenue: todaySales * 199,
      },
      topAgents,
      recentScans,
    });
  } catch (err) {
    return apiError(err.message, 500);
  }
}
