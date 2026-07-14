import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { HelmetProvider } from "react-helmet-async";
import AppErrorBoundary from "./components/AppErrorBoundary";
import ErrorPopupCenter from "./components/ErrorPopupCenter";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <HelmetProvider>
        <ErrorPopupCenter />
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </HelmetProvider>
    </Provider>
  </StrictMode>
);
