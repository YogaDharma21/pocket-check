import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./components/ThemeProvider";
import { ConvexClientProvider } from "./components/ConvexClientProvider";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find root element #root");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <ConvexClientProvider>
        <App />
      </ConvexClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);
