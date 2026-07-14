import { jsPDF } from "jspdf";

const PAGE_WIDTH = 210;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const currency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const addTableHeader = (doc, y) => {
  doc.setFillColor(26, 75, 140);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("Item", MARGIN + 3, y + 5.7);
  doc.text("Qty", 139, y + 5.7, { align: "center" });
  doc.text("Price", 161, y + 5.7, { align: "right" });
  doc.text("Total", 195, y + 5.7, { align: "right" });
  return y + 9;
};

const addFooter = (doc) => {
  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(229, 231, 235);
    doc.line(MARGIN, 282, PAGE_WIDTH - MARGIN, 282);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text("Thank you for shopping with AstroWala.", MARGIN, 287);
    doc.text(`Page ${page} of ${pageCount}`, PAGE_WIDTH - MARGIN, 287, { align: "right" });
  }
};

export const createInvoicePdf = (order) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const items = Array.isArray(order?.items) ? order.items : [];
  const itemSubtotal = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
    0,
  );
  const subtotal = Number(order?.subtotal) || itemSubtotal;
  const discount = Number(order?.discount) || 0;
  const total = Number(order?.total) || Math.max(0, subtotal - discount);
  const address = order?.address || {};

  doc.setFillColor(26, 75, 140);
  doc.rect(0, 0, PAGE_WIDTH, 35, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(23);
  doc.setTextColor(255, 255, 255);
  doc.text("AstroWala", MARGIN, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Order invoice", MARGIN, 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("INVOICE", PAGE_WIDTH - MARGIN, 17, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Invoice for order #${order?.id || "-"}`, PAGE_WIDTH - MARGIN, 24, { align: "right" });

  doc.setTextColor(31, 41, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Bill to", MARGIN, 47);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const addressLines = [
    address.name,
    address.line,
    [address.city, address.state, address.pincode].filter(Boolean).join(", "),
    address.phone ? `Phone: ${address.phone}` : "",
  ].filter(Boolean);
  doc.text(addressLines.length > 0 ? addressLines : ["Customer address unavailable"], MARGIN, 53, {
    lineHeightFactor: 1.45,
  });

  doc.setFont("helvetica", "bold");
  doc.text("Invoice details", 128, 47);
  doc.setFont("helvetica", "normal");
  const details = [
    `Order ID: ${order?.id || "-"}`,
    `Order date: ${formatDate(order?.placedAt)}`,
    `Payment: ${order?.paymentMethod === "cod" ? "Cash on Delivery" : String(order?.paymentMethod || "-").toUpperCase()}`,
    `Payment status: ${order?.paymentStatus || "Pending"}`,
  ];
  doc.text(details, 128, 53, { lineHeightFactor: 1.45 });

  let y = addTableHeader(doc, 84);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  items.forEach((item) => {
    const nameLines = doc.splitTextToSize(item.name || "Product", 105);
    const rowHeight = Math.max(11, nameLines.length * 4.3 + 4);

    if (y + rowHeight > 265) {
      doc.addPage();
      y = addTableHeader(doc, 18);
    }

    doc.setDrawColor(229, 231, 235);
    doc.line(MARGIN, y + rowHeight, PAGE_WIDTH - MARGIN, y + rowHeight);
    doc.setTextColor(31, 41, 55);
    doc.text(nameLines, MARGIN + 3, y + 5.5, { lineHeightFactor: 1.25 });
    doc.text(String(Number(item.qty) || 0), 139, y + 5.5, { align: "center" });
    doc.text(currency(item.price), 161, y + 5.5, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(currency((Number(item.price) || 0) * (Number(item.qty) || 0)), 195, y + 5.5, {
      align: "right",
    });
    doc.setFont("helvetica", "normal");
    y += rowHeight;
  });

  if (y + 48 > 265) {
    doc.addPage();
    y = 24;
  }

  const totalsX = 132;
  doc.setDrawColor(229, 231, 235);
  doc.line(totalsX, y + 7, PAGE_WIDTH - MARGIN, y + 7);
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text("Subtotal", totalsX, y + 14);
  doc.text(currency(subtotal), PAGE_WIDTH - MARGIN, y + 14, { align: "right" });
  if (discount > 0) {
    doc.text("Discount", totalsX, y + 21);
    doc.text(`- ${currency(discount)}`, PAGE_WIDTH - MARGIN, y + 21, { align: "right" });
  }
  const totalY = y + (discount > 0 ? 29 : 22);
  doc.setDrawColor(26, 75, 140);
  doc.line(totalsX, totalY, PAGE_WIDTH - MARGIN, totalY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(26, 75, 140);
  doc.text("Amount paid", totalsX, totalY + 8);
  doc.text(currency(total), PAGE_WIDTH - MARGIN, totalY + 8, { align: "right" });

  addFooter(doc);
  return doc;
};

export const downloadInvoicePdf = (order) => {
  const filename = `AstroWala-Invoice-${String(order?.id || "order").slice(-12)}.pdf`;
  createInvoicePdf(order).save(filename);
};
