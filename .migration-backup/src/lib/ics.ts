/** Minimal RFC-5545 .ics generation for sessions and coaching slots. */

function fmt(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export type CalEvent = {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
};

export function buildICS(events: CalEvent[], calName = "TLC Program"): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Wisdom Tri//TLC Platform//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${calName}`,
  ];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(e.start)}`,
      `DTEND:${fmt(e.end)}`,
      `SUMMARY:${escapeText(e.title)}`,
      e.description ? `DESCRIPTION:${escapeText(e.description)}` : "",
      e.location ? `LOCATION:${escapeText(e.location)}` : "",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.filter(Boolean).join("\r\n");
}

function escapeText(s: string) {
  return s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

/** Google Calendar "add event" URL for a single event. */
export function googleCalendarUrl(e: CalEvent): string {
  const f = (d: Date) => fmt(d);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${f(e.start)}/${f(e.end)}`,
    details: e.description ?? "",
    location: e.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
