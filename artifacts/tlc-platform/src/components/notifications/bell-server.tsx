import { useListNotifications } from "@workspace/api-client-react";
import { NotificationBell } from "./bell";

/** Loads recent notifications for the current user and renders the bell. */
export function NotificationBellServer({ userId: _userId }: { userId?: string }) {
  const { data } = useListNotifications();
  return <NotificationBell notifications={data ?? []} />;
}
