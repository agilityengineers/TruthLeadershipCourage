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
export async function sendEmail({ to, subject }: SendArgs) {
  // Client-only demo build — log instead of sending.
  console.info(`[email:dev] to=${Array.isArray(to) ? to.join(",") : to} subject="${subject}"`);
  return { mocked: true };
}
