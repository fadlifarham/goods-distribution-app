import { useState, useEffect, useRef } from "react";
// import { google } from "googleapis";

// const IS_FROM_RENDER = import.meta.env.IS_FROM_RENDER === "TRUE";
// const MASTER_SHEET_ID = import.meta.env.MASTER_SHEET_ID;
// const SIMPEGNAS_SHEET_ID = import.meta.env.SIMPEGNAS_SHEET_ID;

// let DEFAULT_KEYFILE;
// if (IS_FROM_RENDER) {
//   DEFAULT_KEYFILE = "/etc/secrets/google.json";
// } else {
//   DEFAULT_KEYFILE = "./google.json";
// }

// const auth = new google.auth.GoogleAuth({
//   keyFile: DEFAULT_KEYFILE,
//   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
// });

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "";

const makeApiUrl = (path) => {
  const base = API_BASE_URL.replace(/\/+$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

const PRODUCT_OPTIONS = [];

const UNIT_OPTIONS = [];

const RECEIVER_OPTIONS = [];

// ====================================================================
// GOOGLE SHEETS INTEGRATION (PLACEHOLDER — wire these up later)
// ====================================================================
// Recommended approach: deploy a Google Apps Script as a Web App bound
// to your spreadsheet, then call it here with fetch(). Fill in the
// deployment URL below once it exists.
// const GOOGLE_SHEETS_CONFIG = {
//   products: "https://sheetdb.io/api/v1/ehvx7hanm33bm",
// };

// const readSheet = async (spreadsheetId, range) => {
//   const client = await auth.getClient();
//   const sheets = google.sheets({ version: "v4", auth: client });
//   const res = await sheets.spreadsheets.values.get({
//     spreadsheetId,
//     range,
//   });
//   return res.data.values || [];
// };

// Fetch dropdown options for a given field from Google Sheets.
// `listName` is one of: "products", "units", "receivers" — pick a sheet
// tab or named range per list, one option per row.
// Expected response shape: { options: ["Option A", "Option B", ...] }
async function fetchDropdownOptionsFromSheet(listName) {
  // TODO: implement the real request, e.g.:

  let results;

  if (listName === "products") {
    const res = await fetch(makeApiUrl("/api/products"));
    if (!res.ok) throw new Error(`Failed to fetch ${listName} options`);
    const data = await res.json();

    results = data.map((item) => item.name);
  } else if (listName === "units") {
    const res = await fetch(makeApiUrl("/api/unit-receivers"));
    if (!res.ok) throw new Error(`Failed to fetch ${listName} options`);
    const data = await res.json();

    results = data.map((item) => item.name);
  } else if (listName === "receivers") {
    const res = await fetch(makeApiUrl("/api/people-receivers"));
    if (!res.ok) throw new Error(`Failed to fetch ${listName} options`);
    const data = await res.json();

    results = data.map((item) => item.name);
  } else {
    throw new Error(`Unknown listName: ${listName}`);
  }

  return results;

  // let sheetId;
  // let range;
  // if (listName === "products") {
  //   sheetId = MASTER_SHEET_ID;
  //   range = "Data Nama ATK/BHP!B2:B";
  // } else if (listName === "units") {
  //   sheetId = MASTER_SHEET_ID;
  //   range = "Data Ruangan!B2:B";
  // } else if (listName === "receivers") {
  //   sheetId = SIMPEGNAS_SHEET_ID;
  //   range = "master_pegawai!B2:B";
  // }

  // const readSheetValue = await readSheet(sheetId, range);

  // console.log(readSheetValue);

  // console.log(
  //   `[placeholder] fetchDropdownOptionsFromSheet("${listName}") not implemented yet`,
  // );
  // return null; // null = fall back to the local hardcoded list
}

// Submit a recorded slip (date, unit, receiver, and all its product/qty
// line items) to Google Sheets, one row per product line.
async function submitSlipToSheet(slip) {
  // TODO: implement the real request, e.g.:
  const res = await fetch(makeApiUrl("/api/distribute"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(slip),
  });
  if (!res.ok) throw new Error("Failed to submit slip");
  return await res.json();
  // console.log(
  //   "[placeholder] submitSlipToSheet not implemented yet — slip payload:",
  //   slip,
  // );
  // return { success: true };
}
// ====================================================================

let itemUid = 0;
const newItem = () => ({ uid: `item-${itemUid++}`, product: "", qty: "" });

function OptionCombobox({
  value,
  options,
  onSelectOption,
  placeholder,
  isLoading,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(query.toLowerCase()),
  );

  const displayValue = open ? query : value;

  const selectOption = (opt) => {
    onSelectOption(opt);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="combo-wrap" ref={wrapperRef}>
      <input
        type="text"
        className="field-input"
        placeholder={placeholder}
        value={displayValue}
        style={{ paddingRight: isLoading ? 34 : undefined }}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
      />
      {isLoading && <div className="spinner" aria-hidden="true" />}
      {open && (
        <div className="combo-list">
          {filtered.length === 0 ? (
            <div className="combo-empty">No matches</div>
          ) : (
            filtered.map((opt) => (
              <div
                key={opt}
                className="combo-option"
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectOption(opt);
                }}
              >
                {opt}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function NameCombobox({ value, onChange, options, placeholder, isLoading }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(value.toLowerCase()),
  );

  return (
    <div className="combo-wrap" ref={wrapperRef}>
      <input
        type="text"
        className="field-input"
        placeholder={placeholder}
        value={value}
        style={{ paddingRight: isLoading ? 34 : undefined }}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
      />
      {isLoading && <div className="spinner" aria-hidden="true" />}
      {open && filtered.length > 0 && (
        <div className="combo-list">
          {filtered.map((opt) => (
            <div
              key={opt}
              className="combo-option"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt);
                setOpen(false);
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DistributionLedger() {
  const [header, setHeader] = useState({ date: "", unit: "", receiver: "" });
  const [items, setItems] = useState([newItem()]);
  const [slips, setSlips] = useState([]);
  const [stamped, setStamped] = useState(false);
  const [error, setError] = useState("");
  const [syncStatus, setSyncStatus] = useState(""); // "", "saving", "error"

  // Dropdown option lists — default to the local hardcoded lists, then
  // try to refresh from Google Sheets on mount (placeholder for now).
  const [productOptions, setProductOptions] = useState(PRODUCT_OPTIONS);
  const [unitOptions, setUnitOptions] = useState(UNIT_OPTIONS);
  const [receiverOptions, setReceiverOptions] = useState(RECEIVER_OPTIONS);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingReceivers, setLoadingReceivers] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDropdownData() {
      setLoadingProducts(true);
      setLoadingUnits(true);
      setLoadingReceivers(true);

      try {
        const products = await fetchDropdownOptionsFromSheet("products").catch(
          (err) => {
            console.error("fetch products failed:", err);
            return null;
          },
        );
        if (!cancelled && products) setProductOptions(products);
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }

      try {
        const units = await fetchDropdownOptionsFromSheet("units").catch(
          (err) => {
            console.error("fetch units failed:", err);
            return null;
          },
        );
        if (!cancelled && units) setUnitOptions(units);
      } finally {
        if (!cancelled) setLoadingUnits(false);
      }

      try {
        const receivers = await fetchDropdownOptionsFromSheet(
          "receivers",
        ).catch((err) => {
          console.error("fetch receivers failed:", err);
          return null;
        });
        if (!cancelled && receivers) setReceiverOptions(receivers);
      } finally {
        if (!cancelled) setLoadingReceivers(false);
      }
    }

    loadDropdownData();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleHeaderChange = (field) => (e) => {
    setHeader((h) => ({ ...h, [field]: e.target.value }));
  };

  const handleHeaderValueChange = (field) => (val) => {
    setHeader((h) => ({ ...h, [field]: val }));
  };

  const handleUnitSelect = (opt) => {
    setHeader((h) => ({ ...h, unit: opt }));
  };

  // Names learned locally from past submissions, merged with anything
  // fetched from the sheet (once that's wired up).
  const learnedReceivers = Array.from(
    new Set(slips.map((s) => s.receiver)),
  ).filter(Boolean);
  const receiverSuggestions = Array.from(
    new Set([...receiverOptions, ...learnedReceivers]),
  );

  const handleItemChange = (uid, field) => (e) => {
    const value = e.target.value;
    setItems((prev) =>
      prev.map((it) => (it.uid === uid ? { ...it, [field]: value } : it)),
    );
  };

  const handleProductSelect = (uid) => (opt) => {
    setItems((prev) =>
      prev.map((it) => (it.uid === uid ? { ...it, product: opt } : it)),
    );
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, newItem()]);
  };

  const removeItemRow = (uid) => {
    setItems((prev) =>
      prev.length > 1 ? prev.filter((it) => it.uid !== uid) : prev,
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!header.date || !header.unit || !header.receiver) {
      setError("Date, receiver unit, and receiver name are required.");
      return;
    }

    const validItems = items.filter((it) => it.product && it.qty !== "");
    if (validItems.length === 0) {
      setError("Add at least one product with a quantity.");
      return;
    }

    setError("");
    const newSlip = {
      id: Date.now(),
      date: header.date,
      unitReceiver: header.unit,
      peopleReceiver: header.receiver,
      products: validItems.map((it) => ({
        name: it.product,
        quantity: it.qty,
      })),
    };

    setSlips((prev) => [newSlip, ...prev]);
    setHeader({ date: "", unit: "", receiver: "" });
    setItems([newItem()]);
    setStamped(true);
    setTimeout(() => setStamped(false), 900);

    setSyncStatus("saving");
    try {
      await submitSlipToSheet(newSlip);
      setSyncStatus("");
    } catch (err) {
      console.error("submitSlipToSheet failed:", err);
      setSyncStatus("error");
    }
  };

  return (
    <div className="distribution-page" style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Spectral:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        * { box-sizing: border-box; }

        .field-input {
          font-family: 'JetBrains Mono', monospace;
          background: transparent;
          border: none;
          border-bottom: 1px dashed #8a7f6a;
          padding: 6px 2px;
          font-size: 14px;
          color: #2b2b24;
          width: 100%;
          outline: none;
          transition: border-color 0.15s ease;
        }
        .field-input:focus {
          border-bottom: 1px solid #1b4332;
        }
        .field-input::placeholder {
          color: #a89f8c;
        }

        .combo-wrap {
          position: relative;
        }
        .combo-list {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: #ffffff;
          border: 1px solid #ddd6c4;
          box-shadow: 0 6px 16px rgba(43, 43, 36, 0.12);
          max-height: 190px;
          overflow-y: auto;
          z-index: 30;
        }
        .spinner {
          position: absolute;
          right: 8px;
          top: 8px;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(0,0,0,0.08);
          border-top-color: #1b4332;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          z-index: 40;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .combo-option {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          padding: 8px 10px;
          cursor: pointer;
          color: #2b2b24;
        }
        .combo-option:hover {
          background: #eef2ee;
        }
        .combo-empty {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          padding: 8px 10px;
          color: #a89f8c;
        }

        .submit-btn {
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 12px;
          font-weight: 600;
          background: #1b4332;
          color: #f7f5f0;
          border: none;
          padding: 12px 20px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .submit-btn:hover {
          background: #163a2a;
        }
        .btn-spinner {
          display: inline-block;
          vertical-align: middle;
          margin-left: 10px;
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .add-row-btn {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          background: transparent;
          border: 1px dashed #1b4332;
          color: #1b4332;
          padding: 8px 14px;
          cursor: pointer;
          width: 100%;
          margin-top: 4px;
          transition: all 0.15s ease;
        }
        .add-row-btn:hover {
          background: #eef2ee;
        }

        .row-del-btn {
          font-family: 'JetBrains Mono', monospace;
          font-size: 16px;
          background: transparent;
          border: none;
          color: #a89f8c;
          cursor: pointer;
          line-height: 1;
          padding: 4px 6px;
        }
        .row-del-btn:hover { color: #a3453b; }
        .row-del-btn:disabled {
          opacity: 0.25;
          cursor: not-allowed;
        }

        .stamp {
          position: absolute;
          top: 18px;
          right: 18px;
          font-family: 'Spectral', serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.12em;
          color: #a3453b;
          border: 2px solid #a3453b;
          padding: 4px 10px;
          transform: rotate(-8deg) scale(0.7);
          opacity: 0;
          transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          pointer-events: none;
        }
        .stamp.show {
          opacity: 1;
          transform: rotate(-8deg) scale(1);
        }

        @keyframes rowIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .item-row {
          animation: rowIn 0.2s ease;
        }

        .perforation {
          height: 1px;
          background-image: repeating-linear-gradient(
            to right,
            #b0a890 0,
            #b0a890 6px,
            transparent 6px,
            transparent 12px
          );
        }

        .distribution-page {
          padding: 40px 16px;
        }
        .page-title {
          font-size: 34px;
        }
        .header-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px 24px;
        }
        .item-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .item-product {
          flex: 3;
        }
        .item-qty {
          flex: 1;
        }

        @media (max-width: 560px) {
          .distribution-page {
            padding: 24px 12px;
          }
          .page-title {
            font-size: 26px;
          }
          .slip-form {
            padding: 20px 16px !important;
          }
          .header-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
          .item-row {
            flex-wrap: wrap;
          }
          .item-product {
            flex: 1 1 100%;
          }
          .item-qty {
            flex: 1 1 auto;
          }
          .field-input {
            font-size: 16px;
          }
          .submit-btn {
            width: 100%;
            padding: 14px 20px;
          }
          .actions {
            flex-direction: column;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .actions span {
            text-align: center;
          }
        }
      `}</style>

      <div style={styles.wrap}>
        <header style={styles.header}>
          <div style={styles.eyebrow}>DISTRIBUTION LOG</div>
          <h1 className="page-title" style={styles.title}>
            Barang Keluar
          </h1>
          <div style={styles.sub}>
            Record items issued in one slip per date &amp; receiver
          </div>
        </header>

        <form onSubmit={handleSubmit} className="slip-form" style={styles.slip}>
          <div className={`stamp ${stamped ? "show" : ""}`}>RECORDED</div>

          <div className="header-grid">
            <label style={styles.label}>
              <span style={styles.labelText}>Date</span>
              <input
                type="date"
                className="field-input"
                value={header.date}
                onChange={handleHeaderChange("date")}
              />
            </label>

            <label style={styles.label}>
              <span style={styles.labelText}>Receiver Unit</span>
              <OptionCombobox
                value={header.unit}
                options={unitOptions}
                isLoading={loadingUnits}
                onSelectOption={handleUnitSelect}
                placeholder="Search unit\u2026"
              />
            </label>

            <label style={{ ...styles.label, gridColumn: "1 / -1" }}>
              <span style={styles.labelText}>Receiver Name</span>
              <NameCombobox
                value={header.receiver}
                onChange={handleHeaderValueChange("receiver")}
                options={receiverSuggestions}
                isLoading={loadingReceivers}
                placeholder="Search or type full name"
              />
            </label>
          </div>

          <div className="perforation" style={{ margin: "22px 0 18px" }} />

          <div style={styles.itemsHeaderRow}>
            <span style={styles.labelText}>Products</span>
          </div>

          <div style={styles.itemsList}>
            {items.map((it, idx) => (
              <div key={it.uid} className="item-row">
                <label className="item-product" style={styles.label}>
                  {idx === 0 && (
                    <span style={styles.labelText}>Product Name</span>
                  )}
                  <OptionCombobox
                    value={it.product}
                    options={productOptions}
                    isLoading={loadingProducts}
                    onSelectOption={handleProductSelect(it.uid)}
                    placeholder="Search product\u2026"
                  />
                </label>
                <label className="item-qty" style={styles.label}>
                  {idx === 0 && <span style={styles.labelText}>Qty</span>}
                  <input
                    type="number"
                    min="0"
                    className="field-input"
                    placeholder="0"
                    value={it.qty}
                    onChange={handleItemChange(it.uid, "qty")}
                  />
                </label>
                <button
                  type="button"
                  className="row-del-btn"
                  style={idx === 0 ? { marginTop: 18 } : undefined}
                  onClick={() => removeItemRow(it.uid)}
                  disabled={items.length === 1}
                  aria-label="Remove product row"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <button type="button" className="add-row-btn" onClick={addItemRow}>
            + Add another product
          </button>

          {error && <div style={styles.error}>{error}</div>}

          <div className="actions" style={styles.actions}>
            <button
              type="submit"
              className="submit-btn"
              disabled={syncStatus === "saving"}
              aria-busy={syncStatus === "saving"}
            >
              Record Slip
              {syncStatus === "saving" && <span className="btn-spinner" />}
            </button>
            <span style={styles.count}>
              {slips.length} {slips.length === 1 ? "slip" : "slips"} recorded
              {syncStatus === "saving" && " \u00b7 syncing to sheet\u2026"}
              {syncStatus === "error" && " \u00b7 sheet sync not connected yet"}
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f7f5f0",
    fontFamily: "'Spectral', serif",
    color: "#2b2b24",
  },
  wrap: {
    maxWidth: 640,
    margin: "0 auto",
  },
  header: {
    marginBottom: 28,
  },
  eyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.18em",
    color: "#b08d57",
    marginBottom: 8,
  },
  title: {
    fontWeight: 700,
    margin: 0,
    color: "#1b4332",
  },
  sub: {
    fontSize: 14,
    color: "#6b6250",
    marginTop: 6,
  },
  slip: {
    position: "relative",
    background: "#ffffff",
    border: "1px solid #ddd6c4",
    padding: "28px 24px",
    boxShadow: "0 2px 0 #ddd6c4",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  labelText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#8a7f6a",
  },
  itemsHeaderRow: {
    marginBottom: 8,
  },
  itemsList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  error: {
    marginTop: 14,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    color: "#a3453b",
  },
  actions: {
    marginTop: 24,
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  count: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "#8a7f6a",
  },
};
