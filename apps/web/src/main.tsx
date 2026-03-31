/**
 * Web app entry point.
 *
 * Mounts the marketing/landing page React application into the DOM.
 * This is a simple Vite-powered static site — no Electron, no state
 * management, no data fetching beyond external links.
 */
import React from "react";
import ReactDOM from "react-dom/client";

import App from "./app";

import "./styles.css";

const rootElement = document.querySelector("#root");

if (!rootElement) {
  throw new Error("Could not find the #root element.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
