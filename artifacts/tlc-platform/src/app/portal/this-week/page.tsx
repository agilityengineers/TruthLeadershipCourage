import { Redirect } from "wouter";

/** "This Week" lives on the Home dashboard's During phase. */
export default function ThisWeekPage() {
  return <Redirect to="/portal?phase=during" />;
}
