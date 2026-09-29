import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { WorldCupDataProvider } from "./lib/data";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <WorldCupDataProvider>
        <App />
      </WorldCupDataProvider>
    </BrowserRouter>
  </React.StrictMode>
);
