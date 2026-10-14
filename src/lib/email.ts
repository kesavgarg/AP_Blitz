import "server-only";
import { headers } from "next/headers";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export type SendResult = { sent: boolean; error?: string };

function stripSlash(url: string) {
  return url.replace(/\/$/, "");
}

function isLocalhost(url: string) {
  return /localhost|127\.0\.0\.1/i.test(url);
}

export async function appUrl() {
  const fromEnv = process.env.APP_URL?.trim();
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const vercel = process.env.VERCEL_URL?.trim();

  let fromRequest = "";
  try {
    const h = await headers();
    const host = (h.get("x-forwarded-host") || h.get("host") || "").split(",")[0].trim();
    const proto = h.get("x-forwarded-proto") || (isLocalhost(host) ? "http" : "https");
    if (host) fromRequest = `${proto}://${host}`;
  } catch {
    // headers() is unavailable outside a request
  }

  if (fromEnv && !isLocalhost(fromEnv)) return stripSlash(fromEnv);
  if (fromRequest && !isLocalhost(fromRequest)) return stripSlash(fromRequest);
  if (vercelProd) return stripSlash(`https://${vercelProd}`);
  if (fromEnv) return stripSlash(fromEnv);
  if (fromRequest) return stripSlash(fromRequest);
  if (vercel) return stripSlash(`https://${vercel}`);
  return "http://localhost:3000";
}

async function mailConfig() {
  const settings = await prisma.orgSettings.findUnique({ where: { id: "org" } });
  const host = settings?.smtpHost || process.env.SMTP_HOST || "";
  const port = Number(settings?.smtpPort || process.env.SMTP_PORT || 587);
  const user = settings?.smtpUser || process.env.SMTP_USER || "";
  const pass = settings?.smtpPass || process.env.SMTP_PASS || "";
  const from =
    process.env.EMAIL_FROM ||
    (user ? `AP Blitz <${user}>` : "AP Blitz <hello@apblitz.org>");
  return { host, port, user, pass, from };
}

async function send(to: string, subject: string, html: string): Promise<SendResult> {
  const { host, port, user, pass, from } = await mailConfig();
  if (!host || !user || !pass) {
    const error = "Email is not configured. Add SMTP in Admin → Settings so messages actually reach inboxes.";
    console.log("\n[email:not-sent]", { to, subject, error });
    await prisma.outgoingEmail.create({
      data: { to, subject, status: "not_configured", error },
    }).catch((err) => console.error("[email:log-failed]", err));
    return { sent: false, error };
  }

  try {
    const mailer = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    const text =
      html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    await mailer.sendMail({ from, to, subject, html, text });
    await prisma.outgoingEmail.create({
      data: { to, subject, status: "sent" },
    }).catch((err) => console.error("[email:log-failed]", err));
    return { sent: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Email failed to send";
    console.error("[email:failed]", { to, subject, error });
    await prisma.outgoingEmail.create({
      data: { to, subject, status: "failed", error },
    }).catch((err) => console.error("[email:log-failed]", err));
    return { sent: false, error };
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const wrap = (title: string, body: string) => `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#000;padding:32px;color:#f6f3ee;">
    <div style="max-width:560px;margin:0 auto;background:#111;border-radius:20px;padding:32px;border:1px solid #2a2a2a;">
      <p style="letter-spacing:0.2em;font-size:12px;color:#ff914d;margin:0 0 12px;">AP BLITZ</p>
      <h1 style="font-size:22px;margin:0 0 16px;">${title}</h1>
      <div style="font-size:15px;line-height:1.6;color:#d7d3c8;">${body}</div>
    </div>
  </div>
`;

function ctaButton(href: string, label: string) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;">
      <tr>
        <td align="center" bgcolor="#ff914d" style="border-radius:999px;">
          <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 22px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:#000000;text-decoration:none;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>
    <p style="font-size:13px;line-height:1.5;word-break:break-all;color:#9a958a;">If that button does not open from Gmail, copy this link into Safari or Chrome:<br /><a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" style="color:#ff914d;">${escapeHtml(href)}</a></p>
  `;
}

export async function sendApplicationReceived(to: string, name: string, applicationId: string) {
  return send(
    to,
    `We got your AP Blitz application (${applicationId})`,
    wrap(
      "Application received",
      `<p>Hey ${escapeHtml(name)},</p>
       <p>Thanks for applying to AP Blitz. We received your application <strong>${escapeHtml(applicationId)}</strong>. Kesav will review it and email you at this address when there's a decision.</p>
       <p>If you have questions, email kesavgarg@gmail.com or text +1 (404) 213-9019.</p>
       <p>— AP Blitz</p>`,
    ),
  );
}

export async function sendAdminApplicationNotice(to: string, applicant: string, applicationId: string) {
  const dashboardUrl = `${await appUrl()}/admin/applications`;
  return send(
    to,
    `New AP Blitz application: ${applicant}`,
    wrap(
      "New application to review",
      `<p>${escapeHtml(applicant)} just applied (${escapeHtml(applicationId)}).</p>
       ${ctaButton(dashboardUrl, "Open the review dashboard")}`,
    ),
  );
}

export async function sendAcceptance(
  to: string,
  name: string,
  role: string,
  tempPassword: string,
  urls: { setupUrl: string; loginUrl: string },
  note = "",
) {
  return send(
    to,
    "You're in — welcome to AP Blitz",
    wrap(
      "Congratulations — you're accepted",
      `<p>Hey ${escapeHtml(name)},</p>
       <p>You got in. Welcome to AP Blitz as a <strong>${escapeHtml(role)}</strong>.</p>
       ${note}
       <p>Tap the button below to open AP Blitz and choose your password. Then log in. If Gmail preview does not load the site, copy the link under the button into Safari or Chrome.</p>
       ${ctaButton(urls.setupUrl, "Open AP Blitz")}
       <p>Or sign in at <a href="${escapeHtml(urls.loginUrl)}" target="_blank" rel="noopener noreferrer" style="color:#ff914d;">${escapeHtml(urls.loginUrl)}</a> with:</p>
       <p><strong>Email:</strong> ${escapeHtml(to)}<br/>
       <strong>Temporary password:</strong> ${escapeHtml(tempPassword)}</p>
       <p>— Kesav, AP Blitz</p>`,
    ),
  );
}

export async function sendRejection(to: string, name: string, message?: string) {
  const extra = message ? `<p>${escapeHtml(message)}</p>` : "";
  return send(
    to,
    "Your AP Blitz application",
    wrap(
      "Update on your application",
      `<p>Hey ${escapeHtml(name)},</p>
       <p>Thank you for applying to AP Blitz. We're not able to offer you a spot on the team right now.</p>
       ${extra}
       <p>You're always welcome to apply again in a future round.</p>
       <p>— Kesav, AP Blitz</p>`,
    ),
  );
}

export async function sendAssignment(to: string, name: string, title: string, href: string) {
  const openUrl = `${await appUrl()}${href}`;
  return send(
    to,
    `New AP Blitz assignment: ${title}`,
    wrap(
      "You've got an assignment",
      `<p>Hey ${escapeHtml(name)},</p>
       <p><strong>${escapeHtml(title)}</strong> was assigned to you.</p>
       ${ctaButton(openUrl, "Open it in the workspace")}`,
    ),
  );
}

export async function sendMeetingInvite(to: string, name: string, title: string, when: string, link: string) {
  return send(
    to,
    `AP Blitz meeting: ${title}`,
    wrap(
      "You're invited",
      `<p>Hey ${escapeHtml(name)},</p>
       <p><strong>${escapeHtml(title)}</strong> is on the calendar for ${escapeHtml(when)}.</p>
       <p><a href="${link}" style="color:#ff914d;">Meeting link</a></p>`,
    ),
  );
}

export async function sendDeadlineReminder(to: string, name: string, title: string, when: string) {
  return send(
    to,
    `Deadline coming up: ${title}`,
    wrap(
      "Deadline reminder",
      `<p>Hey ${escapeHtml(name)},</p>
       <p><strong>${escapeHtml(title)}</strong> is due ${escapeHtml(when)}. Jump into the workspace and wrap it if you can.</p>`,
    ),
  );
}

export async function sendWelcomeBlitzer(to: string, name: string) {
  const library = `${await appUrl()}/videos`;
  return send(
    to,
    "You're a Blitzer",
    wrap(
      "Welcome to AP Blitz",
      `<p>Hey ${escapeHtml(name)},</p>
       <p>Your Blitzer account is ready. Watch AP videos, save the ones you want to come back to, and request topics you want explained.</p>
       <p>This is a study account. It is not a team application, and nobody has to approve it.</p>
       ${ctaButton(library, "Watch videos")}`,
    ),
  );
}

export async function sendVerificationEmail(to: string, name: string, link: string) {
  return send(
    to,
    "Confirm your AP Blitz email",
    wrap(
      "Confirm your email",
      `<p>Hey ${escapeHtml(name)},</p>
       <p>Tap below to confirm this is your email. You can keep using AP Blitz either way.</p>
       ${ctaButton(link, "Confirm email")}`,
    ),
  );
}

export async function sendPasswordReset(to: string, name: string, link: string) {
  return send(
    to,
    "Reset your AP Blitz password",
    wrap(
      "Reset your password",
      `<p>Hey ${escapeHtml(name)},</p>
       <p>This link expires in one hour. If you didn't ask for it, you can ignore this email.</p>
       ${ctaButton(link, "Choose a new password")}`,
    ),
  );
}

export async function sendBlitzerPromoted(to: string, name: string, role: string, loginUrl: string) {
  return send(
    to,
    "You're on the AP Blitz team",
    wrap(
      "Your application was accepted",
      `<p>Hey ${escapeHtml(name)},</p>
       <p>You're in as a <strong>${escapeHtml(role)}</strong>. Your Blitzer password still works — sign in and you'll land in the team workspace.</p>
       <p>Being a Blitzer did not put you on the team. This acceptance did.</p>
       ${ctaButton(loginUrl, "Log in")}`,
    ),
  );
}

export async function sendTestEmail(to: string) {
  return send(
    to,
    "AP Blitz test email",
    wrap(
      "Email is working",
      `<p>If you can read this, AP Blitz can send application emails.</p>`,
    ),
  );
}

export async function sendNewDeviceAlert(
  to: string,
  details: { account: string; role: string; ip: string; userAgent: string },
) {
  return send(
    to,
    "Admin sign-in from a new device",
    wrap(
      "New device sign-in",
      `<p>${escapeHtml(details.account)} (${escapeHtml(details.role)}) just signed in from a device we have not seen on that account.</p>
       <p>IP: ${escapeHtml(details.ip)}<br>Browser: ${escapeHtml(details.userAgent)}</p>
       <p>If this was you, no action is needed. If it was not, reset that password and end the session in Admin → Sessions.</p>`,
    ),
  );
}
