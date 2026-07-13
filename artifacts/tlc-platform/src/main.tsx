import { createRoot } from "react-dom/client";
import { setAuthTokenGetter, setUnauthorizedHandler } from "@workspace/api-client-react";
import App from "./App";
import { clearSession, getToken } from "@/lib/session";
import "./index.css";

// Attach the persisted session token as a bearer header on every API request.
setAuthTokenGetter(() => getToken());

// A 401 means the persisted token is stale (expired session, reset database…).
// Without this the app keeps rendering a signed-in UI from localStorage while
// every request fails, so nothing loads and nothing saves. Clear the dead
// session and return to the login screen. /session/login's own 401 (wrong
// password) is the login form's error to show, not a stale session.
setUnauthorizedHandler((url) => {
  if (url.includes("/session/login")) return;
  if (!getToken()) return;
  clearSession();
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  window.location.assign(`${base}/login?expired=1`);
});

createRoot(document.getElementById("root")!).render(<App />);
