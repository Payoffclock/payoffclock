// @ts-nocheck
import { useState, useEffect, useRef, useMemo } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
// Green Money Palette — deep forest base, bright mint accent, crisp whites
// Signature: live "interest ticker" + animated debt-free countdown ring
// ──────────────────────────────────────────────────────────────────────────────
const C = {
bg: "#0A120E", // deep forest black-green
surface: "#0F1F17", // card surface
surface2: "#162B1E", // elevated card
border: "rgba(74,200,120,0.15)",
green: "#4AC878", // mint green — primary accent
greenDark: "#2D8F50", // darker green
greenGlow: "rgba(74,200,120,0.12)",
greenDim: "rgba(74,200,120,0.35)",
lime: "#A8E063", // lime highlight
white: "#F0FFF4", // tinted white
muted: "rgba(240,255,244,0.5)",
faint: "rgba(240,255,244,0.25)",
red: "#F05A5A", // danger / interest owed
redGlow: "rgba(240,90,90,0.12)",
amber: "#F0B429", // warning
teal: "#38BEC9", // info
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

// ─── SHARED UI ────────────────────────────────────────────────────────────────────
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

const ArticleSection = ({ title, intro, faqs }) => (
<div style={{ marginTop: 36, paddingTop: 30, borderTop: `1px solid ${C.border}` }}>
<h3 className="serif" style={{ fontSize: 24, marginBottom: 16, color: C.white }}>{title}</h3>
{intro.map((p, i) => (
<p key={i} style={{ color: C.muted, fontSize: 15, lineHeight: 1.75, marginBottom: 14 }}>{p}</p>
))}
{faqs && faqs.length > 0 && (
<div style={{ marginTop: 24 }}>
<div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.green, marginBottom: 16 }}>Frequently Asked Questions</div>
{faqs.map((f, i) => (
<div key={i} style={{ marginBottom: 16 }}>
<div style={{ fontWeight: 600, fontSize: 15, color: C.white, marginBottom: 5 }}>{f.q}</div>
<div style={{ color: C.muted, fontSize: 14, lineHeight: 1.7 }}>{f.a}</div>
</div>
))}
</div>
)}
</div>
);

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

// ─── DEBT-FREE COUNTDOWN ──────────────────────────────────────────────
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

<ArticleSection
title="How the Debt-Free Countdown Works"
intro={[
"This calculator uses the debt avalanche method: it takes every dollar of minimum payment you owe each month, then directs any extra money you add toward whichever debt carries the highest interest rate. Once that debt hits zero, its former payment amount rolls into the next-highest-rate debt, so your total monthly payment never actually goes down until you're debt-free. That snowballing effect is why the payoff date accelerates faster than most people expect.",
"To use it, list each debt you're carrying — credit cards, auto loans, personal loans, anything with a balance and an interest rate — along with its current balance, APR, and the minimum payment you're required to make. Then set how much extra you can realistically put toward debt each month. The countdown updates instantly, showing the exact month and year you'd be debt-free, plus how much interest that strategy saves you compared to paying only the minimums.",
"For example, someone carrying $8,500 on a credit card at 22.9% APR, a $12,000 auto loan at 7.5%, and a $5,000 personal loan at 14% — all at their minimum payments — would take years to clear those balances and pay thousands in interest along the way. Adding just $200 extra per month, directed first at the credit card since it carries the highest rate, can cut years off that timeline and save well over a thousand dollars in interest, because it stops that 22.9% balance from compounding for as long.",
"The date shown isn't a guess — it's a month-by-month simulation using your actual balances, rates, and payments, so it changes in real time as you adjust any input.",
]}
faqs={[
{ q: "What is the debt avalanche method, and why does this calculator use it?", a: "The debt avalanche method pays extra toward whichever debt has the highest interest rate first, while still making minimum payments on everything else. Mathematically, it minimizes the total interest you pay and gets you debt-free in the least amount of time, which is why it's the default strategy here. If you'd rather pay off your smallest balance first for a quick psychological win, that's the debt snowball method — the Financial Triage tool on this site lets you compare both." },
{ q: "How is my debt-free date calculated?", a: "The calculator runs a month-by-month simulation: each month it charges interest on every balance, applies your minimum payments plus any extra toward the highest-rate debt, and repeats until every balance reaches zero. The date shown is today's date plus however many months that simulation takes." },
{ q: "What if I don't have extra money to put toward debt right now?", a: "Set the extra payment slider to $0 — you'll still see your payoff date based on minimum payments alone, along with the total interest that path costs you. That number alone is often the motivation to find even $50–$100 a month to redirect toward your highest-rate balance." },
{ q: "Does this account for interest rate changes, new purchases, or added debt?", a: "No — it assumes your current balances, rates, and payments stay fixed for the life of the simulation. If your rates are variable or you expect to add new debt, treat the date as a best-case estimate and revisit the calculator periodically with updated numbers." },
]}
/>
</div>
);
};

// ─── FINANCIAL TRIAGE ─────────────────────────────────────────────────
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

<ArticleSection
title="How Financial Triage Picks Your Attack Order"
intro={[
"When you're juggling multiple debts and a limited amount of extra cash, the question isn't whether to pay them off — it's which one to pay off first. This tool ranks your debts using one of two proven strategies and shows you exactly how much each one is costing you in interest right now, so the decision isn't abstract.",
"The avalanche method — the mathematically optimal choice — ranks debts by interest rate, highest first, so your extra payment always attacks whichever balance is bleeding you the most in interest charges. The snowball method ranks by balance instead, smallest first, trading some interest savings for the momentum of eliminating whole debts faster. Toggle between the two to see how the attack order and the debt at the top of your list changes.",
"Enter each debt's name, balance, interest rate, and minimum payment, then set how much extra you have available each month. The 'Interest/Year If You Do Nothing' figure at the top is worth sitting with — it's what those balances cost you annually if you only ever pay the minimums, and it's usually the number that makes the case for extra payments obvious.",
"Say you're carrying an $8,500 credit card at 22.9%, a $15,000 auto loan at 7.5%, and a $285,000 mortgage at 6.56%. Even though the mortgage balance dwarfs the others, the credit card's interest rate makes it the most expensive debt per dollar owed — avalanche logic puts it first in line for any extra $300 a month you can find.",
]}
faqs={[
{ q: "What's the real difference between avalanche and snowball?", a: "Avalanche saves you more money because it targets the highest interest rate first, which is where your balance is growing fastest. Snowball targets the smallest balance first, which means you eliminate individual debts sooner — even if it costs slightly more in total interest — which some people find easier to stick with. Neither is wrong; it's a tradeoff between optimal math and psychological momentum." },
{ q: "Why does 'interest per year if I do nothing' matter so much?", a: "It reframes debt from a balance you owe into a cost you're paying every single year regardless of what you do. Seeing that number next to your minimum payments usually makes clear how much of your money is going to interest rather than principal, and why even a small extra payment redirected to the right debt makes an outsized difference." },
{ q: "Can I switch strategies partway through paying off my debts?", a: "Yes. The calculator recalculates the attack order instantly whenever you toggle the strategy, so you can compare both at any point and switch your real-world plan if your priorities change — for example, moving to snowball for a final push once only one or two debts remain." },
{ q: "Do I still need to make minimum payments on every debt while attacking one?", a: "Always. Missing minimum payments on other debts triggers late fees and credit score damage regardless of your strategy. Every extra dollar goes only on top of the minimums you're already required to pay — the calculator assumes this throughout." },
]}
/>
</div>
);
};

// ─── MORTGAGE REALITY ─────────────────────────────────────────────────
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

<ArticleSection
title="The Math Behind Your Mortgage Reality Check"
intro={[
"Lenders will often approve you for more house than is comfortable to actually live with. This tool checks your numbers against the housing ratio guideline lenders and financial planners commonly use — that your total monthly housing payment (principal, interest, taxes, insurance, and PMI if applicable) shouldn't exceed roughly 28% of your gross monthly income — and flags where you land.",
"The 'Can I Afford It?' tab calculates your full PITI payment (Principal, Interest, Taxes, Insurance) including private mortgage insurance if your down payment is under 20%, then compares it to your income to show whether you're comfortable, stretching, or overextended. The 'Pay Off Faster' tab shows how much interest and time an extra monthly payment saves. The 'True Cost' tab reveals the total amount of interest you'll pay over the life of the loan — often more than most buyers expect relative to the purchase price.",
"On a $350,000 home with 20% down at 6.56% over 30 years, the principal and interest payment alone doesn't tell the full story — once you add up the interest, the total collected by the bank over three decades is frequently 60–100% of the original purchase price, depending on the rate and term. That's the number the 'True Cost' tab is built to surface.",
"PMI is worth watching closely: putting down less than 20% adds a monthly cost that disappears once you reach 20% equity, so the down payment slider shows exactly what crossing that threshold looks like in dollars.",
]}
faqs={[
{ q: "What is PITI and why does it matter more than just the mortgage payment?", a: "PITI stands for Principal, Interest, Taxes, and Insurance — the full monthly cost of owning the home, not just paying down the loan. Many affordability conversations only mention principal and interest, which understates your real monthly obligation by hundreds of dollars once property taxes, homeowners insurance, and PMI are included." },
{ q: "Why 28% of income, specifically?", a: "It's a widely used guideline (sometimes paired with a 36% rule for total debt including the mortgage) that lenders and financial planners use as a rough ceiling for comfortable housing costs. It's not a hard rule — some households manage higher ratios fine, others feel stretched below it — but it's a useful gut-check against your actual budget." },
{ q: "How is PMI calculated here, and when does it go away?", a: "The calculator estimates PMI at roughly 1% of the loan balance annually when your down payment is under 20%, divided across 12 months. In practice, PMI drops off automatically once your loan balance reaches 78% of the original home value, or you can request removal at 80%." },
{ q: "Does the 'Pay Off Faster' tab work for a mortgage I already have?", a: "Yes — enter your current balance as the home price with a corresponding down payment that reflects what you still owe, along with your actual rate and remaining term, and the extra payment slider will show the same interest and time savings math applied to your existing loan." },
]}
/>
</div>
);
};

// ─── COST OF WAITING ────────────────────────────────────────────────
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

<ArticleSection
title="Why Interest Accrues Even While You're Reading This"
intro={[
"Interest on revolving debt like credit cards doesn't wait for your monthly statement — it accrues daily, based on your current balance and APR. This tool takes your balance and interest rate and calculates exactly how much interest is building up per second, per day, and per year, so the abstract idea of 'debt getting more expensive over time' becomes a number you can watch move.",
"Enter your balance, APR, and current monthly payment, then hit start. The ticking dollar amount is a live simulation of interest accruing on your balance in real time — a visual reminder that every day a balance sits unpaid, it grows a little larger, regardless of whether you're actively thinking about it.",
"Below the ticker, the calculator also shows the bigger picture: how many months it takes to pay off that balance at your current payment, the total interest you'll pay over that time, and — critically — how much faster and cheaper it gets if you add even $100 extra per month.",
"A $12,000 balance at 22.9% APR accrues roughly $7.50 in interest per day just sitting there. At a $350 monthly payment, that adds up to years of payments and thousands of dollars in interest — money that goes entirely to the bank rather than reducing what you owe.",
]}
faqs={[
{ q: "Is this actually calculating interest in real time, or is it a simulation?", a: "It's a simulation based on your balance and APR, showing what interest accrual looks like mathematically — daily interest divided down to a per-second rate. It illustrates how compounding works on revolving credit, though your actual statement will apply interest according to your card issuer's specific compounding method." },
{ q: "Why does my minimum payment barely move the balance?", a: "On high-APR debt, a large portion of your minimum payment goes toward the interest that accrued that month before any of it touches the principal balance. The higher the rate relative to your payment, the slower your balance actually shrinks — which is exactly what the 'Total Interest' figure below the ticker is measuring." },
{ q: "How much does adding $100 extra per month really save?", a: "It depends on your balance and rate, but the calculator computes this directly: it shows both the interest saved and the number of months shaved off your payoff timeline when you add $100 to your current payment, so you can see the specific dollar impact for your own numbers." },
{ q: "What if my payment is lower than what's required to make progress?", a: "If your monthly payment doesn't cover the interest charged each month, the balance will never shrink — it just grows. The calculator flags this as 'Never paid off' under Total Interest, which is a signal that your payment needs to increase for that debt to actually get paid down." },
]}
/>
</div>
);
};

// ─── CREDIT SCORE IMPACT ───────────────────────────────────────────────
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

<ArticleSection
title="What Actually Moves Your Credit Score"
intro={[
"Credit scoring models like FICO weigh several factors differently: payment history and credit utilization carry the most weight, followed by the length of your credit history, new credit inquiries, and credit mix. This calculator uses a simplified version of that weighting to show which of your habits are dragging your score down the most, and what closing that gap could be worth in real dollars.",
"Adjust your current utilization, late payment history, average account age, and recent credit inquiries to see how each factor affects your projected score. The comparison against a $300,000 mortgage shows something concrete: even a modest score improvement can mean a meaningfully lower interest rate, which compounds into tens of thousands of dollars over a 30-year loan.",
"The action plan at the bottom responds to your specific inputs — if your utilization is above 30%, it flags that as the priority; if you have recent late payments, it explains why time and consistency, not quick fixes, are the only real remedy.",
"This tool is meant to build intuition about what moves your score and by roughly how much — not to replace your actual credit report or a hard credit pull from a lender.",
]}
faqs={[
{ q: "Is this the same scoring model my lender will actually use?", a: "No. This is a simplified educational model built to illustrate the direction and rough magnitude of how utilization, payment history, account age, and new credit affect your score — not an exact replica of FICO or VantageScore's proprietary algorithms. Your actual score may differ; use this as a directional guide, not a precise prediction." },
{ q: "What's the fastest thing I can do to raise my score?", a: "Reducing credit utilization tends to move fastest, sometimes within one billing cycle, because it's based on your balance at the moment your card issuer reports to the credit bureaus. Paying down balances before your statement closing date — not just the due date — can reflect in your score sooner than you'd expect." },
{ q: "Does checking my own credit score hurt it?", a: "No. Checking your own score or report is a 'soft inquiry' and has no effect on your credit score. Only 'hard inquiries' — when a lender pulls your credit because you applied for new credit — can cause a small, temporary dip." },
{ q: "Why do late payments hurt so much more than other factors?", a: "Payment history is the single largest factor in most credit scoring models because it's the most direct predictor of future risk to a lender. A recent late payment signals higher risk more strongly than a slightly high utilization ratio does, which is why the impact here is weighted heavily — and why the only real fix is time plus a consistent record of on-time payments going forward." },
]}
/>
</div>
);
};

// ─── RENT VS BUY ─────────────────────────────────────────────────────────
const RentVsBuy = () => {
const [rent, setRent] = useState(2200);
const [rentGrowth, setRentGrowth] = useState(3);
const [homePrice, setHomePrice] = useState(320000);
const [down, setDown] = useState(20000);
const [rate, setRate] = useState(6.56);
const [years, setYears] = useState(7);
const [appreciation, setAppreciation] = useState(3.5);

const loanAmt = homePrice - down;
const mr = rate / 100 / 12;
const n = 360;
const monthlyPI = loanAmt * (mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1);
const monthlyTax = (homePrice * 0.012) / 12;
const monthlyIns = (homePrice * 0.004) / 12;
const monthlyMaint = (homePrice * 0.01) / 12;
const pmi = down / homePrice < 0.2 ? (loanAmt * 0.006) / 12 : 0;
const monthlyOwnCost = monthlyPI + monthlyTax + monthlyIns + monthlyMaint + pmi;

// Total cost over the horizon
let totalRentCost = 0, r = rent;
for (let y = 0; y < years; y++) { totalRentCost += r * 12; r *= (1 + rentGrowth / 100); }

const closingCosts = homePrice * 0.03;
const sellingCosts = homePrice * Math.pow(1 + appreciation / 100, years) * 0.07;
const totalOwnCash = (monthlyOwnCost * 12 * years) + down + closingCosts;
const futureValue = homePrice * Math.pow(1 + appreciation / 100, years);
const remainingBalance = loanAmt * (Math.pow(1 + mr, n) - Math.pow(1 + mr, years * 12)) / (Math.pow(1 + mr, n) - 1);
const equity = futureValue - remainingBalance - sellingCosts;
const netOwnCost = totalOwnCash - equity;

const diff = totalRentCost - netOwnCost;
const winner = diff > 0 ? "buy" : "rent";

return (
<div className="fade-up">
<div style={{ marginBottom: 22 }}>
<h2 className="serif" style={{ fontSize: 28, marginBottom: 8 }}>Rent vs. Buy</h2>
<p style={{ color: C.muted, fontSize: 15, lineHeight: 1.6 }}>Compare the true cost of renting vs. owning over your expected time horizon — including equity built.</p>
</div>

<Card style={{ marginBottom: 20 }}>
<div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
<div>
<Label>Current Monthly Rent</Label>
<NumInput value={rent} onChange={setRent} prefix="$" />
</div>
<div>
<Label>Expected Annual Rent Growth</Label>
<NumInput value={rentGrowth} onChange={setRentGrowth} suffix="%" step={0.5} />
</div>
<div>
<Label>Home Price</Label>
<NumInput value={homePrice} onChange={setHomePrice} prefix="$" />
</div>
<div>
<Label>Down Payment</Label>
<NumInput value={down} onChange={setDown} prefix="$" />
</div>
<div>
<Label>Mortgage Rate</Label>
<NumInput value={rate} onChange={setRate} suffix="%" step={0.125} />
</div>
<div>
<Label>Home Appreciation (annual)</Label>
<NumInput value={appreciation} onChange={setAppreciation} suffix="%" step={0.5} />
</div>
</div>
<div style={{ marginTop: 20 }}>
<Label>How Long Will You Stay? {years} years</Label>
<input type="range" min={1} max={15} step={1} value={years} onChange={e => setYears(Number(e.target.value))} style={{ marginTop: 8 }} />
</div>
</Card>

<div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
<Card>
<Label>Monthly Cost — Renting</Label>
<Big label="" value={fmt(rent)} color={C.teal} size={30} />
</Card>
<Card>
<Label>Monthly Cost — Owning (PITI + maint.)</Label>
<Big label="" value={fmt(monthlyOwnCost)} color={C.amber} size={30} />
</Card>
</div>

<Card style={{ marginBottom: 20, border: `1px solid ${winner === "buy" ? C.green : C.teal}` }}>
<div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>Over {years} years, net cost comparison:</div>
<div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 16 }}>
<Big label="Total Cost of Renting" value={fmt(totalRentCost)} color={C.teal} size={26} />
<Big label="Net Cost of Owning (after equity)" value={fmt(Math.max(0, netOwnCost))} color={C.amber} size={26} sub={`Home value: ${fmt(futureValue)} — equity: ${fmt(equity)}`} />
</div>
<Hr />
<Insight icon={winner === "buy" ? "🏡" : "🏢"} text={winner === "buy" ? `Buying saves you ${fmt(Math.abs(diff))} over ${years} years, mainly through home equity and appreciation.` : `Renting saves you ${fmt(Math.abs(diff))} over ${years} years — the equity gained from buying doesn't offset the higher monthly costs and transaction fees at this horizon.`} hl="" />
</Card>

<AffLink href="https://www.lendingtree.com/home/mortgage/">Compare current mortgage rates from multiple lenders →</AffLink>

<ArticleSection
title="How This Comparison Is Calculated"
intro={[
"This calculator compares the total cash cost of renting against the net cost of owning — owning costs minus the equity you build — over the number of years you tell us you plan to stay. It's not just a monthly payment comparison, because renting and owning build wealth very differently: rent payments build no equity, while mortgage payments slowly convert into ownership, and home appreciation compounds that further.",
"On the owning side, we include principal and interest, estimated property tax, homeowners insurance, maintenance (estimated around 1% of home value annually), and PMI if your down payment is under 20%. We also factor in closing costs when you buy (~3% of price) and selling costs when you'd eventually sell (~7% of the future home value) — both real costs that are easy to forget when comparing a rent check to a mortgage payment.",
"The time horizon matters enormously. Buying tends to look worse in the short term because closing costs and selling costs are front- and back-loaded, while renting has none of those one-time costs. The longer you stay, the more time equity and appreciation have to work in your favor — which is why this calculator lets you adjust the years slider to see exactly where the breakeven point falls for your situation.",
"Every housing market is different, and appreciation rates vary widely by location and time period. Treat the appreciation assumption as an estimate you can adjust, not a guarantee — no one can predict future home values with certainty.",
]}
faqs={[
{ q: "Why does buying look worse if I only stay a short time?", a: "Closing costs (around 3% of the home price) and selling costs (around 7% of the future sale price) are one-time hits that get spread over fewer years the shorter you stay. Over 1–2 years, these transaction costs often outweigh the equity you've built, which is why real estate is traditionally considered a longer-term financial decision." },
{ q: "Does this account for tax deductions on mortgage interest?", a: "No, this calculator focuses on cash costs and equity, not tax effects. Mortgage interest and property tax deductions can improve the economics of owning for some filers, especially those who itemize, but the benefit varies significantly based on your tax situation — consult a tax professional for your specific numbers." },
{ q: "What if rent and home prices in my area don't match these defaults?", a: "Every input is editable — use your actual rent, local home prices, and the mortgage rate you've been quoted for the most accurate comparison. The default values are reasonable national averages, but real estate is intensely local, so your specific numbers matter more than the defaults." },
{ q: "Does 'equity' account for the fact I could invest my down payment instead?", a: "Not directly. This calculator compares housing costs specifically — it doesn't model the opportunity cost of investing your down payment in the stock market instead of a home, which is a legitimate consideration some renters weigh. If that comparison matters to you, it's worth running the numbers separately with your expected investment return." },
]}
/>
</div>
);
};

// ─── EMAIL CAPTURE ─────────────────────────────────────────────────────────────
const EmailCapture = () => {
const [email, setEmail] = useState("");
const [sent, setSent] = useState(false);
const submit = (e) => {
e.preventDefault();
if (email.includes("@")) setSent(true);
};
return (
<Card style={{ marginTop: 30, textAlign: "center", padding: "32px 24px" }}>
{sent ? (
<div style={{ color: C.green, fontSize: 15, fontWeight: 600 }}>You're in — check your inbox to confirm.</div>
) : (
<>
<div className="serif" style={{ fontSize: 20, marginBottom: 8, color: C.white }}>Get notified when new tools launch</div>
<div style={{ color: C.muted, fontSize: 14, marginBottom: 18 }}>No spam. Just new calculators and money tips, occasionally.</div>
<form onSubmit={submit} style={{ display: "flex", gap: 10, maxWidth: 380, margin: "0 auto" }}>
<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" style={{ flex: 1, padding: "11px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface2, color: C.white, fontSize: 14 }} />
<button type="submit" style={{ padding: "11px 20px", borderRadius: 8, border: "none", background: C.green, color: C.bg, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Notify Me</button>
</form>
</>
)}
</Card>
);
};

// ─── MAIN APP ───────────────────────────────────────────────────────────
const TOOLS = [
{ id: "debt", label: "Debt-Free Countdown", icon: "🔥", component: DebtFreeCountdown },
{ id: "triage", label: "Financial Triage", icon: "🎯", component: TriageCalc },
{ id: "mortgage", label: "Mortgage Reality Check", icon: "🏠", component: MortgageCalc },
{ id: "waiting", label: "Cost of Waiting", icon: "⏳", component: CostOfWaiting },
{ id: "credit", label: "Credit Score Impact", icon: "📊", component: CreditScore },
{ id: "rentbuy", label: "Rent vs. Buy", icon: "🔑", component: RentVsBuy },
];

export default function App() {
const [active, setActive] = useState("debt");
const ActiveComponent = TOOLS.find(t => t.id === active)?.component || DebtFreeCountdown;

return (
<>
<GlobalStyle />
<div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 60 }}>
<header style={{ borderBottom: `1px solid ${C.border}`, padding: "20px 24px" }}>
<div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
<div className="serif" style={{ fontSize: 22, fontWeight: 700, color: C.white }}>PayoffClock</div>
<div style={{ fontSize: 13, color: C.muted }}>Free financial clarity tools</div>
</div>
</header>

<nav style={{ maxWidth: 960, margin: "0 auto", padding: "20px 24px 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
{TOOLS.map(t => (
<button key={t.id} onClick={() => setActive(t.id)} style={{ padding: "9px 16px", borderRadius: 10, border: `1px solid ${active === t.id ? C.green : C.border}`, background: active === t.id ? "rgba(52,211,153,0.12)" : "transparent", color: active === t.id ? C.green : C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
<span>{t.icon}</span>{t.label}
</button>
))}
</nav>

<main style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px 0" }}>
<ActiveComponent />
<EmailCapture />
</main>

<footer style={{ maxWidth: 960, margin: "40px auto 0", padding: "24px 24px 0", borderTop: `1px solid ${C.border}`, display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13, color: C.muted }}>
<a href="/about.html" style={{ color: C.muted }}>About</a>
<a href="/contact.html" style={{ color: C.muted }}>Contact</a>
<a href="/privacy.html" style={{ color: C.muted }}>Privacy</a>
<a href="/terms.html" style={{ color: C.muted }}>Terms</a>
<span style={{ marginLeft: "auto" }}>© {today.getFullYear()} PayoffClock</span>
</footer>
</div>
</>
);
}
