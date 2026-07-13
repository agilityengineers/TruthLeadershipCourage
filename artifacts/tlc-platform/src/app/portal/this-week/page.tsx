import { Redirect } from "wouter";

/** "This Week" is the home screen itself — the Now card always holds it. */
export default function ThisWeekPage() {
  return <Redirect to="/portal" />;
}
