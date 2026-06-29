import sgMail from "@sendgrid/mail";

const API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? "tri.nguyen@thewisdomtri.com";
const FROM_NAME = process.env.SENDGRID_FROM_NAME ?? "The Wisdom Tri";

if (API_KEY) sgMail.setApiKey(API_KEY);

export type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

/** Render {{var}} placeholders from a flat data map. */
export function renderTemplate(tpl: string, data: Record<string, string | number>) {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => String(data[key] ?? ""));
}

/**
 * Send a transactional/broadcast email via SendGrid. When no API key is
 * configured (local/dev) it logs instead of throwing, so flows stay testable.
 */
export async function sendEmail({ to, subject, html, text }: SendArgs) {
  if (!API_KEY) {
    console.info(`[email:dev] to=${Array.isArray(to) ? to.join(",") : to} subject="${subject}"`);
    return { mocked: true };
  }
  const recipients = Array.isArray(to) ? to : [to];
  await sgMail.send({
    to: recipients,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject,
    html,
    text: text ?? html.replace(/<[^>]+>/g, " "),
  });
  return { mocked: false };
}
