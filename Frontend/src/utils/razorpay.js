import { backendUrl, fetchWithAuth, readApiResponse } from "../config/api";

const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
let checkoutScriptPromise;

const loadRazorpayCheckout = () => {
  if (window.Razorpay) return Promise.resolve();
  if (checkoutScriptPromise) return checkoutScriptPromise;

  checkoutScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${CHECKOUT_SCRIPT}"]`);
    const script = existingScript || document.createElement("script");

    script.onload = () => {
      if (window.Razorpay) resolve();
      else reject(new Error("Razorpay Checkout did not initialize"));
    };
    script.onerror = () => reject(new Error("Could not load Razorpay Checkout"));

    if (!existingScript) {
      script.src = CHECKOUT_SCRIPT;
      script.async = true;
      document.body.appendChild(script);
    }
  }).catch((error) => {
    checkoutScriptPromise = null;
    throw error;
  });

  return checkoutScriptPromise;
};

const requestPaymentApi = async (path, body) => {
  const response = await fetchWithAuth(`${backendUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await readApiResponse(response);

  if (!response.ok) {
    const error = new Error(data.message || "Payment request failed");
    error.apiReported = true;
    throw error;
  }

  return data;
};

export const createRazorpayOrder = async (orderPayload) => {
  const response = await requestPaymentApi(
    "/api/v1/payment/razorpay/order",
    orderPayload,
  );
  return response.data;
};

export const verifyRazorpayPayment = async (paymentResponse) => {
  const response = await requestPaymentApi(
    "/api/v1/payment/razorpay/verify",
    paymentResponse,
  );
  return response.order;
};

export const openRazorpayCheckout = async ({
  paymentOrder,
  customer,
  itemCount,
  onPaymentFailed,
}) => {
  await loadRazorpayCheckout();

  return new Promise((resolve, reject) => {
    let completed = false;
    const checkout = new window.Razorpay({
      key: paymentOrder.keyId,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      order_id: paymentOrder.razorpayOrderId,
      name: "AstroMart",
      description: `Payment for ${itemCount} ${itemCount === 1 ? "item" : "items"}`,
      prefill: {
        name: customer.name || "",
        email: customer.email || "",
        contact: customer.phone || "",
      },
      retry: { enabled: true },
      theme: { color: "#1F4F91" },
      handler: (response) => {
        completed = true;
        resolve(response);
      },
      modal: {
        ondismiss: () => {
          if (completed) return;
          const error = new Error("Payment window was closed before completion");
          error.code = "RAZORPAY_DISMISSED";
          reject(error);
        },
      },
    });

    checkout.on("payment.failed", (response) => {
      onPaymentFailed?.(response.error || {});
    });
    checkout.open();
  });
};
