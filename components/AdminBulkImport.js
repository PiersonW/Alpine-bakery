"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { CATEGORIES } from "../lib/categories";

// Matches spreadsheet column headers loosely -- case, spacing, and a few
// common alternate names ("desc" for description, "cost" for price, etc.)
// all work, so it isn't fussy about exact wording.
function normalizeHeader(header) {
  return String(header || "").trim().toLowerCase();
}

const HEADER_ALIASES = {
  name: ["name", "product", "product name", "item"],
  description: ["description", "desc", "details"],
  price: ["price", "cost", "price (usd)", "price usd"],
  category: ["category", "type", "section"],
  image_url: ["image url", "image", "photo url", "photo"],
};

function findValue(row, field) {
  const aliases = HEADER_ALIASES[field];
  for (const key of Object.keys(row)) {
    if (aliases.includes(normalizeHeader(key))) return row[key];
  }
  return undefined;
}

function parsePrice(raw) {
  if (raw === undefined || raw === null || raw === "") return null;
  const cleaned = String(raw).replace(/[^0-9.]/g, "");
  const dollars = parseFloat(cleaned);
  if (isNaN(dollars)) return null;
  return Math.round(dollars * 100);
}

function parseRows(rawRows) {
  return rawRows.map((row) => {
    const name = String(findValue(row, "name") || "").trim();
    const description = String(findValue(row, "description") || "").trim();
    const price_cents = parsePrice(findValue(row, "price"));
    const rawCategory = String(findValue(row, "category") || "").trim();
    const category =
      CATEGORIES.find((c) => c.toLowerCase() === rawCategory.toLowerCase()) ||
      "Other";
    const image_url = String(findValue(row, "image_url") || "").trim();

    return {
      name,
      description,
      price_cents,
      category,
      image_url,
      valid: Boolean(name) && Boolean(price_cents) && price_cents > 0,
    };
  });
}

export default function AdminBulkImport({ onImported }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setResult(null);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      if (rawRows.length === 0) {
        setError("That file doesn't seem to have any rows in it.");
        return;
      }
      setRows(parseRows(rawRows));
    } catch (err) {
      setError("Couldn't read that file. Make sure it's a .xlsx, .xls, or .csv file.");
    }
  }

  async function handleImport() {
    const validRows = rows.filter((r) => r.valid);
    if (validRows.length === 0) return;

    setImporting(true);
    setError("");
    try {
      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: validRows }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed. Try again.");
        setImporting(false);
        return;
      }
      setResult(data);
      setRows([]);
      setFileName("");
      onImported?.();
    } catch (err) {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setImporting(false);
    }
  }

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.length - validCount;

  return (
    <div className="card">
      <h2>Bulk import from a spreadsheet</h2>
      <p style={{ fontSize: "0.9rem", color: "rgba(38,55,42,0.7)", marginTop: "-10px" }}>
        Upload a .xlsx, .xls, or .csv file with columns for{" "}
        <strong>Name</strong>, <strong>Description</strong>, <strong>Price</strong>,
        and <strong>Category</strong>. Photos can't come from a spreadsheet — add
        those afterward on each product's Edit screen.
      </p>

      <div className="field">
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} />
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      {rows.length > 0 ? (
        <>
          <p style={{ fontSize: "0.9rem" }}>
            Found <strong>{rows.length}</strong> row{rows.length === 1 ? "" : "s"} in{" "}
            {fileName}. {validCount} ready to import
            {invalidCount > 0 ? `, ${invalidCount} will be skipped (missing a name or price)` : ""}.
          </p>

          <div style={{ maxHeight: "260px", overflowY: "auto", border: "1.5px solid var(--line)", borderRadius: "8px", marginBottom: "14px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "var(--snowcap)" }}>
                  <th style={{ textAlign: "left", padding: "8px 10px" }}>Name</th>
                  <th style={{ textAlign: "left", padding: "8px 10px" }}>Price</th>
                  <th style={{ textAlign: "left", padding: "8px 10px" }}>Category</th>
                  <th style={{ textAlign: "left", padding: "8px 10px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--line)", opacity: r.valid ? 1 : 0.5 }}>
                    <td style={{ padding: "8px 10px" }}>{r.name || "—"}</td>
                    <td style={{ padding: "8px 10px" }}>
                      {r.price_cents ? `$${(r.price_cents / 100).toFixed(2)}` : "—"}
                    </td>
                    <td style={{ padding: "8px 10px" }}>{r.category}</td>
                    <td style={{ padding: "8px 10px" }}>
                      {r.valid ? "Ready" : "Skipped"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleImport}
            disabled={importing || validCount === 0}
          >
            {importing ? "Importing…" : `Import ${validCount} product${validCount === 1 ? "" : "s"}`}
          </button>
        </>
      ) : null}

      {result ? (
        <p className="pickup-summary" style={{ marginTop: "14px" }}>
          Imported {result.inserted} product{result.inserted === 1 ? "" : "s"}.
          {result.skipped?.length > 0
            ? ` Skipped: ${result.skipped.join(", ")}.`
            : ""}
        </p>
      ) : null}
    </div>
  );
}
