import { redirect } from "next/navigation";

/** "This Week" lives on the Home dashboard's During phase. */
export default function ThisWeekPage() {
  redirect("/portal?phase=during");
}
