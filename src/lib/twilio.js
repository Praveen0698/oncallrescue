import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

let client = null;

function getClient() {
  if (!client && accountSid && authToken) {
    client = twilio(accountSid, authToken);
  }
  return client;
}

export function isTwilioConfigured() {
  return !!(accountSid && authToken && twilioNumber);
}

// ─── Make a masked call ──────────────────────────────────────────
// Calls the contact's real number from your Twilio virtual number
// Neither party sees each other's real number
export async function makeCall(toPhone, { ownerName, qrId, helperPhone, location }) {
  const tw = getClient();
  if (!tw) {
    console.warn("[Twilio] Not configured — skipping call");
    return { success: false, reason: "not_configured" };
  }

  let formattedTo = toPhone.replace(/\s/g, "");
  if (!formattedTo.startsWith("+")) {
    if (formattedTo.startsWith("0")) formattedTo = formattedTo.substring(1);
    formattedTo = "+91" + formattedTo;
  }

  const helperInfo = helperPhone ? `मौके पर मौजूद व्यक्ति का नंबर है ${helperPhone.split("").join(" ")}।` : "";
  const helperInfoEn = helperPhone ? `The person at the scene can be reached at ${helperPhone.split("").join(" ")}.` : "";
  const locationInfo = location ? `लोकेशन है ${location}।` : "";
  const locationInfoEn = location ? `Location is ${location}.` : "";

  try {
    const call = await tw.calls.create({
      to: formattedTo,
      from: twilioNumber,
      twiml: `<Response>
        <Say voice="Polly.Aditi" language="hi-IN">
          यह OnCallRescue इमरजेंसी अलर्ट है।
          ${ownerName || "एक व्यक्ति"} की गाड़ी पर लगे QR स्टिकर को स्कैन किया गया है।
          ${locationInfo}
          ${helperInfo}
          कृपया तुरंत संपर्क करें।
          अगर यह इमरजेंसी है, तो कृपया 112 पर कॉल करें।
        </Say>
        <Pause length="1"/>
        <Say voice="Polly.Aditi" language="en-IN">
          This is a OnCallRescue emergency alert.
          The QR sticker on ${ownerName || "a person"}'s vehicle has been scanned.
          ${locationInfoEn}
          ${helperInfoEn}
          Please contact them immediately.
          If this is an emergency, please call 112.
        </Say>
        <Pause length="2"/>
        <Say voice="Polly.Aditi" language="en-IN">Repeating the message.</Say>
        <Pause length="1"/>
        <Say voice="Polly.Aditi" language="en-IN">
          OnCallRescue emergency alert for ${ownerName || "a person"}.
          ${locationInfoEn}
          ${helperInfoEn}
          Please respond immediately.
        </Say>
      </Response>`,
      statusCallback: process.env.NEXT_PUBLIC_APP_URL + "/api/call/status",
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST",
      timeout: 30, // Ring for 30 seconds before giving up
    });

    console.log("[Twilio] Call initiated:", call.sid, "to:", formattedTo);
    return { success: true, callSid: call.sid };
  } catch (err) {
    console.error("[Twilio] Call failed:", err.message);
    return { success: false, reason: err.message };
  }
}

// ─── Send SMS ────────────────────────────────────────────────────
export async function sendSMS(toPhone, message) {
  const tw = getClient();
  if (!tw) return { success: false, reason: "not_configured" };

  let formattedTo = toPhone.replace(/\s/g, "");
  if (!formattedTo.startsWith("+")) {
    if (formattedTo.startsWith("0")) formattedTo = formattedTo.substring(1);
    formattedTo = "+91" + formattedTo;
  }

  try {
    const msg = await tw.messages.create({
      to: formattedTo,
      from: twilioNumber,
      body: message,
    });
    console.log("[Twilio] SMS sent:", msg.sid);
    return { success: true, messageSid: msg.sid };
  } catch (err) {
    console.error("[Twilio] SMS failed:", err.message);
    return { success: false, reason: err.message };
  }
}
