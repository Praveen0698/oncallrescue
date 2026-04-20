import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "oncallrescue-secret-key-change-in-production";

// ─── Password Hashing ────────────────────────────────────────
export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

// ─── JWT Tokens ──────────────────────────────────────────────
export function generateToken(payload, expiresIn = "7d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// ─── QR ID Generator ────────────────────────────────────────
export function generateQrId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "LL-";
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// ─── Validation Helpers ─────────────────────────────────────
export function validatePhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

export function validateAadhar(aadhar) {
  return /^\d{12}$/.test(aadhar);
}

export function validatePan(pan) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan);
}

export function validateVehicleNumber(vn) {
  return /^[A-Z]{2}\d{2}[A-Z]{0,2}\d{4}$/.test(vn.replace(/\s/g, "").toUpperCase());
}

// ─── Mask Phone Number ──────────────────────────────────────
export function maskPhone(phone) {
  if (!phone || phone.length < 10) return "****";
  return `${phone.slice(0, 2)}******${phone.slice(-2)}`;
}

// ─── Format Currency ────────────────────────────────────────
export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── API Response Helpers ───────────────────────────────────
export function apiSuccess(data, message = "Success") {
  return Response.json({ success: true, message, data }, { status: 200 });
}

export function apiError(message = "Something went wrong", status = 400) {
  return Response.json({ success: false, message }, { status });
}

export function apiCreated(data, message = "Created successfully") {
  return Response.json({ success: true, message, data }, { status: 201 });
}
