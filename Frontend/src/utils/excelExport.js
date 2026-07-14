import { showErrorPopup } from "./notificationCenter";

const normalizeCellValue = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean") return value;
  return String(value);
};

const getDatedFileName = (fileName) => {
  const date = new Date().toISOString().slice(0, 10);
  const baseName = String(fileName || "export")
    .trim()
    .replace(/\.xlsx$/i, "")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "export";

  return `${baseName}-${date}.xlsx`;
};

export const exportRowsToExcel = async ({ fileName, sheetName, columns, rows }) => {
  if (!rows.length) {
    showErrorPopup("There is no data available for this Excel export.", {
      title: "Nothing to export",
    });
    return false;
  }

  try {
    const { default: writeXlsxFile } = await import("write-excel-file/browser");
    const header = columns.map((column) => ({
      value: column.header,
      fontWeight: "bold",
      color: "#ffffff",
      textColor: "#ffffff",
      fontColor: "#ffffff",
      backgroundColor: "#1F4F91",
      align: "center",
      verticalAlign: "center",
    }));
    const body = rows.map((row, rowIndex) =>
      columns.map((column) => ({
        value: normalizeCellValue(
          column.value ? column.value(row, rowIndex) : row[column.key],
        ),
        wrap: true,
        verticalAlign: "center",
      })),
    );

    const workbook = writeXlsxFile([header, ...body], {
      columns: columns.map((column) => ({ width: column.width || 18 })),
      sheet: String(sheetName || "Data").slice(0, 31),
    });
    await workbook.toFile(getDatedFileName(fileName));

    return true;
  } catch (error) {
    showErrorPopup(error, {
      title: "Excel export failed",
      details: "The workbook could not be generated. Please try again.",
    });
    return false;
  }
};
