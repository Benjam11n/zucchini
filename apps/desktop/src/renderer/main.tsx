import React from "react";
import ReactDOM from "react-dom/client";

import App from "./app/app-root";

import "./globals.css";

if (new URLSearchParams(window.location.search).get("view") === "widget") {
  document.body.dataset["view"] = "widget";
  document.documentElement.dataset["view"] = "widget";
}

const rootElement = document.querySelector("#root");

if (!rootElement) {
  throw new Error("Could not find the #root element.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
