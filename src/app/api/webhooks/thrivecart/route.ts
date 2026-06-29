import { db } from "@/lib/db";
import { fulfillEnrollment } from "@/server/fulfillment";

export const dynamic = "force-dynamic";

/**
 * ThriveCart webhook → the SAME fulfillment path as Stripe, so the rest of the
 * system is processor-agnostic. ThriveCart posts form-encoded data; we match an
 * enrollment by passthrough id or by the buyer's email.
 */
export async function POST(req: Request) {
  const secret = process.env.THRIVECART_WEBHOOK_SECRET;
  const contentType = req.headers.get("content-type") ?? "";

  let data: Record<string, string> = {};
  if (contentType.includes("application/json")) {
    data = await req.json();
  } else {
    const form = await req.formData();
    form.forEach((v, k) => (data[k] = String(v)));
  }

  // Optional shared-secret check.
  if (secret && data["thrivecart_secret"] && data["thrivecart_secret"] !== secret) {
    return new Response("Invalid secret", { status: 401 });
  }

  const event = data["event"] ?? data["order_action"];
  if (event && !["order.success", "order.subscription_payment", "purchase"].includes(event)) {
    return Response.json({ ignored: event });
  }

  // Resolve the enrollment: explicit passthrough id, else by email.
  const enrollmentId = data["passthrough"] || data["custom"] || data["enrollmentId"];
  const email = (data["customer[email]"] || data["email"])?.toLowerCase();

  try {
    let enr = enrollmentId
      ? await db.enrollment.findUnique({ where: { id: enrollmentId } })
      : null;
    if (!enr && email) {
      const user = await db.user.findUnique({ where: { email } });
      if (user) {
        enr = await db.enrollment.findFirst({
          where: { userId: user.id, status: "PENDING" },
          orderBy: { createdAt: "desc" },
        });
      }
    }
    if (!enr) return new Response("Enrollment not found", { status: 404 });

    await fulfillEnrollment({
      enrollmentId: enr.id,
      externalId: data["order_id"] || data["invoice_id"],
      processor: "THRIVECART",
    });
  } catch (err) {
    return new Response(`Handler error: ${(err as Error).message}`, { status: 500 });
  }

  return Response.json({ received: true });
}
