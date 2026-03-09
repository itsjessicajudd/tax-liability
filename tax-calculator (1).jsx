import { useState, useCallback } from "react";

const BRACKETS_JOINT = [
  { rate: 0.10, min: 0, max: 23850 },
  { rate: 0.12, min: 23850, max: 96950 },
  { rate: 0.22, min: 96950, max: 206700 },
  { rate: 0.24, min: 206700, max: 394600 },
  { rate: 0.32, min: 394600, max: 501050 },
  { rate: 0.35, min: 501050, max: 751600 },
  { rate: 0.37, min: 751600, max: Infinity },
];

const BRACKETS_SINGLE = [
  { rate: 0.10, min: 0, max: 11925 },
  { rate: 0.12, min: 11925, max: 48475 },
  { rate: 0.22, min: 48475, max: 103350 },
  { rate: 0.24, min: 103350, max: 197300 },
  { rate: 0.32, min: 197300, max: 250525 },
  { rate: 0.35, min: 250525, max: 626350 },
  { rate: 0.37, min: 626350, max: Infinity },
];

const STD_DEDUCTION_JOINT = 31500;
const STD_DEDUCTION_SINGLE = 15750;

function calcTax(income, brackets) {
  let tax = 0;
  const breakdown = [];
  for (const b of brackets) {
    if (income <= b.min) break;
    const taxable = Math.min(income, b.max) - b.min;
    const amount = taxable * b.rate;
    tax += amount;
    breakdown.push({ rate: b.rate, taxable, amount });
  }
  return { tax, breakdown };
}

function fmt(n) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function pct(n) {
  return (n * 100).toFixed(1) + "%";
}

function parseDollar(s) {
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function TaxBreakdown({ brackets, income, deduction }) {
  const taxable = Math.max(0, income - deduction);
  const { breakdown } = calcTax(taxable, brackets);
  return (
    <div style={{ marginTop: 8 }}>
      {breakdown.map((b, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888", padding: "2px 0", borderBottom: "1px solid #f0f0f0" }}>
          <span>{pct(b.rate)} bracket</span>
          <span style={{ color: "#555" }}>{fmt(b.taxable)} × {pct(b.rate)} = <strong style={{ color: "#c0392b" }}>{fmt(b.amount)}</strong></span>
        </div>
      ))}
    </div>
  );
}

function ResultCard({ label, income, deduction, brackets, accent, withheld }) {
  const taxable = Math.max(0, income - deduction);
  const { tax } = calcTax(taxable, brackets);
  const effRate = income > 0 ? tax / income : 0;
  const balance = withheld - tax;
  const isRefund = balance >= 0;
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      padding: "24px 28px",
      boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
      borderTop: `4px solid ${accent}`,
      flex: 1,
      minWidth: 260
    }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 }}>{label}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Row l="Gross Income" v={fmt(income)} />
        <Row l="Standard Deduction" v={`(${fmt(deduction)})`} color="#888" />
        <Row l="Taxable Income" v={fmt(taxable)} bold />
        <div style={{ borderTop: "2px solid #f5f5f5", margin: "4px 0" }} />
        <Row l="Federal Tax Liability" v={fmt(tax)} color={accent} bold big />
        <Row l="Effective Rate" v={pct(effRate)} color="#555" />
        <Row l="After-Tax Income" v={fmt(income - tax)} color="#27ae60" bold />
        <div style={{ borderTop: "2px solid #f5f5f5", margin: "4px 0" }} />
        <Row l="Already Withheld" v={fmt(withheld)} color="#555" />
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: isRefund ? "#f0fdf4" : "#fff5f5",
          borderRadius: 8, padding: "8px 10px", marginTop: 2
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: isRefund ? "#16a34a" : "#dc2626" }}>
            {isRefund ? "Est. Refund" : "Est. Amount Owed"}
          </span>
          <span style={{ fontSize: 18, fontWeight: 700, color: isRefund ? "#16a34a" : "#dc2626" }}>
            {fmt(Math.abs(balance))}
          </span>
        </div>
      </div>
      <TaxBreakdown brackets={brackets} income={income} deduction={deduction} />
    </div>
  );
}

function Row({ l, v, color = "#1a1a2e", bold, big }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13, color: "#888" }}>{l}</span>
      <span style={{ fontSize: big ? 20 : 14, fontWeight: bold ? 700 : 400, color }}>{v}</span>
    </div>
  );
}

function CurrencyInput({ label, value, onChange, hint }) {
  const [raw, setRaw] = useState(value.toString());
  const handleChange = (e) => {
    setRaw(e.target.value);
    const n = parseDollar(e.target.value);
    onChange(n);
  };
  const handleBlur = () => {
    const n = parseDollar(raw);
    setRaw(n > 0 ? n.toLocaleString("en-US") : "0");
    onChange(n);
  };
  return (
    <div style={{ flex: 1, minWidth: 160 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#888", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{label}</label>
      {hint && <div style={{ fontSize: 11, color: "#bbb", marginBottom: 4 }}>{hint}</div>}
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: 15 }}>$</span>
        <input
          type="text"
          value={raw}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "10px 12px 10px 26px",
            border: "2px solid #e8e8e8",
            borderRadius: 10,
            fontSize: 16,
            fontFamily: "'DM Mono', monospace",
            outline: "none",
            color: "#1a1a2e",
            background: "#fafafa",
            transition: "border-color 0.2s"
          }}
          onFocus={e => e.target.style.borderColor = "#6c63ff"}
          onBlurCapture={e => e.target.style.borderColor = "#e8e8e8"}
        />
      </div>
    </div>
  );
}

export default function App() {
  const [p1Name, setP1Name] = useState("Alex");
  const [p2Name, setP2Name] = useState("Jordan");
  const [p1Income, setP1Income] = useState(95000);
  const [p2Income, setP2Income] = useState(68000);
  const [p1Withheld, setP1Withheld] = useState(18200);
  const [p2Withheld, setP2Withheld] = useState(11900);

  const jointIncome = p1Income + p2Income;
  const jointTaxable = Math.max(0, jointIncome - STD_DEDUCTION_JOINT);
  const { tax: jointTax } = calcTax(jointTaxable, BRACKETS_JOINT);

  const sep1Taxable = Math.max(0, p1Income - STD_DEDUCTION_SINGLE);
  const sep2Taxable = Math.max(0, p2Income - STD_DEDUCTION_SINGLE);
  const { tax: sep1Tax } = calcTax(sep1Taxable, BRACKETS_SINGLE);
  const { tax: sep2Tax } = calcTax(sep2Taxable, BRACKETS_SINGLE);
  const totalSepTax = sep1Tax + sep2Tax;
  const jointWithheld = p1Withheld + p2Withheld;

  const delta = totalSepTax - jointTax;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f5f3ff 0%, #ffe8f0 100%)",
      fontFamily: "'DM Sans', sans-serif",
      padding: "40px 20px"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;600&family=DM+Mono&display=swap" rel="stylesheet" />
      <style>{`
        @media print {
          @page { margin: 0.6in; size: landscape; }
          body { background: white !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, color: "#6c63ff", textTransform: "uppercase", marginBottom: 8 }}>2025 Tax Year</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 900, color: "#1a1a2e", margin: 0, lineHeight: 1.1 }}>
            Federal Tax Calculator
          </h1>
          <p style={{ color: "#888", marginTop: 12, fontSize: 15 }}>Joint vs. Separate Filing — Standard Deduction Only</p>
          <button
            className="no-print"
            onClick={() => window.print()}
            style={{
              marginTop: 16,
              padding: "10px 24px",
              background: "#1a1a2e",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              letterSpacing: 0.3,
              boxShadow: "0 2px 8px rgba(26,26,46,0.18)",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#6c63ff"}
            onMouseLeave={e => e.currentTarget.style.background = "#1a1a2e"}
          >
            <span style={{ fontSize: 16 }}>⬇</span> Export to PDF
          </button>
        </div>

        {/* Inputs */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "32px 36px", boxShadow: "0 2px 24px rgba(108,99,255,0.08)", marginBottom: 32 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#1a1a2e", marginBottom: 24 }}>Enter Income & Withholding (W-2 Box 1 & Box 2)</div>

          {/* Person 1 row */}
          <div style={{ display: "flex", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ flex: "0 0 160px", minWidth: 140 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#888", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Person 1 Name</label>
              <input value={p1Name} onChange={e => setP1Name(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "2px solid #e8e8e8", borderRadius: 10, fontSize: 16, fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#1a1a2e", background: "#fafafa" }} />
            </div>
            <CurrencyInput label="Person 1 Income" value={p1Income} onChange={setP1Income} />
            <CurrencyInput label="Person 1 Fed Tax Withheld" value={p1Withheld} onChange={setP1Withheld} />
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid #f0f0f0", margin: "4px 0 16px" }} />

          {/* Person 2 row */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: "0 0 160px", minWidth: 140 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#888", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Person 2 Name</label>
              <input value={p2Name} onChange={e => setP2Name(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "2px solid #e8e8e8", borderRadius: 10, fontSize: 16, fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#1a1a2e", background: "#fafafa" }} />
            </div>
            <CurrencyInput label="Person 2 Income" value={p2Income} onChange={setP2Income} />
            <CurrencyInput label="Person 2 Fed Tax Withheld" value={p2Withheld} onChange={setP2Withheld} />
          </div>
        </div>

        {/* Summary Banner */}
        <div style={{
          borderRadius: 16, padding: "20px 32px", marginBottom: 32,
          background: delta > 0
            ? "linear-gradient(90deg, #e8f5e9, #f1fff2)"
            : delta < 0
              ? "linear-gradient(90deg, #fff3e0, #fff8f0)"
              : "linear-gradient(90deg, #ede7f6, #f5f3ff)",
          border: `1.5px solid ${delta > 0 ? "#a5d6a7" : delta < 0 ? "#ffcc80" : "#b39ddb"}`,
          display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap"
        }}>
          <div style={{ fontSize: 28 }}>{delta > 0 ? "💍" : delta < 0 ? "⚠️" : "⚖️"}</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18, color: "#1a1a2e" }}>
              {Math.abs(delta) < 50
                ? "Filing jointly or separately yields roughly the same result."
                : delta > 0
                  ? `Filing jointly saves ${fmt(delta)} compared to filing separately.`
                  : `Filing separately saves ${fmt(Math.abs(delta))} compared to filing jointly.`}
            </div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
              Joint tax: {fmt(jointTax)} &nbsp;|&nbsp; Combined separate tax: {fmt(totalSepTax)}
            </div>
          </div>
        </div>

        {/* Result Cards */}
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 32 }}>
          <ResultCard
            label="Married Filing Jointly"
            income={jointIncome}
            deduction={STD_DEDUCTION_JOINT}
            brackets={BRACKETS_JOINT}
            accent="#6c63ff"
            withheld={jointWithheld}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1, minWidth: 260 }}>
            <ResultCard
              label={`${p1Name || "Person 1"} — Filing Separately`}
              income={p1Income}
              deduction={STD_DEDUCTION_SINGLE}
              brackets={BRACKETS_SINGLE}
              accent="#e84393"
              withheld={p1Withheld}
            />
            <ResultCard
              label={`${p2Name || "Person 2"} — Filing Separately`}
              income={p2Income}
              deduction={STD_DEDUCTION_SINGLE}
              brackets={BRACKETS_SINGLE}
              accent="#f59e0b"
              withheld={p2Withheld}
            />
          </div>
        </div>

        {/* Bracket Tables */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "28px 36px", boxShadow: "0 2px 24px rgba(0,0,0,0.05)" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#1a1a2e", marginBottom: 16 }}>2025 Tax Brackets Reference</div>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {[
              { title: "Married Filing Jointly", brackets: BRACKETS_JOINT, deduction: STD_DEDUCTION_JOINT },
              { title: "Single / Married Filing Separately", brackets: BRACKETS_SINGLE, deduction: STD_DEDUCTION_SINGLE }
            ].map(({ title, brackets, deduction }) => (
              <div key={title} style={{ flex: 1, minWidth: 260 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#6c63ff", marginBottom: 10 }}>{title}</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#f8f8ff" }}>
                      <th style={{ textAlign: "left", padding: "6px 10px", color: "#888", fontWeight: 600 }}>Rate</th>
                      <th style={{ textAlign: "right", padding: "6px 10px", color: "#888", fontWeight: 600 }}>Income Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brackets.map((b, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f5f5f5" }}>
                        <td style={{ padding: "5px 10px", fontFamily: "'DM Mono', monospace", color: "#1a1a2e" }}>{pct(b.rate)}</td>
                        <td style={{ padding: "5px 10px", textAlign: "right", color: "#555" }}>
                          {fmt(b.min)} – {b.max === Infinity ? "∞" : fmt(b.max)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>Standard deduction: <strong>{fmt(deduction)}</strong></div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 28, fontSize: 12, color: "#bbb" }}>
          Rough estimate only — standard deduction applied, no credits, deductions, or AMT considered. Consult a tax professional for filing decisions.
        </div>
      </div>
    </div>
  );
}
