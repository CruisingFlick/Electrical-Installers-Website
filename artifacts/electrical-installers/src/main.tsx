import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter } from "@workspace/api-client-react";

setAuthTokenGetter(() => localStorage.getItem("admin_token"));

window.addEventListener("unhandledrejection", (event) => {
  if ((event.reason as Error)?.name === "AbortError") {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
