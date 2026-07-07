// @ts-nocheck
import { useState, useEffect, useRef, useMemo } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
// Green Money Palette — deep forest base, bright mint accent, crisp whites
// Signature: live "interest ticker" + animated debt-free countdown ring
// ──────────────────────────────────────────────────────────────────────────────
const C = {
  bg:        "#0A120E",   // deep forest black-green
  surface:   "#0F1F17",   // card surface
  surface2:  "#162B1E",   // elevated card
  border:    "rgba(74,200,120,0.15)",
  green:     "#4AC878",   // mint green — primary accent
  greenDark: "#2D8F50",   // darker green
  greenGlow: "rgba(74,200,120,0.12)",
  greenDim:  "rgba(74,200,120,0.35)",
  lime:      "#A8E063",   // lime highlight
  white:     "#F0FFF4",   // tinted white
  muted:     "rgba(240,255,244,0.5)",
  faint:     "rgba(240,255,244,0.25)",
  red:       "#F05A5A",   // danger / interest owed
  redGlow:   "rgba(240,90,90,0.12)",
  amber:     "#F0B429",   // warning
  teal:      "#38BEC9",   // info
};

const fmt = (n) => n != null ? "$" + Math.round(Math.abs(n)).toLocaleString() : "—";
const fmtD = (n) => n != null ? "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
const fmtMonths = (m) => {
  if (!m || m === Infinity) return "∞";
  const y = Math.floor(m / 12), mo = m % 12;
  if (y === 0) return `${mo}mo`;
  if (mo === 0) return `${y}yr`;
  return `${y}yr ${mo}mo`;
};
const today = new Date();

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      background: ${C.bg};
      font-family: 'Inter', -apple-system, sans-serif;
      color: ${C.white};
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }
    .serif { font-family: 'DM Serif Display', Georgia, serif; }
    input[type=range] {
      -webkit-appearance: none; width: 100%; height: 3px;
      border-radius: 2px; background: ${C.surface2}; outline: none; cursor: pointer;
    }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%;
      background: ${C.green}; cursor: pointer; border: 2px solid ${C.bg};
      box-shadow: 0 0 8px ${C.greenDim};
    }
    input[type=number], input[type=text], input[type=email] {
      background: ${C.surface2}; border: 1px solid ${C.border};
      color: ${C.white}; border-radius: 8px; padding: 10px 14px;
      font-size: 15px; width: 100%; outline: none; font-family: 'Inter', sans-serif;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    input[type=number]:focus, input[type=text]:focus, input[type=email]:focus {
      border-color: ${C.green}; box-shadow: 0 0 0 3px ${C.greenGlow};
    }
    input[type=number]::-webkit-outer-spin-button,
    input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
    select {
      background: ${C.surface2}; border: 1px solid ${C.border};
      color: ${C.white}; border-radius: 8px; padding: 10px 14px;
      font-size: 15px; width: 100%; outline: none; cursor: pointer;
      font-family: 'Inter', sans-serif;
    }
    select:focus { border-color: ${C.green}; box-shadow: 0 0 0 3px ${C.greenGlow}; }
    button { cursor: pointer; font-family: 'Inter', sans-serif; }
    a { color: ${C.green}; text-decoration: none; }
    a:hover { text-decoration: underline; }
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: ${C.bg}; }
    ::-webkit-scrollbar-thumb { background: ${C.surface2}; border-radius: 3px; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
    @keyframes glow { 0%,100% { box-shadow: 0 0 12px ${C.greenDim}; } 50% { box-shadow: 0 0 28px ${C.green}; } }
    @keyframes countUp { from { transform:scale(1.06); color:${C.lime}; } to { transform:scale(1); } }
    @keyframes ringFill { from { stroke-dashoffset: 565; } }
    .fade-up { animation: fadeUp 0.4s ease both; }
    @media(max-width:650px) { .g2{grid-template-columns:1fr!important;} .g3{grid-template-columns:1fr!important;} .g4{grid-template-columns:1fr 1fr!important;} }
  `}</style>
);

// ─── SHARED UI ────────────────────────────────────────────────────────────────
const Card = ({ children, style = {}, glow = false }) => (
  <div style={{
    background: C.surface, borderRadius: 16, padding: "24px 24px",
    border: `1px solid ${glow ? C.greenDim : C.border}`,
    boxShadow: glow ? `0 0 24px ${C.greenGlow}` : "none",
    ...style,
  }}>{children}</div>
);

const Label = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: C.green, marginBottom: 7 }}>
    {children}
  </div>
);

const Big = ({ label, value, sub, color = C.green, size = 34 }) => (
  <div style={{ padding: "12px 0" }}>
    <div style={{ fontSize: 12, color: C.muted, marginBottom: 5 }}>{label}</div>
    <div className="serif" style={{ fontSize: size, fontWeight: 400, color, lineHeight: 1.1, letterSpacing: "-0.5px" }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{
    padding: "7px 16px", borderRadius: 999, fontSize: 13, fontWeight: 500,
    border: `1px solid ${active ? C.green : C.border}`,
    background: active ? C.green : "transparent",
    color: active ? C.bg : C.white,
    transition: "all 0.18s",
  }}>{label}</button>
);

const Insight = ({ icon, text, hl, color = C.green }) => (
  <div style={{
    background: `rgba(74,200,120,0.06)`, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start", marginTop: 14,
  }}>
    <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{icon}</span>
    <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
      {text}{hl && <span style={{ color, fontWeight: 600 }}> {hl}</span>}
    </div>
  </div>
);

const AffLink = ({ href, children }) => (
  <div style={{ marginTop: 14, padding: "13px 16px", background: "rgba(56,190,201,0.06)", borderRadius: 10, border: "1px solid rgba(56,190,201,0.2)", fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
    💡 <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: C.teal }}>{children}</a>
  </div>
);

const Hr = () => <div style={{ borderTop: `1px solid ${C.border}`, margin: "20px 0" }} />;

const RangeRow = ({ label, min, max, step, value, onChange, prefix = "$", suffix = "" }) => (
  <div>
    <Label>{label}</Label>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
      <span style={{ color: C.green, fontWeight: 700, fontSize: 16, minWidth: 80 }}>{prefix}{Number(value).toLocaleString()}{suffix}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.faint, marginTop: 3 }}>
      <span>{prefix}{Number(min).toLocaleString()}{suffix}</span>
      <span>{prefix}{Number(max).toLocaleString()}{suffix}</span>
    </div>
  </div>
);

const NumInput = ({ label, value, onChange, step = 1, hint }) => (
  <div>
    <Label>{label}</Label>
    <input type="number" value={value} step={step} onChange={e => onChange(Number(e.target.value))} />
    {hint && <div style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>{hint}</div>}
  </div>
);

// ─── DEBT-FREE COUNTDOWN ──────────────────────────────────────────────────────
const CountdownRing = ({ pct, size = 120, label, value, color = C.green }) => {
  const r = 46, circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 1));
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke={C.surface2} strokeWidth="7" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset 0.8s ease", filter: `drop-shadow(0 0 6px ${color})` }} />
        <text x="50" y="46" textAnchor="middle" fill={C.white} fontSize="13" fontWeight="700" fontFamily="Inter,sans-serif">{value}</text>
        <text x="50" y="60" textAnchor="middle" fill={C.muted} fontSize="8" fontFamily="Inter,sans-serif">{label}</text>
      </svg>
    </div>
  );
};

const DebtFreeCountdown = () => {
  const [debts, setDebts] = useState([
    { id: 1, name: "Credit Card", balance: 8500, rate: 22.9, payment: 350 },
    { id: 2, name: "Auto Loan", balance: 12000, rate: 7.5, payment: 280 },
    { id: 3, name: "Personal Loan", balance: 5000, rate: 14, payment: 180 },
  ]);
  const [extra, setExtra] = useState(200);
  const [tick, setTick] = useState(0);

  useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 1000); return () => clearInterval(t); }, []);

  const addDebt = () => setDebts([...debts, { id: Date.now(), name: "New Debt", balance: 3000, rate: 12, payment: 100 }]);
  const upd = (id, f, v) => setDebts(debts.map(d => d.id === id ? { ...d, [f]: v } : d));
  const rem = (id) => setDebts(debts.filter(d => d.id !== id));

  // Avalanche simulation with extra payment
  const simulate = () => {
    if (debts.length === 0) return { months: 0, totalInt: 0, freed: 0, debtFreeDate: today, perDebt: [] };
    let ds = debts.map(d => ({ ...d, balance: Number(d.balance), rate: Number(d.rate), payment: Number(d.payment), paidOff: false, monthPaidOff: null, interestPaid: 0 }));
    let extraPool = Number(extra);
    let months = 0;
    let totalInt = 0;

    while (ds.some(d => d.balance > 0) && months < 600) {
      // Sort by rate desc (avalanche)
      const sorted = [...ds].filter(d => d.balance > 0).sort((a, b) => b.rate - a.rate);
      let remainingExtra = extraPool;
      for (let d of ds) {
        if (d.balance <= 0) continue;
        const mr = d.rate / 100 / 12;
        const intCharge = d.balance * mr;
        let pmt = d.payment + (sorted[0]?.id === d.id ? remainingExtra : 0);
        const prinPaid = Math.min(pmt - intCharge, d.balance);
        d.interestPaid += intCharge;
        totalInt += intCharge;
        d.balance -= prinPaid;
        if (d.balance <= 0.01) { d.balance = 0; if (!d.paidOff) { d.paidOff = true; d.monthPaidOff = months + 1; extraPool += d.payment; } }
      }
      months++;
    }

    const debtFreeDate = new Date(today);
    debtFreeDate.setMonth(debtFreeDate.getMonth() + months);

    return { months, totalInt, debtFreeDate, perDebt: ds };
  };

  const result = useMemo(simulate, [debts, extra]);
  const totalOriginal = debts.reduce((s, d) => s + Number(d.balance), 0);
  const totalMinPayment = debts.reduce((s, d) => s + Number(d.payment), 0);

  // Without extra
  const resultNoExtra = useMemo(() => {
    if (debts.length === 0) return { months: 0, totalInt: 0 };
    let ds = debts.map(d => ({ ...d, balance: Number(d.balance), rate: Number(d.rate), payment: Number(d.payment) }));
    let months = 0, totalInt = 0;
    while (ds.some(d => d.balance > 0) && months < 600) {
      for (let d of ds) {
        if (d.balance <= 0) continue;
        const mr = d.rate / 100 / 12;
        const intCharge = d.balance * mr;
        const prinPaid = Math.min(d.payment - intCharge, d.balance);
        totalInt += intCharge;
        d.balance = Math.max(0, d.balance - prinPaid);
      }
      months++;
    }
    return { months, totalInt };
  }, [debts]);

  const monthsSaved = resultNoExtra.months - result.months;
  const interestSaved = resultNoExtra.totalInt - result.totalInt;

  // Countdown to debt-free date
  const msLeft = result.debtFreeDate - today;
  const daysLeft = Math.max(0, Math.floor(msLeft / 86400000));
  const yearsLeft = Math.floor(daysLeft / 365);
  const moLeft = Math.floor((daysLeft % 365) / 30);
  const dLeft = daysLeft % 30;

  const progressPct = result.months > 0 ? Math.min((tick % (result.months * 30 + 1)) / (result.months * 30), 1) : 0;

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 22 }}>
        <h2 className="serif" style={{ fontSize: 28, marginBottom: 8 }}>Debt-Free Countdown</h2>
        <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.6 }}>Enter your debts. Watch the clock tick toward the day you owe nothing to anyone.</p>
      </div>

      {debts.map(d => (
        <Card key={d.id} style={{ marginBottom: 12, padding: "16px 20px" }}>
          <div className="g4" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
            <div><Label>Name</Label><input type="text" value={d.name} onChange={e => upd(d.id, "name", e.target.value)} /></div>
            <div><Label>Balance ($)</Label><input type="number" value={d.balance} onChange={e => upd(d.id, "balance", e.target.value)} /></div>
            <div><Label>Rate (%)</Label><input type="number" value={d.rate} step="0.1" onChange={e => upd(d.id, "rate", e.target.value)} /></div>
            <div><Label>Min Payment ($)</Label><input type="number" value={d.payment} onChange={e => upd(d.id, "payment", e.target.value)} /></div>
            <button onClick={() => rem(d.id)} style={{ background: "rgba(240,90,90,0.12)", border: "1px solid rgba(240,90,90,0.25)", color: C.red, borderRadius: 7, padding: "10px 12px", marginTop: 18, fontSize: 15 }}>✕</button>
          </div>
        </Card>
      ))}
      <button onClick={addDebt} style={{ width: "100%", background: "transparent", border: `1px dashed ${C.greenDim}`, color: C.green, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 20 }}>+ Add a debt</button>

      <Card style={{ marginBottom: 20 }}>
        <RangeRow label="Extra monthly toward debt" min={0} max={1500} step={25} value={extra} onChange={setExtra} />
      </Card>

      {/* Countdown display */}
      <Card glow style={{ textAlign: "center", padding: "36px 24px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, marginBottom: 16 }}>Your debt-free date</div>
        <div className="serif" style={{ fontSize: 42, color: C.green, marginBottom: 4, letterSpacing: "-1px" }}>
          {result.debtFreeDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </div>
        <div style={{ color: C.muted, fontSize: 15, marginBottom: 28 }}>
          {yearsLeft > 0 && <span>{yearsLeft}yr </span>}
          {moLeft > 0 && <span>{moLeft}mo </span>}
          {dLeft > 0 && <span>{dLeft}d </span>}
          to go
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
          <CountdownRing pct={yearsLeft > 0 ? moLeft / 12 : daysLeft / 30} size={110} label="months left" value={`${moLeft + yearsLeft * 12}`} />
          <CountdownRing pct={daysLeft / (result.months * 30)} size={110} label="days left" value={daysLeft.toLocaleString()} color={C.lime} />
          <CountdownRing pct={extra / (totalMinPayment + extra || 1)} size={110} label="extra paid" value={`+${fmt(extra)}`} color={C.teal} />
        </div>
      </Card>

      <div className="g3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card><Big label="Total Debt" value={fmt(totalOriginal)} color={C.red} /></Card>
        <Card><Big label="Interest Saved with Extra" value={extra > 0 ? fmt(interestSaved) : "—"} color={C.green} sub={extra > 0 ? `${fmtMonths(monthsSaved)} sooner` : "Add extra payment"} /></Card>
        <Card><Big label="Total Interest (With Strategy)" value={fmt(result.totalInt)} color={C.amber} /></Card>
      </div>

      {result.perDebt.filter(d => d.monthPaidOff).length > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: C.green }}>🏁 Payoff Milestones</div>
          {result.perDebt.filter(d => d.monthPaidOff).sort((a, b) => a.monthPaidOff - b.monthPaidOff).map(d => {
            const dt = new Date(today); dt.setMonth(dt.getMonth() + d.monthPaidOff);
            return (
              <div key={d.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 14 }}>
                <span style={{ color: C.white }}>{d.name}</span>
                <span style={{ color: C.green, fontWeight: 600 }}>{dt.toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
              </div>
            );
          })}
        </Card>
      )}

      <AffLink href="https://www.napfa.org/financial-planning/find-a-planner">Want a real plan? Find a fee-only financial advisor at NAPFA.org →</AffLink>
    </div>
  );
};

// ─── FINANCIAL TRIAGE ─────────────────────────────────────────────────────────
const TriageCalc = () => {
  const [debts, setDebts] = useState([
    { id: 1, name: "Credit Card", balance: 8500, rate: 22.9, payment: 200 },
    { id: 2, name: "Auto Loan", balance: 15000, rate: 7.5, payment: 320 },
    { id: 3, name: "Mortgage", balance: 285000, rate: 6.56, payment: 1942 },
  ]);
  const [extra, setExtra] = useState(300);
  const [method, setMethod] = useState("avalanche");

  const addDebt = () => setDebts([...debts, { id: Date.now(), name: "New Debt", balance: 5000, rate: 10, payment: 150 }]);
  const upd = (id, f, v) => setDebts(debts.map(d => d.id === id ? { ...d, [f]: v } : d));
  const rem = (id) => setDebts(debts.filter(d => d.id !== id));

  const sorted = [...debts].sort((a, b) => method === "avalanche" ? b.rate - a.rate : a.balance - b.balance);
  const totalDebt = debts.reduce((s, d) => s + Number(d.balance), 0);
  const totalMonthly = debts.reduce((s, d) => s + Number(d.payment), 0);
  const annualInterest = debts.reduce((s, d) => s + (Number(d.balance) * Number(d.rate) / 100), 0);

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 22 }}>
        <h2 className="serif" style={{ fontSize: 28, marginBottom: 8 }}>Financial Triage</h2>
        <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.6 }}>Every debt fighting for your money — here's who wins and who to attack first.</p>
      </div>

      {debts.map(d => (
        <Card key={d.id} style={{ marginBottom: 12, padding: "16px 20px" }}>
          <div className="g4" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
            <div><Label>Name</Label><input type="text" value={d.name} onChange={e => upd(d.id, "name", e.target.value)} /></div>
            <div><Label>Balance ($)</Label><input type="number" value={d.balance} onChange={e => upd(d.id, "balance", e.target.value)} /></div>
            <div><Label>Rate (%)</Label><input type="number" value={d.rate} step="0.1" onChange={e => upd(d.id, "rate", e.target.value)} /></div>
            <div><Label>Min Payment</Label><input type="number" value={d.payment} onChange={e => upd(d.id, "payment", e.target.value)} /></div>
            <button onClick={() => rem(d.id)} style={{ background: "rgba(240,90,90,0.12)", border: "1px solid rgba(240,90,90,0.25)", color: C.red, borderRadius: 7, padding: "10px 12px", marginTop: 18, fontSize: 15 }}>✕</button>
          </div>
        </Card>
      ))}
      <button onClick={addDebt} style={{ width: "100%", background: "transparent", border: `1px dashed ${C.greenDim}`, color: C.green, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 20 }}>+ Add a debt</button>

      <Card style={{ marginBottom: 20 }}>
        <div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <RangeRow label="Extra monthly available" min={0} max={2000} step={25} value={extra} onChange={setExtra} />
          <div>
            <Label>Strategy</Label>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <Pill label="Avalanche (save most $)" active={method === "avalanche"} onClick={() => setMethod("avalanche")} />
              <Pill label="Snowball (quick wins)" active={method === "snowball"} onClick={() => setMethod("snowball")} />
            </div>
            <div style={{ fontSize: 12, color: C.faint, marginTop: 8 }}>
              {method === "avalanche" ? "Highest rate first — mathematically optimal." : "Smallest balance first — psychologically powerful."}
            </div>
          </div>
        </div>
      </Card>

      <div className="g3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        <Card><Big label="Total Debt" value={fmt(totalDebt)} color={C.red} /></Card>
        <Card><Big label="Monthly Minimums" value={fmt(totalMonthly)} color={C.white} /></Card>
        <Card><Big label="Interest/Year If You Do Nothing" value={fmt(annualInterest)} color={C.red} sub="Your cost of inaction" /></Card>
      </div>

      <Card>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Attack Order</div>
        {sorted.map((d, i) => (
          <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderBottom: i < sorted.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, background: i === 0 ? C.green : C.surface2, color: i === 0 ? C.bg : C.white, boxShadow: i === 0 ? `0 0 10px ${C.greenDim}` : "none" }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{d.name}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{fmt(d.balance)} @ {d.rate}% APR</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: C.red, fontWeight: 600 }}>{fmt(d.balance * d.rate / 100 / 12)}/mo</div>
              <div style={{ fontSize: 11, color: C.faint }}>in interest</div>
            </div>
            {i === 0 && <div style={{ background: C.green, color: C.bg, borderRadius: 6, padding: "3px 9px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>ATTACK FIRST</div>}
          </div>
        ))}
        {extra > 0 && sorted[0] && (
          <Insight icon="⚡" text={`Put ${fmt(extra)}/mo extra toward "${sorted[0].name}" first — saves roughly`} hl={fmt(sorted[0].balance * sorted[0].rate / 100 / 12 * 10) + " in interest."} />
        )}
      </Card>

      <AffLink href="https://www.napfa.org/financial-planning/find-a-planner">Want a pro to review your full picture? Find a fee-only advisor at NAPFA.org →</AffLink>
    </div>
  );
};

// ─── MORTGAGE REALITY ─────────────────────────────────────────────────────────
const MortgageCalc = () => {
  const [price, setPrice] = useState(350000);
  const [down, setDown] = useState(20);
  const [rate, setRate] = useState(6.56);
  const [term, setTerm] = useState(30);
  const [income, setIncome] = useState(78000);
  const [extraPayment, setExtraPayment] = useState(0);
  const [tab, setTab] = useState("afford");

  const loan = price * (1 - down / 100);
  const mr = rate / 100 / 12;
  const n = term * 12;
  const pmt = mr === 0 ? loan / n : loan * (mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1);
  const pmi = down < 20 ? loan * 0.01 / 12 : 0;
  const ins = price * 0.005 / 12;
  const tax = price * 0.012 / 12;
  const totalMonthly = pmt + pmi + ins + tax;
  const grossMonthly = income / 12;
  const hRatio = totalMonthly / grossMonthly;
  const status = hRatio <= 0.28 ? "comfortable" : hRatio <= 0.36 ? "stretching" : "overextended";
  const statusColor = { comfortable: C.green, stretching: C.amber, overextended: C.red };
  const statusLabel = { comfortable: "✅ Comfortable", stretching: "⚠️ Stretching", overextended: "🚨 Overextended" };
  const totalInt = pmt * n - loan;
  const trueCost = price + totalInt;

  const calcWithExtra = (ex) => {
    if (ex === 0) return { months: n, interest: totalInt };
    let bal = loan, ti = 0, mo = 0;
    while (bal > 0.01 && mo < n * 2) {
      const ip = bal * mr; const pp = Math.min(pmt + ex - ip, bal);
      ti += ip; bal -= pp; mo++;
    }
    return { months: mo, interest: ti };
  };
  const withEx = calcWithExtra(extraPayment);
  const intSaved = totalInt - withEx.interest;
  const moSaved = n - withEx.months;

  const debtFreeDate = new Date(today); debtFreeDate.setMonth(debtFreeDate.getMonth() + withEx.months);

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 22 }}>
        <h2 className="serif" style={{ fontSize: 28, marginBottom: 8 }}>Mortgage Reality Check</h2>
        <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.6 }}>The full picture on what that house actually costs — and how to own it years sooner.</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[["afford","Can I Afford It?"],["payoff","Pay Off Faster"],["truecost","True Cost"]].map(([id, lbl]) => (
          <Pill key={id} label={lbl} active={tab === id} onClick={() => setTab(id)} />
        ))}
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <NumInput label="Home Price" value={price} onChange={setPrice} step={5000} />
          <div>
            <Label>Down Payment ({down}%)</Label>
            <input type="range" min={3} max={50} step={1} value={down} onChange={e => setDown(Number(e.target.value))} style={{ marginTop: 8 }} />
            <div style={{ color: C.green, fontWeight: 700, marginTop: 4 }}>{down}% — {fmt(price * down / 100)} down</div>
          </div>
          <div>
            <Label>Interest Rate (%) — Today's avg: 6.56%</Label>
            <input type="number" value={rate} step="0.01" onChange={e => setRate(Number(e.target.value))} />
          </div>
          <div>
            <Label>Loan Term</Label>
            <select value={term} onChange={e => setTerm(Number(e.target.value))}>
              <option value={30}>30 Years</option>
              <option value={20}>20 Years</option>
              <option value={15}>15 Years</option>
              <option value={10}>10 Years</option>
            </select>
          </div>
          {tab === "afford" && <NumInput label="Annual Household Income" value={income} onChange={setIncome} step={1000} />}
          {tab === "payoff" && (
            <div>
              <RangeRow label="Extra monthly payment" min={0} max={3000} step={50} value={extraPayment} onChange={setExtraPayment} />
            </div>
          )}
        </div>
      </Card>

      {tab === "afford" && (
        <div className="fade-up">
          <div className="g3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Card><Big label="Principal & Interest" value={fmt(pmt)} sub="/month" /></Card>
            <Card><Big label="Full PITI Payment" value={fmt(totalMonthly)} sub="w/ tax, insurance, PMI" color={C.teal} /></Card>
            <Card><Big label="Affordability" value={statusLabel[status]} color={statusColor[status]} sub={`${Math.round(hRatio * 100)}% of gross income`} size={22} /></Card>
          </div>
          {down < 20 && <Insight icon="🔒" text="You're below 20% down — PMI applies at roughly" hl={fmt(pmi) + "/mo until you reach 20% equity."} color={C.amber} />}
          {status === "overextended" && <Insight icon="🚨" text="At your income, the 28% guideline puts your comfortable max at" hl={fmt(grossMonthly * 0.28) + "/mo. Consider a lower price or larger down payment."} color={C.red} />}
          <AffLink href="https://www.credible.com/mortgage">Compare mortgage rates from 20+ lenders at Credible →</AffLink>
        </div>
      )}
      {tab === "payoff" && (
        <div className="fade-up">
          <div className="g3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Card><Big label="Standard Payoff" value={fmtMonths(n)} sub={fmt(totalInt) + " total interest"} color={C.white} /></Card>
            <Card><Big label="With Extra Payments" value={fmtMonths(withEx.months)} sub={extraPayment > 0 ? fmt(withEx.interest) + " total interest" : "Set extra above"} color={C.green} /></Card>
            <Card><Big label="Interest Saved" value={extraPayment > 0 ? fmt(intSaved) : "—"} sub={moSaved > 0 ? fmtMonths(moSaved) + " sooner" : ""} color={C.lime} /></Card>
          </div>
          {extraPayment > 0 && (
            <>
              <Insight icon="🏆" text={`Adding ${fmt(extraPayment)}/mo saves`} hl={fmt(intSaved) + ` and your mortgage is paid off ${fmtMonths(moSaved)} sooner — by ${debtFreeDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}.`} />
              <AffLink href="https://www.bankrate.com/mortgages/mortgage-rates/">Compare today's refinance rates at Bankrate →</AffLink>
            </>
          )}
        </div>
      )}
      {tab === "truecost" && (
        <div className="fade-up">
          <div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Card><Big label="Purchase Price" value={fmt(price)} color={C.white} /></Card>
            <Card><Big label="Total Interest Over Loan Life" value={fmt(totalInt)} color={C.red} /></Card>
            <Card><Big label="True Cost of This Home" value={fmt(trueCost)} color={C.red} sub="What you actually pay" /></Card>
            <Card><Big label="Interest as % of Purchase Price" value={Math.round(totalInt / price * 100) + "%"} color={C.amber} sub="What the bank earns on you" /></Card>
          </div>
          <Insight icon="💡" text={`At ${rate}% over ${term} years, the bank earns`} hl={fmt(totalInt) + " — that's " + Math.round(totalInt / price * 100) + "% of what you paid for the house."} />
          <AffLink href="https://www.credible.com/mortgage">See if a lower rate could save you thousands — compare at Credible →</AffLink>
        </div>
      )}
    </div>
  );
};

// ─── COST OF WAITING ──────────────────────────────────────────────────────────
const CostOfWaiting = () => {
  const [balance, setBalance] = useState(12000);
  const [apr, setApr] = useState(22.9);
  const [payment, setPayment] = useState(350);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (running) ref.current = setInterval(() => setElapsed(e => e + 0.1), 100);
    else clearInterval(ref.current);
    return () => clearInterval(ref.current);
  }, [running]);

  const reset = () => { setRunning(false); setElapsed(0); };
  const perSec = (balance * apr / 100) / 365 / 86400;
  const accrued = perSec * elapsed;
  const daily = balance * apr / 100 / 365;
  const annual = daily * 365;

  const mr = apr / 100 / 12;
  const calcMo = (bal, pmt) => { if (pmt <= bal * mr) return Infinity; return Math.ceil(Math.log(pmt / (pmt - bal * mr)) / Math.log(1 + mr)); };
  const moStd = calcMo(balance, payment);
  const totalPaid = moStd !== Infinity ? payment * moStd : Infinity;
  const totalInt = moStd !== Infinity ? totalPaid - balance : Infinity;
  const moPlus = calcMo(balance, payment + 100);
  const intPlus = moPlus !== Infinity ? (payment + 100) * moPlus - balance : Infinity;

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 22 }}>
        <h2 className="serif" style={{ fontSize: 28, marginBottom: 8 }}>Cost of Waiting</h2>
        <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.6 }}>Press start and watch your interest accumulate in real time. Every second you wait costs you money.</p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div className="g3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
          <NumInput label="Balance ($)" value={balance} onChange={v => { setBalance(v); reset(); }} />
          <NumInput label="APR (%)" value={apr} onChange={v => { setApr(v); reset(); }} step={0.1} />
          <NumInput label="Monthly Payment ($)" value={payment} onChange={v => { setPayment(v); reset(); }} />
        </div>
      </Card>

      <Card glow style={{ textAlign: "center", padding: "44px 24px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, marginBottom: 16 }}>Interest accumulating on your balance right now</div>
        <div className="serif" style={{ fontSize: 68, color: C.red, letterSpacing: "-2px", fontVariantNumeric: "tabular-nums", lineHeight: 1, marginBottom: 8, textShadow: `0 0 40px rgba(240,90,90,0.4)` }}>
          ${accrued.toFixed(4)}
        </div>
        <div style={{ color: C.faint, fontSize: 14, marginBottom: 28 }}>
          {elapsed > 0 ? `${elapsed.toFixed(1)} seconds elapsed` : "Hit Start — feel what inaction costs"}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={() => setRunning(r => !r)} style={{ background: running ? C.red : C.green, color: running ? C.white : C.bg, border: "none", borderRadius: 10, padding: "13px 36px", fontWeight: 700, fontSize: 16, boxShadow: running ? `0 0 20px rgba(240,90,90,0.4)` : `0 0 20px ${C.greenDim}`, transition: "all 0.2s" }}>
            {running ? "⏸ Pause" : "▶ Start"}
          </button>
          <button onClick={reset} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.white, borderRadius: 10, padding: "13px 24px", fontSize: 16 }}>↺ Reset</button>
        </div>
      </Card>

      <div className="g3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card><Big label="Interest Per Day" value={"$" + daily.toFixed(2)} color={C.red} /></Card>
        <Card><Big label="Interest Per Year (No Extra)" value={fmt(annual)} color={C.red} /></Card>
        <Card><Big label="Total Interest (Min Payments)" value={moStd === Infinity ? "Never paid off" : fmt(totalInt)} color={C.red} sub={moStd !== Infinity ? fmtMonths(moStd) + " to pay off" : "Payment too low"} /></Card>
      </div>

      {moStd !== Infinity && moPlus !== Infinity && (
        <Insight icon="🔥" text="Adding just $100/mo saves you" hl={fmt(totalInt - intPlus) + ` and cuts ${fmtMonths(moStd - moPlus)} off your payoff.`} />
      )}
      <AffLink href="https://www.nerdwallet.com/best/credit-cards/balance-transfer">Stop the clock — compare 0% balance transfer cards at NerdWallet →</AffLink>
    </div>
  );
};

// ─── CREDIT SCORE IMPACT ─────────────────────────────────────────────────────
const CreditScore = () => {
  const [score, setScore] = useState(680);
  const [util, setUtil] = useState(45);
  const [lateCount, setLateCount] = useState(1);
  const [accountAge, setAccountAge] = useState(4);
  const [newCredit, setNewCredit] = useState(2);
  const [mixTypes, setMixTypes] = useState(2);

  // Score factors (simplified model)
  const utilImpact = util <= 10 ? 0 : util <= 30 ? -15 : util <= 50 ? -40 : util <= 75 ? -80 : -120;
  const lateImpact = lateCount === 0 ? 0 : lateCount === 1 ? -60 : lateCount <= 3 ? -100 : -150;
  const ageImpact = accountAge >= 7 ? 20 : accountAge >= 4 ? 0 : accountAge >= 2 ? -20 : -50;
  const newCreditImpact = newCredit <= 1 ? 0 : newCredit <= 3 ? -15 : -30;

  const projected = Math.max(300, Math.min(850, score - utilImpact + ageImpact - newCreditImpact + (lateImpact * 0.1)));
  const optimized = Math.max(300, Math.min(850, score + Math.abs(utilImpact) * 0.5 + 30));

  const band = (s) => s >= 800 ? ["Exceptional", C.lime] : s >= 740 ? ["Very Good", C.green] : s >= 670 ? ["Good", C.teal] : s >= 580 ? ["Fair", C.amber] : ["Poor", C.red];
  const [bLabel, bColor] = band(score);
  const [oLabel, oColor] = band(optimized);

  const ScoreBar = ({ s, label, color }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
        <span style={{ color: C.muted }}>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{Math.round(s)} — {band(s)[0]}</span>
      </div>
      <div style={{ height: 10, borderRadius: 5, background: C.surface2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${((s - 300) / 550) * 100}%`, background: color, borderRadius: 5, transition: "width 0.6s ease", boxShadow: `0 0 8px ${color}` }} />
      </div>
    </div>
  );

  // Rate savings from better score
  const rateDiff = score < 670 ? 1.5 : score < 740 ? 0.75 : score < 800 ? 0.25 : 0;
  const loanAmt = 300000;
  const mr1 = (6.56 + rateDiff) / 100 / 12, mr2 = 6.56 / 100 / 12;
  const n = 360;
  const pmt1 = loanAmt * (mr1 * Math.pow(1 + mr1, n)) / (Math.pow(1 + mr1, n) - 1);
  const pmt2 = loanAmt * (mr2 * Math.pow(1 + mr2, n)) / (Math.pow(1 + mr2, n) - 1);
  const rateSavings = (pmt1 - pmt2) * n;

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 22 }}>
        <h2 className="serif" style={{ fontSize: 28, marginBottom: 8 }}>Credit Score Impact</h2>
        <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.6 }}>See what's dragging your score down, what improving it saves you, and the exact moves to make.</p>
      </div>

      <div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card>
          <Label>Your Current Score (300–850)</Label>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
            <div className="serif" style={{ fontSize: 52, color: bColor, lineHeight: 1 }}>{score}</div>
            <div style={{ fontSize: 14, color: bColor, fontWeight: 600 }}>{bLabel}</div>
          </div>
          <input type="range" min={300} max={850} step={5} value={score} onChange={e => setScore(Number(e.target.value))} />
        </Card>
        <Card>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>What improving your score saves on a $300K mortgage:</div>
          <Big label="Rate Penalty vs. 800+ Score" value={rateDiff > 0 ? `+${rateDiff}%` : "You're at top tier"} color={rateDiff > 0 ? C.red : C.green} size={28} />
          <Big label="Extra Interest Over 30 Years" value={rateSavings > 0 ? fmt(rateSavings) : "Optimal"} color={rateDiff > 0 ? C.red : C.green} size={24} sub={rateDiff > 0 ? "vs. someone with 800+" : ""} />
        </Card>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 18, color: C.green }}>Score Factors — adjust to see impact</div>
        <div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <Label>Credit Utilization: {util}%</Label>
            <input type="range" min={0} max={100} step={1} value={util} onChange={e => setUtil(Number(e.target.value))} style={{ marginTop: 8 }} />
            <div style={{ fontSize: 12, color: util <= 30 ? C.green : util <= 60 ? C.amber : C.red, marginTop: 4 }}>
              {util <= 10 ? "🟢 Excellent (under 10%)" : util <= 30 ? "🟢 Good (under 30%)" : util <= 50 ? "🟡 Fair — reduce this" : "🔴 High — biggest drag on your score"}
            </div>
          </div>
          <div>
            <Label>Late Payments (last 2 years)</Label>
            <select value={lateCount} onChange={e => setLateCount(Number(e.target.value))}>
              <option value={0}>None — perfect payment history</option>
              <option value={1}>1 late payment</option>
              <option value={2}>2–3 late payments</option>
              <option value={4}>4+ late payments</option>
            </select>
          </div>
          <div>
            <Label>Average Account Age (years)</Label>
            <input type="range" min={0} max={20} step={0.5} value={accountAge} onChange={e => setAccountAge(Number(e.target.value))} style={{ marginTop: 8 }} />
            <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{accountAge} years average age</div>
          </div>
          <div>
            <Label>New Credit Inquiries (last 12mo)</Label>
            <select value={newCredit} onChange={e => setNewCredit(Number(e.target.value))}>
              <option value={0}>0 — no new applications</option>
              <option value={1}>1 inquiry</option>
              <option value={2}>2–3 inquiries</option>
              <option value={5}>4+ inquiries</option>
            </select>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 18 }}>Your Score vs. Optimized</div>
        <ScoreBar s={score} label="Current score" color={bColor} />
        <ScoreBar s={optimized} label="Optimized score (30–90 days)" color={oColor} />
        <Hr />
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: C.green }}>Your Action Plan</div>
        {util > 30 && <Insight icon="💳" text={`Reduce utilization below 30% — currently at ${util}%. Pay down balances or request a credit limit increase.`} hl="" />}
        {lateCount > 0 && <Insight icon="📅" text="Set up autopay for all accounts. One on-time payment streak rebuilds history — time is the only fix for past lates." hl="" color={C.amber} />}
        {newCredit >= 2 && <Insight icon="🛑" text="Stop applying for new credit for at least 6 months. Each hard inquiry costs 5–10 points and signals risk to lenders." hl="" color={C.amber} />}
        {util <= 10 && lateCount === 0 && newCredit <= 1 && <Insight icon="🏆" text="Your profile looks strong. Focus on keeping utilization low and payment history perfect." hl="" />}
      </Card>

      <AffLink href="https://www.experian.com/consumer-products/score-boost.html">Experian Boost can raise your score instantly using bills you already pay →</AffLink>
    </div>
  );
};

// ─── RENT VS BUY ─────────────────────────────────────────────────────────────
const RentVsBuy = () => {
  const [rent, setRent] = useState(1800);
  const [homePrice, setHomePrice] = useState(320000);
  const [down, setDown] = useState(20000);
  const [rate, setRate] = useState(6.56);
  const [years, setYears] = useState(7);
  const [apprec, setApprec] = useState(3);
  const [rentInc, setRentInc] = useState(3);

  const loan = homePrice - down;
  const mr = rate / 100 / 12;
  const n = 30 * 12;
  const pmt = mr === 0 ? loan / n : loan * (mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1);
  const closing = homePrice * 0.03;

  let buyCost = down + closing, bal = loan, equity = down;
  for (let i = 0; i < years * 12; i++) {
    const ip = bal * mr, pp = pmt - ip;
    bal -= pp; equity += pp;
    buyCost += pmt + (homePrice * 0.01 / 12);
  }
  const fv = homePrice * Math.pow(1 + apprec / 100, years);
  const proceeds = fv * 0.94 - bal;
  const netBuy = buyCost - proceeds;

  let rentCost = 0, r = rent;
  for (let i = 0; i < years; i++) { rentCost += r * 12; r *= (1 + rentInc / 100); }

  const winner = netBuy < rentCost ? "buy" : "rent";
  const diff = Math.abs(netBuy - rentCost);

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 22 }}>
        <h2 className="serif" style={{ fontSize: 28, marginBottom: 8 }}>Rent vs. Buy</h2>
        <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.6 }}>Honest math over your actual timeline — not a generic 30-year assumption.</p>
      </div>
      <Card style={{ marginBottom: 20 }}>
        <div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <NumInput label="Monthly Rent" value={rent} onChange={setRent} />
          <NumInput label="Home Price" value={homePrice} onChange={setHomePrice} step={5000} />
          <NumInput label="Down Payment" value={down} onChange={setDown} step={5000} />
          <NumInput label="Mortgage Rate (%)" value={rate} onChange={setRate} step={0.01} />
          <div>
            <RangeRow label="How Long You'll Stay" min={1} max={30} step={1} value={years} onChange={setYears} prefix="" suffix=" years" />
          </div>
          <NumInput label="Home Appreciation (%/yr)" value={apprec} onChange={setApprec} step={0.5} />
        </div>
      </Card>
      <div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card style={{ border: winner === "buy" ? `1px solid ${C.green}` : `1px solid ${C.border}`, boxShadow: winner === "buy" ? `0 0 20px ${C.greenGlow}` : "none" }}>
          <Big label={`Net Cost to Buy (${years} yrs)`} value={fmt(netBuy)} color={winner === "buy" ? C.green : C.white} sub={winner === "buy" ? "✅ Better choice" : ""} />
        </Card>
        <Card style={{ border: winner === "rent" ? `1px solid ${C.green}` : `1px solid ${C.border}`, boxShadow: winner === "rent" ? `0 0 20px ${C.greenGlow}` : "none" }}>
          <Big label={`Total Cost to Rent (${years} yrs)`} value={fmt(rentCost)} color={winner === "rent" ? C.green : C.white} sub={winner === "rent" ? "✅ Better choice" : ""} />
        </Card>
      </div>
      <Insight icon={winner === "buy" ? "🏠" : "🔑"} text={winner === "buy" ? `Over ${years} years, buying saves roughly` : `Over ${years} years, renting saves roughly`} hl={fmt(diff) + (winner === "rent" ? ". Short timelines favor renting — closing costs need time to amortize." : ". Equity build and appreciation tip the balance toward buying.")} />
      <AffLink href="https://www.bankrate.com/mortgages/mortgage-rates/">Ready to buy? Compare today's mortgage rates at Bankrate →</AffLink>
    </div>
  );
};

// ─── EMAIL CAPTURE ────────────────────────────────────────────────────────────
const EmailCapture = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <Card style={{ background: `linear-gradient(135deg, ${C.surface} 0%, rgba(74,200,120,0.08) 100%)`, marginTop: 36 }}>
      {!sent ? (
        <>
          <div className="serif" style={{ fontSize: 22, marginBottom: 8 }}>Get your debt-free date in your inbox</div>
          <p style={{ fontSize: 14, color: C.muted, marginBottom: 18, lineHeight: 1.6 }}>Enter your email and we'll send you a monthly progress update — your savings, your milestones, your countdown. Free, forever.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
            <button onClick={() => email.includes("@") && setSent(true)} style={{ background: C.green, color: C.bg, border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, fontSize: 15 }}>Get My Date →</button>
          </div>
          <div style={{ fontSize: 11, color: C.faint, marginTop: 10 }}>No spam. Unsubscribe anytime. Your data stays yours.</div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
          <div className="serif" style={{ fontSize: 22, color: C.green, marginBottom: 6 }}>You're on the list.</div>
          <div style={{ color: C.muted, fontSize: 14 }}>Your first debt-free update is on its way.</div>
        </div>
      )}
    </Card>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const TOOLS = [
  { id: "countdown", label: "Debt-Free Countdown", icon: "⏳", sub: "Your exact payoff date" },
  { id: "triage", label: "Financial Triage", icon: "🎯", sub: "Which debt to attack first" },
  { id: "mortgage", label: "Mortgage Reality", icon: "🏠", sub: "Afford it? Pay it faster?" },
  { id: "waiting", label: "Cost of Waiting", icon: "⏱", sub: "Live interest counter" },
  { id: "credit", label: "Credit Score Impact", icon: "📊", sub: "What your score costs you" },
  { id: "rentvbuy", label: "Rent vs. Buy", icon: "⚖️", sub: "Honest math, your timeline" },
];

export default function App() {
  const [active, setActive] = useState("countdown");
  return (
    <>
      <GlobalStyle />
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "0 18px 80px" }}>

        {/* HERO */}
        <div style={{ paddingTop: 56, paddingBottom: 44, textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.greenGlow, border: `1px solid ${C.greenDim}`, borderRadius: 999, padding: "6px 18px", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: C.green, marginBottom: 22 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, display: "inline-block", animation: "pulse 1.5s infinite" }} />
            Free financial clarity tools
          </div>
          <h1 className="serif" style={{ fontSize: "clamp(34px, 6vw, 60px)", fontWeight: 400, lineHeight: 1.1, marginBottom: 18, letterSpacing: "-1px" }}>
            The money math<br />
            <span style={{ color: C.green }}>the banks don't show you.</span>
          </h1>
          <p style={{ fontSize: 17, color: C.muted, maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
            Six tools that cut through the noise — your real payoff date, your credit score's true cost, what waiting is costing you right now.
          </p>
        </div>

        {/* TOOL GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 30 }}>
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => setActive(t.id)} style={{
              background: active === t.id ? C.green : C.surface,
              border: `1px solid ${active === t.id ? C.green : C.border}`,
              borderRadius: 12, padding: "16px 12px", textAlign: "left",
              color: active === t.id ? C.bg : C.white,
              transition: "all 0.18s",
              boxShadow: active === t.id ? `0 0 20px ${C.greenGlow}` : "none",
            }}>
              <div style={{ fontSize: 20, marginBottom: 7 }}>{t.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3, marginBottom: 3 }}>{t.label}</div>
              <div style={{ fontSize: 11, opacity: 0.65 }}>{t.sub}</div>
            </button>
          ))}
        </div>

        {/* CALCULATOR */}
        <Card style={{ padding: "30px 30px" }}>
          {active === "countdown" && <DebtFreeCountdown />}
          {active === "triage" && <TriageCalc />}
          {active === "mortgage" && <MortgageCalc />}
          {active === "waiting" && <CostOfWaiting />}
          {active === "credit" && <CreditScore />}
          {active === "rentvbuy" && <RentVsBuy />}
        </Card>

        <EmailCapture />

        <div style={{ marginTop: 24, fontSize: 11, color: C.faint, textAlign: "center", lineHeight: 1.7 }}>
          Some links are affiliate links — we may earn a commission at no cost to you. All results are estimates for informational purposes only and do not constitute financial advice. Consult a licensed financial professional for your specific situation.
        </div>
      </div>
    </>
  );
}
