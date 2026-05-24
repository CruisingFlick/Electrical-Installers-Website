import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

window.addEventListener("unhandledrejection", (event) => {
  if ((event.reason as Error)?.name === "AbortError") {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
