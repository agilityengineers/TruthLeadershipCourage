import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import App from "./App";
import { getToken } from "@/lib/session";
import "./index.css";

// Attach the persisted session token as a bearer header on every API request.
setAuthTokenGetter(() => getToken());

createRoot(document.getElementById("root")!).render(<App />);
