import nodemailer from "nodemailer";

// ─── Transporter (singleton) ─────────────────────────────────────
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass || user === "your-email@gmail.com") {
    console.warn("[Email] SMTP not configured — emails will be skipped");
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

// ─── Core send function ──────────────────────────────────────────
async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[Email Skipped] To: ${to} | Subject: ${subject}`);
    return { success: false, reason: "SMTP not configured" };
  }

  try {
    const info = await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text,
    });
    console.log(`[Email Sent] To: ${to} | ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Failed] To: ${to} | ${error.message}`);
    return { success: false, reason: error.message };
  }
}

// ─── HTML wrapper ────────────────────────────────────────────────
const C = "#C8372D";

function wrap(content) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F6F5F0;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:520px;margin:0 auto;padding:24px 16px;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;background:${C};color:#fff;padding:8px 16px;border-radius:12px;font-weight:800;font-size:18px;">OnCallRescue<span style="font-size:22px;">.</span></div>
  </div>
  <div style="background:#fff;border-radius:14px;padding:28px 24px;border:1px solid #E2E0D8;">${content}</div>
  <div style="text-align:center;margin-top:20px;color:#8A8A7F;font-size:11px;">
    <p>OnCallRescue — Emergency Medical ID System</p>
    <p style="margin-top:4px;">Your data is encrypted and privacy-protected.</p>
  </div>
</div></body></html>`;
}

// ═════════════════════════════════════════════════════════════════
// REGISTRATION LINK EMAIL
// ═════════════════════════════════════════════════════════════════
export async function sendRegistrationEmail({ to, customerPhone, qrId, registrationUrl }) {
  const html = wrap(`
    <h2 style="margin:0 0 8px;color:#1A1A18;font-size:20px;font-weight:800;">Welcome to OnCallRescue! 🛡️</h2>
    <p style="color:#5A5A52;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Your emergency QR sticker has been activated. Complete your registration to link your emergency contacts and medical information to your vehicle.
    </p>
    <div style="background:#FAFAF7;border:1px solid #E2E0D8;border-radius:10px;padding:14px;margin-bottom:20px;">
      <table style="width:100%;font-size:13px;color:#5A5A52;">
        <tr><td style="padding:4px 0;font-weight:600;color:#1A1A18;">Sticker ID</td><td style="text-align:right;font-family:monospace;color:${C};font-weight:700;">${qrId}</td></tr>
        <tr><td style="padding:4px 0;font-weight:600;color:#1A1A18;">Phone</td><td style="text-align:right;">+91 ${customerPhone}</td></tr>
      </table>
    </div>
    <a href="${registrationUrl}" style="display:block;text-align:center;background:${C};color:#fff;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;margin-bottom:16px;">
      Complete Registration →
    </a>
    <p style="color:#8A8A7F;font-size:12px;line-height:1.5;margin:0;">
      After registration, paste the QR sticker on your vehicle. In an emergency, anyone can scan it to contact your family — without seeing your personal details.
    </p>
  `);

  return sendEmail({
    to,
    subject: `OnCallRescue — Complete Your Emergency Profile (${qrId})`,
    html,
    text: `Welcome to OnCallRescue!\n\nYour sticker ${qrId} is activated.\nComplete registration: ${registrationUrl}\n\nPaste the QR sticker on your vehicle. In an emergency, anyone can scan it to contact your family.`,
  });
}

// ═════════════════════════════════════════════════════════════════
// EMERGENCY ALERT EMAIL (sent to ALL family members)
// ═════════════════════════════════════════════════════════════════
export async function sendEmergencyAlertEmail({ to, contactName, ownerName, qrId, location, helperPhone }) {
  const locText = location?.address || (location?.lat ? `${location.lat}, ${location.lng}` : "Location unavailable");
  const mapsUrl = location?.mapsLink || (location?.lat ? `https://maps.google.com/?q=${location.lat},${location.lng}` : "");
  const time = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  const html = wrap(`
    <div style="background:${C};color:#fff;padding:16px;border-radius:10px;text-align:center;margin-bottom:20px;">
      <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;opacity:0.7;">Emergency Alert</p>
      <p style="margin:6px 0 0;font-size:22px;font-weight:800;">🚨 Emergency Triggered</p>
    </div>
    <p style="color:#1A1A18;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Hi <strong>${contactName}</strong>,<br><br>
      Someone has scanned the emergency QR sticker linked to <strong>${ownerName}</strong>'s vehicle. This may indicate an emergency.
    </p>
    <div style="background:#FEF2F2;border:1px solid #FCCDCC;border-radius:10px;padding:14px;margin-bottom:20px;">
      <table style="width:100%;font-size:13px;color:#5A5A52;">
        <tr><td style="padding:4px 0;font-weight:600;">Sticker ID</td><td style="text-align:right;font-family:monospace;color:${C};font-weight:700;">${qrId}</td></tr>
        <tr><td style="padding:4px 0;font-weight:600;">Time</td><td style="text-align:right;">${time}</td></tr>
        <tr><td style="padding:4px 0;font-weight:600;">Location</td><td style="text-align:right;">${locText}</td></tr>
        ${helperPhone ? `<tr><td style="padding:4px 0;font-weight:600;">Reporter's Phone</td><td style="text-align:right;font-family:monospace;font-weight:700;color:#1A1A18;">${helperPhone}</td></tr>` : ""}
      </table>
    </div>
    ${mapsUrl ? `<a href="${mapsUrl}" style="display:block;text-align:center;background:#1A1A18;color:#fff;padding:12px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;margin-bottom:12px;">📍 View on Google Maps</a>` : ""}
    ${helperPhone ? `<p style="color:#1A1A18;font-size:13px;font-weight:600;margin:0 0 12px;">📞 Call the person at the scene: <a href="tel:${helperPhone}" style="color:${C};text-decoration:none;font-family:monospace;">${helperPhone}</a></p>` : ""}
    <p style="color:#5A5A52;font-size:13px;line-height:1.6;margin:0;">
      Please try to contact <strong>${ownerName}</strong> immediately. If unreachable, call emergency services at <strong>112</strong>.
    </p>
  `);

  return sendEmail({
    to,
    subject: `🚨 EMERGENCY — ${ownerName}'s OnCallRescue Alert`,
    html,
    text: `EMERGENCY ALERT\n\nSomeone scanned ${ownerName}'s OnCallRescue sticker (${qrId}).\nTime: ${time}\nLocation: ${locText}\n\nPlease contact ${ownerName} immediately. Emergency: 112`,
  });
}

// ═════════════════════════════════════════════════════════════════
// ADMIN EMERGENCY EMAIL (full unmasked details for manual outreach)
// ═════════════════════════════════════════════════════════════════
export async function sendAdminEmergencyEmail({ to, ownerName, ownerPhone, vehicleNumber, qrId, helperPhone, contacts, location }) {
  const locText = location?.address || "Location unavailable";
  const mapsUrl = location?.mapsLink || (location?.lat ? `https://maps.google.com/?q=${location.lat},${location.lng}` : "");
  const time = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  const contactRows = (contacts || []).map((c, i) => {
    const status = i === 0
      ? '<span style="color:#2D8A56;font-weight:700;">✅ Twilio call + SMS sent</span>'
      : '<span style="color:#C68B19;font-weight:700;">⚠️ Needs manual call by admin</span>';
    return `
      <tr style="border-bottom:1px solid #E2E0D8;">
        <td style="padding:10px 8px;font-size:13px;font-weight:600;color:#1A1A18;">${i === 0 ? "Primary" : "Secondary"}</td>
        <td style="padding:10px 8px;font-size:13px;color:#1A1A18;">${c.name} (${c.relation})</td>
        <td style="padding:10px 8px;font-size:13px;font-family:monospace;color:${C};font-weight:700;">${c.phone}</td>
        <td style="padding:10px 8px;font-size:12px;">${c.email || "—"}</td>
        <td style="padding:10px 8px;font-size:12px;">${status}</td>
      </tr>`;
  }).join("");

  const html = wrap(`
    <div style="background:#1A1A18;color:#fff;padding:16px;border-radius:10px;text-align:center;margin-bottom:20px;">
      <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;opacity:0.7;">Admin Alert</p>
      <p style="margin:6px 0 0;font-size:22px;font-weight:800;">🚨 Emergency Triggered</p>
    </div>
    <div style="background:#FEF2F2;border:1px solid #FCCDCC;border-radius:10px;padding:14px;margin-bottom:16px;">
      <table style="width:100%;font-size:13px;color:#5A5A52;">
        <tr><td style="padding:4px 0;font-weight:600;">Owner</td><td style="text-align:right;font-weight:700;color:#1A1A18;">${ownerName}</td></tr>
        <tr><td style="padding:4px 0;font-weight:600;">Owner Phone</td><td style="text-align:right;font-family:monospace;color:${C};font-weight:700;">${ownerPhone}</td></tr>
        <tr><td style="padding:4px 0;font-weight:600;">Vehicle</td><td style="text-align:right;">${vehicleNumber || "—"}</td></tr>
        <tr><td style="padding:4px 0;font-weight:600;">Sticker ID</td><td style="text-align:right;font-family:monospace;color:${C};">${qrId}</td></tr>
        <tr><td style="padding:4px 0;font-weight:600;">Time</td><td style="text-align:right;">${time}</td></tr>
        <tr><td style="padding:4px 0;font-weight:600;">Location</td><td style="text-align:right;">${locText}</td></tr>
        <tr><td style="padding:4px 0;font-weight:600;">Reporter Phone</td><td style="text-align:right;font-family:monospace;font-weight:700;color:#1A1A18;">${helperPhone}</td></tr>
      </table>
    </div>
    ${mapsUrl ? `<a href="${mapsUrl}" style="display:block;text-align:center;background:#1A1A18;color:#fff;padding:12px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;margin-bottom:16px;">📍 View on Google Maps</a>` : ""}
    <p style="font-size:13px;font-weight:700;color:#1A1A18;margin:0 0 8px;">Emergency Contacts — FULL DETAILS:</p>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #E2E0D8;border-radius:8px;">
        <tr style="background:#F6F5F0;">
          <th style="padding:8px;text-align:left;font-size:11px;text-transform:uppercase;color:#8A8A7F;">Type</th>
          <th style="padding:8px;text-align:left;font-size:11px;text-transform:uppercase;color:#8A8A7F;">Name</th>
          <th style="padding:8px;text-align:left;font-size:11px;text-transform:uppercase;color:#8A8A7F;">Phone</th>
          <th style="padding:8px;text-align:left;font-size:11px;text-transform:uppercase;color:#8A8A7F;">Email</th>
          <th style="padding:8px;text-align:left;font-size:11px;text-transform:uppercase;color:#8A8A7F;">Status</th>
        </tr>
        ${contactRows}
      </table>
    </div>
    <div style="margin-top:16px;padding:12px;background:#FFF8E8;border:1px solid #FFEFC5;border-radius:8px;">
      <p style="margin:0;font-size:13px;color:#C68B19;"><strong>Action needed:</strong> Please call the secondary contact manually. You can also call the reporter at <strong>${helperPhone}</strong> for more details.</p>
    </div>
  `);

  return sendEmail({
    to,
    subject: `🚨 ADMIN — Emergency for ${ownerName} (${qrId})`,
    html,
    text: `EMERGENCY TRIGGERED\n\nOwner: ${ownerName} (${ownerPhone})\nVehicle: ${vehicleNumber || "—"}\nSticker: ${qrId}\nTime: ${time}\nLocation: ${locText}\nReporter: ${helperPhone}\n\nPrimary: ${contacts[0]?.name} — ${contacts[0]?.phone} (Twilio called)\nSecondary: ${contacts[1]?.name} — ${contacts[1]?.phone} (NEEDS MANUAL CALL)\n\nMaps: ${mapsUrl}`,
  });
}

export default sendEmail;
