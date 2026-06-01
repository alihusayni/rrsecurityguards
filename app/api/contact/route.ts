import { Resend } from "resend";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Email service not configured." },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const body = await req.json();
    const { name, email, phone, service, details, pageUrl, confirm_email, timeElapsed } = body;

    // Bot detection: honeypot field confirmed or speed submission (time elapsed < 3 seconds)
    const isBot = confirm_email || (timeElapsed !== undefined && timeElapsed < 3000);
    if (isBot) {
      console.warn(`[Bot Detected] siteName: RR Security Guards, confirm_email: ${confirm_email}, timeElapsed: ${timeElapsed}`);
      return NextResponse.json({ success: true, ok: true });
    }

    // Spam check
    if (isSuspiciousSpam(name, email, undefined, details)) {
      console.warn(`[Spam Detected] siteName: RR Security Guards, name: "${name}", email: "${email}", details: "${details}"`);
      return NextResponse.json({ success: true, ok: true });
    }


    // ---------- Abandoned form handler ----------
    if (body.abandoned === true) {
      const hasData = !!(name || email || phone);
      if (!hasData) {
        return NextResponse.json({ ok: true });
      }

      const identifier = name || email || phone || "Unknown";

      try {
        await resend.emails.send({
          from: "Rapid Response Security Guards <noreply@rrsecurityguards.com>",
          to: "nakibw@gmail.com",
          ...(email ? { replyTo: email } : {}),
          subject: `⚠️ Abandoned Form: ${identifier}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #451a03; padding: 24px; border-radius: 8px 8px 0 0;">
                <h1 style="color: #d97706; margin: 0; font-size: 20px;">
                  ⚠️ Abandoned Quote Form
                </h1>
              </div>
              <div style="background: #fffbeb; padding: 24px; border: 1px solid #f59e0b;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #fde68a; font-weight: bold; width: 140px; color: #333;">Name</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #fde68a; color: #555;">${name || "Not provided"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #fde68a; font-weight: bold; color: #333;">Email</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #fde68a; color: #555;">${
                      email
                        ? `<a href="mailto:${email}" style="color: #d97706;">${email}</a>`
                        : "Not provided"
                    }</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #fde68a; font-weight: bold; color: #333;">Phone</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #fde68a; color: #555;">${
                      phone
                        ? `<a href="tel:${phone}" style="color: #d97706;">${phone}</a>`
                        : "Not provided"
                    }</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #fde68a; font-weight: bold; color: #333;">Service</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #fde68a; color: #555;">${service || "Not specified"}</td>
                  </tr>
                  ${
                    details
                      ? `<tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #fde68a; font-weight: bold; color: #333; vertical-align: top;">Details</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #fde68a; color: #555; white-space: pre-wrap;">${details}</td>
                  </tr>`
                      : ""
                  }
                  ${
                    pageUrl
                      ? `<tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #333;">Page</td>
                    <td style="padding: 10px 0; color: #555;"><a href="${pageUrl}" style="color: #d97706;">${pageUrl}</a></td>
                  </tr>`
                      : ""
                  }
                </table>
              </div>
              <div style="background: #451a03; padding: 16px 24px; border-radius: 0 0 8px 8px;">
                <p style="color: #fbbf24; font-size: 12px; margin: 0;">
                  This visitor started filling out the contact form but left without submitting.
                </p>
              </div>
            </div>
          `,
        });
      } catch (err: any) {
        console.error("Failed to send abandoned email via Resend:", err);
        try {
          await fetch("https://www.despora.ai/api/alerts/form-failure", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              siteName: "RR Security Guards",
              pageUrl: pageUrl || "",
              errorDetails: `Abandoned form Resend error: ${err.message || "Failed to dispatch email via Resend"}`,
              clientEmail: "nakibw@gmail.com",
              leadData: { name, email, phone, service, details, abandoned: true },
            }),
          });
        } catch (backupErr) {
          console.error("Backup outage alert report failed:", backupErr);
        }
      }

      return NextResponse.json({ ok: true });
    }

    // ---------- Regular submission ----------

    // Basic validation
    if (!email || !phone) {
      return NextResponse.json(
        { error: "Email and phone are required." },
        { status: 400 }
      );
    }

    try {
      await resend.emails.send({
        from: "Rapid Response Security Guards <noreply@rrsecurityguards.com>",
        to: "nakibw@gmail.com",
        replyTo: email,
        subject: `New Quote Request — ${service || "General Inquiry"}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a1a2e; padding: 24px; border-radius: 8px 8px 0 0;">
              <h1 style="color: #DA5A31; margin: 0; font-size: 20px;">
                New Security Quote Request
              </h1>
            </div>
            <div style="background: #f9f9f9; padding: 24px; border: 1px solid #e0e0e0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: bold; width: 140px; color: #333;">Name</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #555;">${name || "Not provided"}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #333;">Email</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #555;">
                    <a href="mailto:${email}" style="color: #DA5A31;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #333;">Phone</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #555;">
                    <a href="tel:${phone}" style="color: #DA5A31;">${phone}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #333;">Service</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #555;">${service || "Not specified"}</td>
                </tr>
                ${
                  details
                    ? `<tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #333; vertical-align: top;">Details</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #555; white-space: pre-wrap;">${details}</td>
                </tr>`
                    : ""
                }
                ${
                  pageUrl
                    ? `<tr>
                  <td style="padding: 10px 0; font-weight: bold; color: #333;">Page</td>
                  <td style="padding: 10px 0; color: #555;"><a href="${pageUrl}" style="color: #DA5A31;">${pageUrl}</a></td>
                </tr>`
                    : ""
                }
              </table>
            </div>
            <div style="background: #1a1a2e; padding: 16px 24px; border-radius: 0 0 8px 8px;">
              <p style="color: #888; font-size: 12px; margin: 0;">
                Sent from rrsecurityguards.com contact form
              </p>
            </div>
          </div>
        `,
      });
      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error("Resend error:", error);
      try {
        await fetch("https://www.despora.ai/api/alerts/form-failure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siteName: "RR Security Guards",
            pageUrl: pageUrl || "",
            errorDetails: error.message || "Failed to send email via Resend",
            clientEmail: "nakibw@gmail.com",
            leadData: { name, email, phone, service, details },
          }),
        });
      } catch (backupErr) {
        console.error("Backup outage alert report failed:", backupErr);
      }
      return NextResponse.json(
        { error: "Failed to send email. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Resend error:", error);
    return NextResponse.json(
      { error: "Failed to send email. Please try again." },
      { status: 500 }
    );
  }
}

function isGibberish(val: any): boolean {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!/^[a-zA-Z]{8,30}$/.test(trimmed)) return false;
  const hasUpper = /[A-Z]/.test(trimmed);
  const hasLower = /[a-z]/.test(trimmed);
  if (!hasUpper || !hasLower) return false;
  // Must contain at least one uppercase letter after the first character
  return /[A-Z]/.test(trimmed.slice(1));
}

function hasExcessiveDots(emailVal: any): boolean {
  if (typeof emailVal !== 'string') return false;
  const cleanEmail = emailVal.trim().toLowerCase();
  if (!cleanEmail.endsWith('@gmail.com') && !cleanEmail.endsWith('@googlemail.com')) return false;
  const username = cleanEmail.split('@')[0];
  const dotCount = (username.match(/\./g) || []).length;
  return dotCount >= 4;
}

function isSuspiciousSpam(name: any, email: any, addressOrLocation: any, message: any): boolean {
  let score = 0;
  if (isGibberish(name)) score++;
  if (isGibberish(addressOrLocation)) score++;
  if (isGibberish(message)) score++;
  if (hasExcessiveDots(email)) score++;
  return score >= 2;
}

