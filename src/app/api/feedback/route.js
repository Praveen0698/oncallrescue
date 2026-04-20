import dbConnect from "@/lib/mongodb";
import { Feedback } from "@/lib/models";
import { verifyAdminAuth } from "@/lib/auth";
import { apiSuccess, apiError, apiCreated } from "@/lib/utils";

// GET - List feedback (admin) or get by customerId
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status && status !== "all") filter.status = status;

    const [items, total] = await Promise.all([
      Feedback.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Feedback.countDocuments(filter),
    ]);

    const counts = {
      all: await Feedback.countDocuments(),
      open: await Feedback.countDocuments({ status: "open" }),
      replied: await Feedback.countDocuments({ status: "replied" }),
      closed: await Feedback.countDocuments({ status: "closed" }),
    };

    return apiSuccess({
      items,
      counts,
      pagination: { page, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return apiError(err.message, 500);
  }
}

// POST - Submit feedback (public) or reply (admin)
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Admin reply
    if (body.action === "reply") {
      const { error } = await verifyAdminAuth(request);
      if (error) return error;

      const feedback = await Feedback.findById(body.feedbackId);
      if (!feedback) return apiError("Feedback not found", 404);

      feedback.adminReply = body.reply;
      feedback.status = "replied";
      await feedback.save();

      return apiSuccess(feedback, "Reply saved");
    }

    // Admin close
    if (body.action === "close") {
      const { error } = await verifyAdminAuth(request);
      if (error) return error;

      await Feedback.findByIdAndUpdate(body.feedbackId, { status: "closed" });
      return apiSuccess(null, "Closed");
    }

    // Submit new feedback (public)
    const { name, phone, email, type, message } = body;
    if (!name || !message) return apiError("Name and message are required");

    const feedback = await Feedback.create({
      name: name.trim(),
      phone: phone || undefined,
      email: email || undefined,
      type: type || "query",
      message: message.trim(),
    });

    return apiCreated(feedback, "Thank you! We'll get back to you soon.");
  } catch (err) {
    return apiError(err.message, 500);
  }
}
