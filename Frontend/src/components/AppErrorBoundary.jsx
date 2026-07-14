import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { showErrorPopup } from "../utils/notificationCenter";

export default class AppErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    showErrorPopup(error, {
      title: "This page could not be displayed",
      details: "A rendering error interrupted this page. Reload to try again.",
      duration: 0,
    });
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <section className="w-full max-w-md rounded-md border border-red-100 bg-white p-6 text-center shadow-card">
          <AlertTriangle size={38} className="mx-auto text-red-600" />
          <h1 className="mt-3 text-lg font-semibold text-gray-900">We could not load this page</h1>
          <p className="mt-2 text-sm text-gray-600">
            An unexpected error occurred. Reload the page to try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex items-center gap-2 rounded bg-brand px-4 py-2 text-sm font-semibold text-white"
          >
            <RefreshCw size={15} /> Reload page
          </button>
        </section>
      </main>
    );
  }
}

