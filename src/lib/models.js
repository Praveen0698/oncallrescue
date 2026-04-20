import mongoose from "mongoose";

// ═══════════════════════════════════════════════════════════════
// AGENT MODEL
// ═══════════════════════════════════════════════════════════════
const AgentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    dob: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    aadhar: { type: String, required: true },
    pan: { type: String, required: true },
    address: {
      street: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    bankDetails: {
      accountName: String,
      accountNumber: String,
      ifsc: String,
      bankName: String,
    },
    profilePhoto: String,
    password: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "verified", "suspended"],
      default: "pending",
    },
    stickersAllotted: { type: Number, default: 0 },
    stickersSold: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    commissionEarned: { type: Number, default: 0 },
    commissionSettled: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ═══════════════════════════════════════════════════════════════
// STICKER MODEL
// ═══════════════════════════════════════════════════════════════
const StickerSchema = new mongoose.Schema(
  {
    qrId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["unallocated", "allocated", "sold", "active", "disabled"],
      default: "unallocated",
    },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: "Agent", default: null },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    customerPhone: String,
    soldAt: Date,
    activatedAt: Date,
    paymentAmount: { type: Number, default: 199 },
    paymentMethod: { type: String, enum: ["cash", "upi"], default: "cash" },
    paymentStatus: { type: String, enum: ["pending", "collected"], default: "pending" },
    callCredits: { type: Number, default: 5 },
    emergencyCount: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },
    settlementId: { type: mongoose.Schema.Types.ObjectId, ref: "Settlement", default: null },
  },
  { timestamps: true }
);

// ═══════════════════════════════════════════════════════════════
// CUSTOMER MODEL
// ═══════════════════════════════════════════════════════════════
const EmergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  relation: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  isPrimary: { type: Boolean, default: false },
});

const CustomerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    dob: Date,
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    bloodType: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"] },
    vehicleNumber: { type: String, index: true },
    vehicleType: { type: String, enum: ["Bike", "Car", "Bus", "Cycle", "Auto", "Truck", "Other"] },
    allergies: String,
    medicalConditions: String,
    medications: String,
    organDonor: { type: Boolean, default: false },
    emergencyContacts: [EmergencyContactSchema],
    // Up to 3 primary notification emails for emergency alerts
    notificationEmails: [{ type: String }],
    stickerId: { type: mongoose.Schema.Types.ObjectId, ref: "Sticker" },
    qrId: String,
    password: { type: String },
    profileComplete: { type: Boolean, default: false },
    scanEnabled: { type: Boolean, default: true },
    callCredits: { type: Number, default: 5 },
  },
  { timestamps: true }
);

// ═══════════════════════════════════════════════════════════════
// SCAN LOG MODEL
// ═══════════════════════════════════════════════════════════════
const ScanLogSchema = new mongoose.Schema(
  {
    qrId: { type: String, required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    helperPhone: String,
    scannerDeviceInfo: String,
    scannerLocation: {
      lat: Number,
      lng: Number,
      address: String,
    },
    status: { type: String, enum: ["triggered", "cancelled", "completed", "blocked"], default: "triggered" },
    cancelledByOwner: { type: Boolean, default: false },
    callsMade: { type: Number, default: 0 },
    notificationsSent: [{
      contactName: String,
      channel: { type: String, enum: ["whatsapp", "email", "sms", "call", "webrtc", "push"] },
      sentAt: Date,
      delivered: Boolean,
    }],
  },
  { timestamps: true }
);

// ═══════════════════════════════════════════════════════════════
// FEEDBACK MODEL
// ═══════════════════════════════════════════════════════════════
const FeedbackSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: String,
    email: String,
    type: { type: String, enum: ["query", "feedback", "complaint", "suggestion"], default: "query" },
    message: { type: String, required: true },
    status: { type: String, enum: ["open", "replied", "closed"], default: "open" },
    adminReply: String,
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
  },
  { timestamps: true }
);

// ═══════════════════════════════════════════════════════════════
// RECHARGE REQUEST MODEL
// ═══════════════════════════════════════════════════════════════
const RechargeRequestSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    customerPhone: { type: String, required: true },
    customerName: String,
    amount: { type: Number, default: 49 },
    credits: { type: Number, default: 10 },
    screenshotBase64: { type: String, required: true },
    screenshotType: { type: String, default: "image/jpeg" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    adminNote: String,
    approvedAt: Date,
  },
  { timestamps: true }
);

// ═══════════════════════════════════════════════════════════════
// SETTLEMENT MODEL
// ═══════════════════════════════════════════════════════════════
const SettlementSchema = new mongoose.Schema(
  {
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: "Agent", required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    totalSales: { type: Number, default: 0 },
    cashSales: { type: Number, default: 0 },
    upiSales: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    cashCollected: { type: Number, default: 0 },
    upiCollected: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 30 },
    totalCommission: { type: Number, default: 0 },
    // Net: positive = agent owes admin, negative = admin owes agent
    netSettlement: { type: Number, default: 0 },
    status: { type: String, enum: ["pending", "settled"], default: "pending" },
    settledAt: Date,
    note: String,
    stickerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Sticker" }],
  },
  { timestamps: true }
);

// ═══════════════════════════════════════════════════════════════
// ADMIN SETTINGS MODEL
// ═══════════════════════════════════════════════════════════════
const AdminSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

// ═══════════════════════════════════════════════════════════════
// EXPORT MODELS
// ═══════════════════════════════════════════════════════════════
export const Agent = mongoose.models.Agent || mongoose.model("Agent", AgentSchema);
export const Sticker = mongoose.models.Sticker || mongoose.model("Sticker", StickerSchema);
export const Customer = mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
export const ScanLog = mongoose.models.ScanLog || mongoose.model("ScanLog", ScanLogSchema);
export const Feedback = mongoose.models.Feedback || mongoose.model("Feedback", FeedbackSchema);
export const RechargeRequest = mongoose.models.RechargeRequest || mongoose.model("RechargeRequest", RechargeRequestSchema);
export const Settlement = mongoose.models.Settlement || mongoose.model("Settlement", SettlementSchema);
export const AdminSettings = mongoose.models.AdminSettings || mongoose.model("AdminSettings", AdminSettingsSchema);
