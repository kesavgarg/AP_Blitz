import "server-only";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export type SendResult = { sent: boolean; error?: string };

function appUrl() {
  return process.env.APP_URL ?? "http://localhost:3000";
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
    await mailer.sendMail({ from, to, subject, html });
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
  <div style="font-family:Outfit,Inter,system-ui,sans-serif;background:#000;padding:32px;color:#f6f3ee;">
    <div style="max-width:560px;margin:0 auto;background:#111;border-radius:20px;padding:32px;border:1px solid #2a2a2a;">
      <p style="letter-spacing:0.2em;font-size:12px;color:#ff914d;margin:0 0 12px;">AP BLITZ</p>
      <h1 style="font-size:22px;margin:0 0 16px;">${title}</h1>
      <div style="font-size:15px;line-height:1.6;color:#d7d3c8;">${body}</div>
    </div>
  </div>
`;

export async function sendApplicationReceived(to: string, name: string, applicationId: string) {
  return send(
    to,
    `We got your AP Blitz application (${applicationId})`,
    wrap(
      "Application received",
      `<p>Hey ${escapeHtml(name)},</p>
       <p>Thanks for applying to AP Blitz. We received your application <strong>${escapeHtml(applicationId)}</strong>. Kesav will review it and email you at this address when there's a decision.</p>
       <p>If you have questions, email kesavgarg@gmail.com or text +1 (404) 212-9019.</p>
       <p>— AP Blitz</p>`,
    ),
  );
}

export async function sendAdminApplicationNotice(to: string, applicant: string, applicationId: string) {
  return send(
    to,
    `New AP Blitz application: ${applicant}`,
    wrap(
      "New application to review",
      `<p>${escapeHtml(applicant)} just applied (${escapeHtml(applicationId)}).</p>
       <p><a href="${appUrl()}/admin/applications" style="color:#ff914d;">Open the review dashboard</a></p>`,
    ),
  );
}

export async function sendAcceptance(
  to: string,
  name: string,
  role: string,
  tempPassword: string,
) {
  const loginUrl = `${appUrl()}/login`;
  return send(
    to,
    "You're in — welcome to AP Blitz",
    wrap(
      "Congratulations — you're accepted",
      `<p>Hey ${escapeHtml(name)},</p>
       <p>You got in. Welcome to AP Blitz as a <strong>${escapeHtml(role)}</strong>.</p>
       <p>Log in here with the temporary password below. After you sign in you'll land in the team workspace (calendar, messages, tasks, your role page).</p>
       <p><a href="${loginUrl}" style="display:inline-block;background:#ff914d;color:#000;padding:12px 18px;border-radius:999px;font-weight:700;text-decoration:none;">Log in to AP Blitz</a></p>
       <p><strong>Email:</strong> ${escapeHtml(to)}<br/>
       <strong>Temporary password:</strong> ${escapeHtml(tempPassword)}</p>
       <p>You can change your password later from Profile.</p>
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
  return send(
    to,
    `New AP Blitz assignment: ${title}`,
    wrap(
      "You've got an assignment",
      `<p>Hey ${escapeHtml(name)},</p>
       <p><strong>${escapeHtml(title)}</strong> was assigned to you.</p>
       <p><a href="${appUrl()}${href}" style="color:#ff914d;">Open it in the workspace</a></p>`,
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
