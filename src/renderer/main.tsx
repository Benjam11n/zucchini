import React from "react";
import ReactDOM from "react-dom/client";

import App from "./app/app-root";

import "./globals.css";

const rootElement = document.querySelector("#root");

if (!rootElement) {
  throw new Error("Could not find the #root element.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
