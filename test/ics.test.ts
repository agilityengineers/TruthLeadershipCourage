import { test } from "node:test";
import assert from "node:assert/strict";
import { buildICS, googleCalendarUrl, type CalEvent } from "../src/lib/ics";

const ev: CalEvent = {
  uid: "evt-1@thewisdomtri.com",
  title: "Week 1, Session",
  description: "TLC live session",
  location: "Virtual",
  start: new Date("2026-08-13T16:00:00Z"),
  end: new Date("2026-08-13T18:00:00Z"),
};

test("buildICS wraps events in a VCALENDAR/VEVENT envelope", () => {
  const ics = buildICS([ev], "TLC Program");
  assert.match(ics, /^BEGIN:VCALENDAR/);
  assert.match(ics, /END:VCALENDAR$/);
  assert.match(ics, /BEGIN:VEVENT[\s\S]*END:VEVENT/);
  assert.match(ics, /UID:evt-1@thewisdomtri\.com/);
  assert.match(ics, /DTSTART:20260813T160000Z/);
  assert.match(ics, /DTEND:20260813T180000Z/);
  assert.match(ics, /\r\n/); // CRLF line endings per RFC 5545
});

test("buildICS escapes commas in text fields", () => {
  const ics = buildICS([ev]);
  assert.match(ics, /SUMMARY:Week 1\\, Session/);
});

test("googleCalendarUrl encodes the event into a template link", () => {
  const url = googleCalendarUrl(ev);
  assert.match(url, /^https:\/\/calendar\.google\.com\/calendar\/render\?/);
  assert.match(url, /dates=20260813T160000Z%2F20260813T180000Z/);
  assert.match(url, /action=TEMPLATE/);
});
