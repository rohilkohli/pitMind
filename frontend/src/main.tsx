import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

import "./index.css";
import "./styles/mobile.css";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// Suppress expected Firebase CORS/COOP errors in local development
// These are harmless popup auth security warnings that don't affect functionality
const originalError = console.error;
console.error = (...args: unknown[]) => {
  const errorStr = String(args[0]);
  // Filter out Firebase popup/COOP security warnings
  if (
    errorStr.includes("Cross-Origin-Opener-Policy") ||
    errorStr.includes("popup-closed-by-user") ||
    errorStr.includes("ERR_BLOCKED_BY_RESPONSE")
  ) {
    return;
  }
  originalError(...args);
};

const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
if (gaId) {
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", gaId);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
