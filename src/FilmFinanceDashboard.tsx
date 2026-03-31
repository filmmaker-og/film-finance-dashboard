import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line,
  ScatterChart, Scatter, CartesianGrid, Legend, ReferenceLine
} from "recharts";

/* ═══ TOKENS ═══ */
const T = {
  bg: "#000", glass: "rgba(6,6,6,0.85)", glassBright: "rgba(12,12,14,0.92)", glassRecessed: "rgba(3,3,3,0.78)",
  gold: "#D4AF37", goldBright: "#F9E076", goldDim: "rgba(212,175,55,0.25)", goldGhost: "rgba(212,175,55,0.08)",
  purple: "rgba(120,60,180,1)", green: "#3CB371", greenDim: "rgba(60,179,113,0.15)",
  red: "rgba(220,38,38,1)", redDim: "rgba(220,38,38,0.15)",
  amber: "#F59E0B", amberDim: "rgba(245,158,11,0.15)",
  equity: "#E0A030",
  blue: "#3B82F6",
  w92: "rgba(255,255,255,0.92)", w75: "rgba(255,255,255,0.75)",
  w55: "rgba(255,255,255,0.55)", w40: "rgba(255,255,255,0.40)", w25: "rgba(255,255,255,0.25)",
  radius: "12px", border: "rgba(212,175,55,0.12)", borderBright: "rgba(212,175,55,0.28)",
  inputBg: "rgba(212,175,55,0.05)", inputBorder: "rgba(212,175,55,0.18)",
};
const F = { display: "'Bebas Neue',sans-serif", body: "'Inter',sans-serif", mono: "'Roboto Mono',monospace" };
const grainSVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`;

/* ═══ STATE TAX CREDITS ═══ */
const STATES = [
  { id: "GA", name: "Georgia", rate: 20, type: "Transferable", note: "20% base on qualified in-state spend. +10% uplift for GA promotional logo (30% total). Sold ~$0.94-0.97/dollar. No per-project cap. No sunset. Min $500K qualified GA spend.", months: "6-12" },
  { id: "NM", name: "New Mexico", rate: 25, type: "Refundable", note: "25% base refundable. +10% rural, +5% TV/facility (max 40%). Cash refund. $140M annual cap FY2026. No min spend.", months: "6-12" },
  { id: "CA", name: "California", rate: 35, type: "Refundable", note: "35% base. +5% VFX, +5% out-of-LA, +10% local hire. Min $1M budget, 75% CA spend. $750M cap. Highly competitive.", months: "6-18" },
  { id: "NV", name: "Nevada", rate: 15, type: "Transferable", note: "15% base. +5% NV BTL bonus, +5% rural (max 25%). Non-res BTL wages ~0%. Small $10M annual cap.", months: "6-12" },
  { id: "NY", name: "New York", rate: 25, type: "Refundable", note: "25% base. +10% upstate (max 35%). Min $1M qualified spend. Separate indie program. $700M cap.", months: "6-18" },
  { id: "NJ", name: "New Jersey", rate: 35, type: "Transferable", note: "35% base (30% NYC zone). 40% studio partner. State buys at 95% for 2026+. Extended to 2049.", months: "12+" },
  { id: "LA", name: "Louisiana", rate: 25, type: "Transferable/Refundable", note: "25% base stackable to 40% (+15% resident payroll, +5% rural, +10% screenplay, +5% VFX). Buyback 90%. Cap reduced $125M. Sunset 2031.", months: "3-6+" },
  { id: "TX", name: "Texas", rate: 20, type: "Cash Grant", note: "Cash grant. Post-SB22: up to 25% for $5M+. Non-resident wages ineligible. Content review risk. $500M/biennium. Sunset 2035.", months: "Variable" },
  { id: "PA", name: "Pennsylvania", rate: 25, type: "Transferable", note: "25% base. +5% qualified facility (30%). 30% on post. Min 60% PA spend. $100M annual cap.", months: "6-12" },
  { id: "IL", name: "Illinois", rate: 30, type: "Transferable", note: "35% IL vendor/resident wages, 30% limited non-resident (blended ~30%). Bonuses to 55%. $500K/person cap.", months: "Variable" },
  { id: "MA", name: "Massachusetts", rate: 25, type: "Transferable/Refundable", note: "25% payroll + 25% production expenses (if 75%+ MA spend). No annual cap. $1M salary exclusion. Permanent.", months: "3-6" },
  { id: "OK", name: "Oklahoma", rate: 20, type: "Cash Rebate", note: "20% base cash rebate. Stackable to 30%. Min $50K budget, $25K OK spend. $30M annual cap. Sunset 2031.", months: "4-8" },
  { id: "OTHER", name: "Other / Not Sure", rate: 0, type: "—", note: "Enter your state's rate manually. Check with your state film office.", months: "—" },
];

/* ═══ GENRES ═══ */
const GENRES = ["Thriller", "Horror", "Drama", "Action", "Comedy", "Sci-Fi", "Documentary", "Romance"];
const GB = { Thriller: { th: 900, mg: 75, ov: 25, sv: 150, tv: 12, av: 8, dt: 38, it: 25, an: 8, mr: 0 }, Horror: { th: 1200, mg: 100, ov: 40, sv: 200, tv: 18, av: 12, dt: 25, it: 20, an: 5, mr: 5 }, Drama: { th: 600, mg: 60, ov: 15, sv: 120, tv: 8, av: 5, dt: 50, it: 35, an: 12, mr: 0 }, Action: { th: 1100, mg: 120, ov: 50, sv: 180, tv: 15, av: 10, dt: 30, it: 40, an: 6, mr: 8 }, Comedy: { th: 800, mg: 40, ov: 10, sv: 130, tv: 10, av: 15, dt: 45, it: 15, an: 8, mr: 3 }, "Sci-Fi": { th: 700, mg: 90, ov: 30, sv: 160, tv: 14, av: 8, dt: 35, it: 30, an: 7, mr: 12 }, Documentary: { th: 200, mg: 30, ov: 5, sv: 80, tv: 5, av: 20, dt: 60, it: 20, an: 25, mr: 0 }, Romance: { th: 500, mg: 50, ov: 10, sv: 140, tv: 10, av: 12, dt: 40, it: 20, an: 8, mr: 0 } };

/* ═══ BUDGET TEMPLATE ═══ */
const BT = [
  { n: "Story & Rights", p: .020, c: "ATL" }, { n: "Screenplay", p: .0125, c: "ATL" }, { n: "Producer(s)", p: .030, c: "ATL" },
  { n: "Director", p: .050, c: "ATL" }, { n: "Lead Cast", p: .100, c: "ATL" }, { n: "Supporting Cast", p: .025, c: "ATL" },
  { n: "Production Staff", p: .0175, c: "BTL" }, { n: "Camera", p: .040, c: "BTL" }, { n: "Grip & Electric", p: .060, c: "BTL" },
  { n: "Art Dept", p: .045, c: "BTL" }, { n: "Wardrobe", p: .0175, c: "BTL" }, { n: "Hair & Makeup", p: .014, c: "BTL" },
  { n: "Sound", p: .011, c: "BTL" }, { n: "Locations", p: .0325, c: "BTL" }, { n: "Transport", p: .0275, c: "BTL" },
  { n: "Catering", p: .020, c: "BTL" }, { n: "Extras", p: .009, c: "BTL" }, { n: "Stunts", p: .0075, c: "BTL" },
  { n: "Editorial", p: .0375, c: "Post" }, { n: "Color/DI", p: .020, c: "Post" }, { n: "Music", p: .0175, c: "Post" },
  { n: "Sound Design", p: .015, c: "Post" }, { n: "VFX/Titles", p: .010, c: "Post" }, { n: "Deliverables", p: .010, c: "Post" },
  { n: "Captions", p: .0025, c: "Post" },
  { n: "Insurance+E&O", p: .0185, c: "G&A" }, { n: "Legal", p: .010, c: "G&A" }, { n: "Accounting", p: .0075, c: "G&A" },
  { n: "Festivals", p: .005, c: "G&A" }, { n: "Marketing Seed", p: .010, c: "G&A" },
];

/* ═══ RISKS ═══ */
const RISKS = [
  { name: "Completion Risk", prob: 25, impact: 4, score: 1.0, cat: "Production", mit: "Completion bond, 10% contingency, experienced line producer monitoring weekly burn rate." },
  { name: "No Distribution", prob: 40, impact: 5, score: 2.0, cat: "Commercial", mit: "Attach sales agent pre-production, target A-list festivals, SVOD-first fallback." },
  { name: "Revenue Underperformance", prob: 45, impact: 5, score: 2.25, cat: "Financial", mit: "Conservative projections, investor recoupment priority, diversified windows." },
  { name: "SVOD Contraction", prob: 35, impact: 4, score: 1.4, cat: "Market", mit: "Multi-window strategy, no single-platform dependency." },
  { name: "Key Person Risk", prob: 15, impact: 5, score: 0.75, cat: "Production", mit: "Cast/key person insurance, talent clauses, backup casting." },
  { name: "Tax Credit Risk", prob: 20, impact: 4, score: 0.8, cat: "Financial", mit: "Qualified tax attorney, pre-approval, conservative estimate." },
  { name: "Chain of Title", prob: 10, impact: 5, score: 0.5, cat: "Legal", mit: "Full clearance before close, E&O insurance, copyright reg." },
  { name: "Bridge Loan Rate", prob: 15, impact: 3, score: 0.45, cat: "Financial", mit: "Fixed-rate agreement, sensitivity modeled at 9%." },
  { name: "Investor Default", prob: 10, impact: 4, score: 0.4, cat: "Operational", mit: "Binding subscriptions, PPM disclaims redemption rights." },
  { name: "Festival Rejection", prob: 40, impact: 3, score: 1.2, cat: "Commercial", mit: "Direct distribution backup, trailer-driven digital release." },
  { name: "Music Clearance", prob: 20, impact: 3, score: 0.6, cat: "Legal", mit: "Pre-clear all music, original score preferred." },
  { name: "FX Risk", prob: 25, impact: 3, score: 0.75, cat: "Financial", mit: "Invoice pre-sales in USD, USD collection account." },
  { name: "Talent Controversy", prob: 10, impact: 4, score: 0.4, cat: "Reputational", mit: "Morality clauses, crisis PR, insurance." },
  { name: "Data Loss", prob: 10, impact: 3, score: 0.3, cat: "Operational", mit: "Daily cloud backup, RAID + offsite." },
];

/* ═══ DIST PRESETS ═══ */
const DIST_PRESETS = {
  "SVOD-First": { exhib: 0, pa: 0, distFee: 25, saComm: 10, desc: "Straight to streaming. Lowest breakeven, highest recoupment probability." },
  "Limited Theatrical": { exhib: 50, pa: 150000, distFee: 30, saComm: 12, desc: "Platform release + SVOD window. Higher visibility, higher cost." },
  "Hybrid / Self": { exhib: 10, pa: 75000, distFee: 15, saComm: 5, desc: "Self-distributed with limited theatrical. Max control, more effort." },
};

/* ═══ DERIVE — Core engine ═══ */
function derive(inp, budgetEdits, bondOn, bondPct) {
  const tc = Math.round(inp.totalBudget * inp.taxCreditPct / 100);
  const sd = Math.round(tc * inp.taxCreditLoanPct / 100);
  const bondAmt = bondOn ? Math.round(inp.totalBudget * bondPct / 100) : 0;
  const bi = BT.map((t, i) => {
    const def = Math.round(inp.totalBudget * t.p);
    const ed = budgetEdits[i];
    return { name: t.n, amount: ed !== undefined ? ed : def, category: t.c, isEdited: ed !== undefined };
  });
  if (bondOn) bi.push({ name: "Completion Bond", amount: bondAmt, category: "G&A", isEdited: false, isBond: true });
  const ct = {}; bi.forEach(x => { ct[x.category] = (ct[x.category] || 0) + x.amount; });
  const cont = Math.round(((ct.BTL || 0) + (ct.Post || 0)) * 0.10);
  const actualBudget = bi.reduce((s, b) => s + b.amount, 0) + cont;
  const eq = Math.max(0, actualBudget - sd - inp.gapMezz - inp.preSaleLoan);
  const estInv = inp.minInvestment > 0 ? Math.ceil(eq / inp.minInvestment) : 0;
  const b = GB[inp.genre] || GB.Thriller;
  const m = inp.totalBudget / 1e6;
  const rw = [
    { window: "Theatrical", conservative: Math.round(b.th * m * .45e3), base: Math.round(b.th * m * 1e3), upside: Math.round(b.th * m * 2.8e3) },
    { window: "Intl MGs", conservative: Math.round(b.mg * m * .33e3), base: Math.round(b.mg * m * 1e3), upside: Math.round(b.mg * m * 3.3e3) },
    { window: "Intl Overages", conservative: 0, base: Math.round(b.ov * m * 1e3), upside: Math.round(b.ov * m * 4e3) },
    { window: "SVOD", conservative: Math.round(b.sv * m * .25e3), base: Math.round(b.sv * m * 1e3), upside: Math.round(b.sv * m * 5e3) },
    { window: "TVOD", conservative: Math.round(b.tv * m * .5e3), base: Math.round(b.tv * m * 1e3), upside: Math.round(b.tv * m * 3.6e3) },
    { window: "AVOD/FAST", conservative: Math.round(b.av * m * .5e3), base: Math.round(b.av * m * 1e3), upside: Math.round(b.av * m * 3.7e3) },
    { window: "Dom TV", conservative: Math.round(b.dt * m * .27e3), base: Math.round(b.dt * m * 1e3), upside: Math.round(b.dt * m * 4e3) },
    { window: "Intl TV", conservative: Math.round(b.it * m * .2e3), base: Math.round(b.it * m * 1e3), upside: Math.round(b.it * m * 4e3) },
    { window: "Ancillary", conservative: Math.round(b.an * m * .33e3), base: Math.round(b.an * m * 1e3), upside: Math.round(b.an * m * 3.3e3) },
    { window: "Merch", conservative: 0, base: Math.round(b.mr * m * 1e3), upside: Math.round(b.mr * m * 5e3) },
  ];
  const rt = { conservative: rw.reduce((s, r) => s + r.conservative, 0) + tc, base: rw.reduce((s, r) => s + r.base, 0) + tc, upside: rw.reduce((s, r) => s + r.upside, 0) + tc };
  function calcWF(gr) {
    const hasTh = inp.paBudget > 0;
    const et = hasTh ? gr * .5 * (inp.exhibitorPct / 100) : 0;
    const ap = gr - et - inp.paBudget;
    const df = Math.max(0, ap) * (inp.distFeePct / 100);
    const ad = Math.max(0, ap - df);
    const sc = gr * .3 * (inp.saCommPct / 100);
    const npp = Math.max(0, ad - sc);
    const dr = sd * (1 + inp.seniorDebtRate / 100 * inp.loanTerm / 12);
    const gp = inp.gapMezz * (1 + inp.gapRate / 100 * inp.loanTerm / 12);
    const afd = Math.max(0, npp - dr - gp);
    const ra = eq * (1 + inp.recoupPremium / 100);
    const ir = Math.min(ra, afd);
    const rem = Math.max(0, afd - ra);
    const ib = rem * (inp.investorBackend / 100);
    const pb = rem * (1 - inp.investorBackend / 100);
    const tr = ir + ib;
    return { gr, et, pa: inp.paBudget, df, sc, npp, dr, gp, afd, ir, rem, ib, pb, tr, moic: eq > 0 ? tr / eq : 0, roi: eq > 0 ? (tr - eq) / eq : 0, eq, hasTh };
  }
  const drAmt = sd * (1 + inp.seniorDebtRate / 100 * inp.loanTerm / 12);
  const cf = [
    { month: "Mo 1", inflows: eq + sd, outflows: -Math.round(actualBudget * .094), phase: "Pre-Prod" },
    { month: "Mo 2", inflows: 0, outflows: -Math.round(actualBudget * .068), phase: "Pre-Prod" },
    { month: "Mo 3", inflows: 0, outflows: -Math.round(actualBudget * .158), phase: "Production" },
    { month: "Mo 4", inflows: 0, outflows: -Math.round(actualBudget * .158), phase: "Production" },
    { month: "Mo 5", inflows: 0, outflows: -Math.round(actualBudget * .108), phase: "Production" },
    { month: "Mo 6", inflows: 0, outflows: -Math.round(actualBudget * .108), phase: "Post" },
    { month: "Mo 7", inflows: 0, outflows: -Math.round(actualBudget * .108), phase: "Post" },
    { month: "Mo 8", inflows: 0, outflows: -Math.round(actualBudget * .083), phase: "Post" },
    { month: "Mo 9", inflows: 0, outflows: -Math.round(actualBudget * .003), phase: "Delivery" },
    { month: "Mo 10", inflows: 0, outflows: -Math.round(actualBudget * .003), phase: "Delivery" },
    { month: "Mo 11", inflows: Math.round(rt.base * .12), outflows: -Math.round(drAmt), phase: "Distrib." },
    { month: "Mo 12", inflows: Math.round(rt.base * .30) + tc, outflows: 0, phase: "Distrib." },
    { month: "Mo 18", inflows: Math.round(rt.base * .08), outflows: 0, phase: "Distrib." },
    { month: "Mo 24+", inflows: Math.round(rt.base * .10), outflows: 0, phase: "Distrib." },
  ];
  let cum = 0; cf.forEach(x => { cum += x.inflows + x.outflows; x.cumulative = cum; x.net = x.inflows + x.outflows; });
  function cBE(ep, df, pa, sa) { const n = (1 - ep * .5) * (1 - df) * (1 - sa * .3); return n > 0 ? Math.round((eq * (1 + inp.recoupPremium / 100) + drAmt + pa) / n) : Infinity; }
  const be = [
    { strategy: "SVOD-First", breakeven: cBE(0, .25, 0, .10) },
    { strategy: "Limited Theatrical", breakeven: cBE(inp.exhibitorPct / 100, inp.distFeePct / 100, inp.paBudget, inp.saCommPct / 100) },
    { strategy: "Wide Release", breakeven: cBE(.52, .35, Math.max(1e6, actualBudget * .5), .12) },
    { strategy: "Intl Pre-Sales", breakeven: cBE(0, .20, 50000, .12) },
    { strategy: "Hybrid/Self", breakeven: cBE(.10, .15, 75000, .05) },
  ];
  const sources = [
    { name: "TC Bridge Loan", amount: sd, color: T.blue, pos: "1st Position — repaid from tax credit" },
    inp.gapMezz > 0 && { name: "Gap/Mezz", amount: inp.gapMezz, color: T.amber, pos: "2nd Position" },
    inp.preSaleLoan > 0 && { name: "Pre-Sale Loan", amount: inp.preSaleLoan, color: "#8B5CF6", pos: "1st Position" },
    { name: "Equity", amount: eq, color: T.equity, pos: "3rd Position — at-risk capital" },
  ].filter(Boolean);
  const cs = [
    { name: "Tax Credit", amount: tc, color: T.green, pos: "Non-dilutive — post-wrap" },
    { name: "Senior Debt", amount: sd, color: T.blue, pos: "1st Position" },
    inp.gapMezz > 0 && { name: "Gap/Mezz", amount: inp.gapMezz, color: T.amber, pos: "2nd Position" },
    inp.preSaleLoan > 0 && { name: "Pre-Sale Loan", amount: inp.preSaleLoan, color: "#8B5CF6", pos: "1st Position" },
    { name: "Equity", amount: eq, color: T.equity, pos: "3rd Position" },
  ].filter(Boolean);
  const bd = [
    { name: "Above the Line", value: ct.ATL || 0, color: T.gold },
    { name: "Below the Line", value: ct.BTL || 0, color: T.blue },
    { name: "Post-Production", value: ct.Post || 0, color: T.purple },
    { name: "G&A", value: ct["G&A"] || 0, color: T.green },
    { name: "Contingency", value: cont, color: T.amber },
  ];
  return { tc, sd, eq, estInv, bi, ct, cont, rw, rt, calcWF, cf, be, cs, sources, bd, risks: RISKS, drAmt, actualBudget, bondAmt };
}

/* ═══ FORMAT ═══ */
const fmt = n => { if (n == null || isNaN(n)) return "$0"; if (Math.abs(n) >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M"; if (Math.abs(n) >= 1e3) return "$" + Math.round(n / 1e3) + "K"; return "$" + Math.round(n); };
const fF = n => "$" + (n || 0).toLocaleString();
const pct = n => ((n || 0) * 100).toFixed(1) + "%";
const CC = { ATL: T.gold, BTL: T.blue, Post: T.purple, "G&A": T.green };
const CL = { ATL: "Above the Line", BTL: "Below the Line — Production", Post: "Post-Production", "G&A": "General & Administrative" };

/* ═══ UI COMPONENTS ═══ */
const Glass = ({ children, style, tier = "standard", ...p }) => {
  const bg = tier === "primary" ? T.glassBright : tier === "recessed" ? T.glassRecessed : T.glass;
  const bd = tier === "primary" ? T.borderBright : T.border;
  return <div style={{ background: bg, border: `1px solid ${bd}`, borderRadius: T.radius, padding: "24px", ...style }} {...p}>{children}</div>;
};
const SL = ({ children, sub }) => (
  <div style={{ marginBottom: sub ? "14px" : "8px" }}>
    <div style={{ fontFamily: F.display, fontSize: "14px", letterSpacing: "5px", color: T.gold, textTransform: "uppercase", opacity: 0.7 }}>{children}</div>
    {sub && <div style={{ fontFamily: F.body, fontSize: "13px", color: T.w40, marginTop: "6px", lineHeight: 1.5, maxWidth: "640px" }}>{sub}</div>}
  </div>
);
const KPI = ({ label, value, sub, color, explain }) => (
  <Glass style={{ textAlign: "center", flex: 1, minWidth: "160px", padding: "20px 16px" }}>
    <div style={{ fontFamily: F.mono, fontSize: "11px", color: T.w55, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "10px" }}>{label}</div>
    <div style={{ fontFamily: F.display, fontSize: "34px", color: color || T.w92, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontFamily: F.mono, fontSize: "11px", color: T.w40, marginTop: "8px" }}>{sub}</div>}
    {explain && <div style={{ fontFamily: F.body, fontSize: "11px", color: T.w25, marginTop: "8px", fontStyle: "italic", lineHeight: 1.4 }}>{explain}</div>}
  </Glass>
);
const Divider = () => <div style={{ height: "1px", background: `linear-gradient(90deg,transparent 10%,${T.goldDim} 50%,transparent 90%)`, margin: "12px 0" }} />;
const TABS = [
  { id: "setup", label: "Setup", tier: 0 }, { id: "snapshot", label: "Your Deal", tier: 0 },
  { id: "overview", label: "Overview", tier: 1 }, { id: "waterfall", label: "Waterfall", tier: 1 }, { id: "revenue", label: "Revenue", tier: 1 },
  { id: "budget", label: "Budget", tier: 2 }, { id: "capital", label: "Capital", tier: 2 }, { id: "cashflow", label: "Cash Flow", tier: 2 },
  { id: "sensitivity", label: "Sensitivity", tier: 2 }, { id: "risk", label: "Risk", tier: 2 },
];
const TIER_LABELS = ["START HERE", "THE DEAL", "DEEP DIVE"];
const TBtn = ({ active, children, onClick }) => (
  <button onClick={onClick} style={{ fontFamily: F.display, fontSize: "13px", letterSpacing: "2px", textTransform: "uppercase", background: active ? T.goldGhost : "transparent", color: active ? T.gold : T.w55, border: `1px solid ${active ? T.goldDim : "transparent"}`, borderRadius: "8px", padding: "8px 16px", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" }}>{children}</button>
);

/* Combo Input — text field + slider + benchmark band */
const ComboInput = ({ label, value, onChange, min = 0, max = 100, step = 1, suffix = "%", explain, fmt: fmtFn, benchMin, benchMax }) => (
  <div style={{ marginBottom: "22px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
      <span style={{ fontFamily: F.mono, fontSize: "11px", color: T.w55, letterSpacing: "1px", textTransform: "uppercase" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {suffix !== "%" && <span style={{ fontFamily: F.mono, fontSize: "14px", color: T.gold }}>$</span>}
        <input type="number" value={value} onChange={e => onChange(Number(e.target.value) || 0)} min={min} max={max} step={step}
          style={{ width: suffix === "%" ? "60px" : "120px", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "6px", padding: "6px 8px", color: T.gold, fontFamily: F.mono, fontSize: "14px", fontWeight: 600, outline: "none", textAlign: "right", boxSizing: "border-box" }} />
        {suffix && <span style={{ fontFamily: F.mono, fontSize: "12px", color: T.w40 }}>{suffix}</span>}
      </div>
    </div>
    <div style={{ position: "relative" }}>
      {benchMin != null && benchMax != null && <div style={{ position: "absolute", top: "0", height: "4px", left: `${((benchMin - min) / (max - min)) * 100}%`, width: `${((benchMax - benchMin) / (max - min)) * 100}%`, background: "rgba(212,175,55,0.15)", borderRadius: "2px", pointerEvents: "none" }} />}
      <input type="range" min={min} max={max} step={step} value={Math.min(max, Math.max(min, value))} onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: T.gold, height: "4px", cursor: "pointer" }} />
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.mono, fontSize: "9px", color: T.w25, marginTop: "2px" }}>
      <span>{fmtFn ? fmtFn(min) : `${min}${suffix}`}</span>
      {benchMin != null && <span style={{ color: T.w40 }}>typical: {fmtFn ? fmtFn(benchMin) : benchMin}{suffix}–{fmtFn ? fmtFn(benchMax) : benchMax}{suffix}</span>}
      <span>{fmtFn ? fmtFn(max) : `${max}${suffix}`}</span>
    </div>
    {explain && <div style={{ fontFamily: F.body, fontSize: "11px", color: T.w40, marginTop: "5px", lineHeight: 1.4 }}>{explain}</div>}
  </div>
);
const TextInput = ({ label, value, onChange, explain, placeholder }) => (
  <div style={{ marginBottom: "22px" }}>
    <div style={{ fontFamily: F.mono, fontSize: "11px", color: T.w55, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>{label}</div>
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || label}
      style={{ width: "100%", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "8px", padding: "12px 14px", color: T.w92, fontFamily: F.mono, fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
    {explain && <div style={{ fontFamily: F.body, fontSize: "11px", color: T.w40, marginTop: "4px" }}>{explain}</div>}
  </div>
);
const SelectInput = ({ label, value, onChange, options, explain }) => (
  <div style={{ marginBottom: "22px" }}>
    <div style={{ fontFamily: F.mono, fontSize: "11px", color: T.w55, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>{label}</div>
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "8px", padding: "12px 14px", color: T.w92, fontFamily: F.mono, fontSize: "14px", outline: "none", appearance: "none", cursor: "pointer", boxSizing: "border-box" }}>
      {options.map(o => <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value} style={{ background: "#111", color: "#fff" }}>{typeof o === "string" ? o : o.label}</option>)}
    </select>
    {explain && <div style={{ fontFamily: F.body, fontSize: "11px", color: T.w40, marginTop: "4px" }}>{explain}</div>}
  </div>
);
const SD = ({ title }) => <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "28px 0 18px" }}><div style={{ height: "1px", flex: 1, background: T.goldDim }} /><span style={{ fontFamily: F.display, fontSize: "14px", letterSpacing: "4px", color: T.gold, opacity: 0.6 }}>{title}</span><div style={{ height: "1px", flex: 1, background: T.goldDim }} /></div>;
const CTT = ({ active, payload, label }) => { if (!active || !payload?.length) return null; return <div style={{ background: "rgba(0,0,0,0.95)", border: `1px solid ${T.goldDim}`, borderRadius: "8px", padding: "12px 16px", fontFamily: F.mono, fontSize: "11px" }}><div style={{ color: T.w75, marginBottom: "6px" }}>{label}</div>{payload.map((p, i) => <div key={i} style={{ color: p.color || T.w92, marginBottom: "3px" }}>{p.name}: {typeof p.value === "number" ? fF(Math.abs(p.value)) : p.value}</div>)}</div>; };
const FlowStep = ({ num, label, amount, isLoss, isHighlight, explain }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 0", borderBottom: `1px solid ${T.goldGhost}` }}>
    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: isHighlight ? T.goldGhost : isLoss ? T.redDim : T.greenDim, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.mono, fontSize: "12px", color: isHighlight ? T.gold : isLoss ? T.red : T.green, fontWeight: 700, flexShrink: 0 }}>{num}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: F.body, fontSize: "14px", color: T.w92, fontWeight: isHighlight ? 600 : 400 }}>{label}</div>
      {explain && <div style={{ fontFamily: F.body, fontSize: "11px", color: T.w40, marginTop: "3px", lineHeight: 1.4 }}>{explain}</div>}
    </div>
    {amount != null && <div style={{ fontFamily: F.mono, fontSize: "15px", color: isLoss ? T.red : isHighlight ? T.gold : T.green, fontWeight: 600, whiteSpace: "nowrap" }}>{isLoss ? "−" : ""}{fF(Math.abs(Math.round(amount)))}</div>}
  </div>
);

/* ═══ MAIN ═══ */
export default function App() {
  const defaultInp = { title: "", genre: "Thriller", totalBudget: 2000000, shootState: "GA", taxCreditPct: 0, taxCreditLoanPct: 90, gapMezz: 0, preSaleLoan: 0, minInvestment: 50000, recoupPremium: 20, investorBackend: 50, seniorDebtRate: 9, gapRate: 16, loanTerm: 18, exhibitorPct: 50, paBudget: 150000, distFeePct: 30, saCommPct: 12 };
  const [inp, setInp] = useState(defaultInp);
  const [crew, setCrew] = useState({ producer: "", director: "", writer: "", cast: "" });
  const [logline, setLogline] = useState("");
  const [sagTier, setSagTier] = useState("Modified Low Budget");
  const [isUnion, setIsUnion] = useState(true);
  const [bondOn, setBondOn] = useState(false);
  const [bondPct, setBondPct] = useState(2.5);
  const [distPreset, setDistPreset] = useState("Limited Theatrical");
  const [budgetEdits, setBudgetEdits] = useState({});
  const [tab, setTab] = useState(0);
  const [wizStep, setWizStep] = useState(0);
  const [scenario, setScenario] = useState(3500000);
  const [expandedRisk, setExpandedRisk] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [tabAnim, setTabAnim] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => { setMounted(true); const c = () => setIsMobile(window.innerWidth < 1024); c(); window.addEventListener("resize", c); return () => window.removeEventListener("resize", c); }, []);
  const switchTab = i => { setTabAnim(false); setTimeout(() => { setTab(i); setTabAnim(true); }, 50); };
  const s = useCallback((k, v) => setInp(p => ({ ...p, [k]: v })), []);
  const d = useMemo(() => derive(inp, budgetEdits, bondOn, bondPct), [inp, budgetEdits, bondOn, bondPct]);
  const wf = useMemo(() => d.calcWF(scenario), [d, scenario]);
  const wfBase = useMemo(() => d.calcWF(d.rt.base), [d]);
  const wfCon = useMemo(() => d.calcWF(d.rt.conservative), [d]);
  const wfUp = useMemo(() => d.calcWF(d.rt.upside), [d]);
  const wb = useMemo(() => {
    const items = [{ n: "Gross Rev", v: wf.gr, f: T.gold, t: "total" }, { n: "Exhibitor", v: wf.et, f: "rgba(220,38,38,0.5)", t: "loss" }, { n: "P&A", v: wf.pa, f: "rgba(220,38,38,0.5)", t: "loss" }, { n: "Dist Fee", v: wf.df, f: "rgba(220,38,38,0.5)", t: "loss" }, { n: "SA Comm", v: wf.sc, f: "rgba(220,38,38,0.5)", t: "loss" }, { n: "Debt", v: wf.dr + wf.gp, f: "rgba(220,38,38,0.5)", t: "loss" }, { n: "Recoup", v: wf.ir, f: T.goldDim, t: "loss" }, { n: "Inv Back", v: wf.ib, f: T.green, t: "gain" }, { n: "Prod Back", v: wf.pb, f: T.purple, t: "gain" }].filter(i => i.v > 0 || i.t === "total");
    let r = 0; return items.map(i => { if (i.t === "total") { r = i.v; return { name: i.n, base: 0, value: i.v, fill: i.f }; } else if (i.t === "loss") { r -= i.v; return { name: i.n, base: Math.max(0, r), value: i.v, fill: i.f }; } else { return { name: i.n, base: 0, value: i.v, fill: i.f }; } });
  }, [wf]);
  const sR = [500000, 1000000, 1500000, 2500000, 3500000, 5000000];
  const sE = [Math.round(d.eq * .6), Math.round(d.eq * .8), d.eq, Math.round(d.eq * 1.15), Math.round(d.eq * 1.45)];
  const cSR = (rev, eq) => { const w = d.calcWF(rev); const r = d.eq > 0 ? eq / d.eq : 0; return d.eq > 0 ? ((w.tr * r) - eq) / eq : -1; };
  const ht = inp.title.trim().length > 0;
  const tid = TABS[tab]?.id;
  const findBE = useMemo(() => { let lo = 0, hi = 2e7; for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; d.calcWF(mid).tr >= d.eq ? hi = mid : lo = mid; } return Math.round((lo + hi) / 2); }, [d]);
  const find2x = useMemo(() => { let lo = 0, hi = 4e7; for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; d.calcWF(mid).tr >= d.eq * 2 ? hi = mid : lo = mid; } return Math.round((lo + hi) / 2); }, [d]);
  const stateData = STATES.find(st => st.id === inp.shootState) || STATES[12];
  const warnings = useMemo(() => { const w = []; if (d.eq > d.actualBudget * .6) w.push(`Equity is ${Math.round(d.eq / d.actualBudget * 100)}% of budget.`); if (inp.paBudget > inp.totalBudget * .4) w.push("P&A exceeds 40% of budget."); if (inp.recoupPremium > 30) w.push(`${inp.recoupPremium}% premium is above standard (15-25%).`); if (inp.taxCreditPct === 0) w.push("No tax incentive entered."); return w; }, [inp, d]);
  const wizSteps = ["Your Film", "Funding Sources", "Investor Terms", "Distribution"];
  const applyDistPreset = name => { const p = DIST_PRESETS[name]; if (p) { s("exhibitorPct", p.exhib); s("paBudget", p.pa); s("distFeePct", p.distFee); s("saCommPct", p.saComm); setDistPreset(name); } };
  const resetProject = () => { setInp(defaultInp); setCrew({ producer: "", director: "", writer: "", cast: "" }); setLogline(""); setBondOn(false); setBondPct(2.5); setBudgetEdits({}); setDistPreset("Limited Theatrical"); setWizStep(0); setScenario(3500000); switchTab(0); };
  const contentStyle = { opacity: tabAnim ? 1 : 0, transform: tabAnim ? "translateY(0)" : "translateY(12px)", transition: "opacity 0.25s ease, transform 0.25s ease" };

  /* MOBILE GATE */
  if (isMobile) return (
    <div style={{ background: T.bg, backgroundImage: grainSVG, color: T.w92, fontFamily: F.body, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
      <div style={{ fontFamily: F.display, fontSize: "12px", letterSpacing: "6px", color: T.gold, opacity: 0.5, marginBottom: "12px" }}>FILMMAKER.OG</div>
      <div style={{ fontFamily: F.display, fontSize: "28px", color: T.w92, lineHeight: 1.2, marginBottom: "16px" }}>BUILT FOR DESKTOP</div>
      <div style={{ fontFamily: F.body, fontSize: "14px", color: T.w55, lineHeight: 1.6, maxWidth: "320px" }}>The charts, financial models, and investor-ready exports need a full screen. Open on your laptop.</div>
    </div>
  );

  return (
    <div style={{ background: T.bg, backgroundImage: grainSVG, color: T.w92, fontFamily: F.body, minHeight: "100vh", padding: "32px 40px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: "28px", opacity: mounted ? 1 : 0, transition: "opacity 0.6s" }}>
        <div style={{ fontFamily: F.display, fontSize: "12px", letterSpacing: "6px", color: T.gold, opacity: 0.5, marginBottom: "6px" }}>INDIE FILM FINANCE PLAN</div>
        <div style={{ fontFamily: F.display, fontSize: "42px", color: T.w92, lineHeight: 1.1 }}>{ht ? inp.title.toUpperCase() : fmt(inp.totalBudget) + " PRODUCTION"}</div>
        {tid !== "setup" && <div style={{ fontFamily: F.mono, fontSize: "12px", color: T.w40, marginTop: "8px" }}>{fF(d.eq)} Equity · {inp.genre} · {stateData.name}{inp.taxCreditPct > 0 ? ` · ${fmt(d.tc)} Tax Credit` : ""}</div>}
      </div>

      {/* NAV */}
      <div style={{ marginBottom: "24px", borderBottom: `1px solid ${T.goldGhost}`, paddingBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>{[0, 1, 2].map(tier => <div key={tier} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: tier < 2 ? "8px" : "0" }}><span style={{ fontFamily: F.mono, fontSize: "9px", color: T.w25, letterSpacing: "1.5px", textTransform: "uppercase", minWidth: "72px" }}>{TIER_LABELS[tier]}</span>{TABS.filter(t => t.tier === tier).map(t => { const idx = TABS.indexOf(t); return <TBtn key={t.id} active={tab === idx} onClick={() => switchTab(idx)}>{t.label}</TBtn>; })}</div>)}</div>
        <button onClick={resetProject} style={{ background: "none", border: "none", fontFamily: F.mono, fontSize: "10px", color: T.w25, cursor: "pointer", padding: "4px 8px" }}>Reset Project</button>
      </div>

      <div style={contentStyle}>
        {/* SETUP */}
        {tid === "setup" && <div style={{ maxWidth: "580px", margin: "0 auto" }}><Glass tier="primary">
          <div style={{ textAlign: "center", marginBottom: "12px" }}>
            <div style={{ fontFamily: F.display, fontSize: "26px", color: T.w92 }}>BUILD YOUR MODEL</div>
            <div style={{ fontFamily: F.body, fontSize: "13px", color: T.w40, marginTop: "6px" }}>Step {wizStep + 1} of 4 — {wizSteps[wizStep]}</div>
          </div>
          <div style={{ height: "3px", background: T.goldGhost, borderRadius: "2px", margin: "16px 0 28px", overflow: "hidden" }}><div style={{ height: "100%", width: `${((wizStep + 1) / 4) * 100}%`, background: `linear-gradient(90deg,${T.gold},${T.goldBright})`, borderRadius: "2px", transition: "width 0.3s" }} /></div>

          {wizStep === 0 && <>
            <TextInput label="Project Title" value={inp.title} onChange={v => s("title", v)} explain="As it appears in legal documents and pitch materials" />
            <TextInput label="Logline (Optional)" value={logline} onChange={setLogline} placeholder="One-sentence description" explain="Appears on your Snapshot" />
            <SelectInput label="Genre" value={inp.genre} onChange={v => s("genre", v)} options={GENRES} explain="Drives revenue benchmarks" />
            <SD title="CREATIVE TEAM" />
            <TextInput label="Producer(s)" value={crew.producer} onChange={v => setCrew(p => ({ ...p, producer: v }))} placeholder="Lead producer" />
            <TextInput label="Director" value={crew.director} onChange={v => setCrew(p => ({ ...p, director: v }))} placeholder="Director or TBD" />
            <TextInput label="Writer(s)" value={crew.writer} onChange={v => setCrew(p => ({ ...p, writer: v }))} placeholder="Screenwriter(s)" />
            <TextInput label="Lead Cast" value={crew.cast} onChange={v => setCrew(p => ({ ...p, cast: v }))} placeholder="Attached or TBD" />
            <SD title="PRODUCTION" />
            <SelectInput label="Shoot State" value={inp.shootState} onChange={v => s("shootState", v)} options={STATES.map(st => ({ value: st.id, label: st.name }))} explain="Used for tax credit guidance — does not auto-fill" />
            <ComboInput label="Total Production Budget" value={inp.totalBudget} onChange={v => s("totalBudget", v)} min={250000} max={10000000} step={50000} suffix="" fmt={fmt} explain="All-in: cast, crew, post, insurance, contingency" benchMin={1000000} benchMax={5000000} />
          </>}

          {wizStep === 1 && <>
            <div style={{ background: T.goldGhost, border: `1px solid ${T.goldDim}`, borderRadius: "10px", padding: "14px 16px", marginBottom: "22px" }}>
              <div style={{ fontFamily: F.mono, fontSize: "10px", color: T.gold, letterSpacing: "1px" }}>{stateData.name.toUpperCase()} — {stateData.type.toUpperCase()}</div>
              <div style={{ fontFamily: F.body, fontSize: "12px", color: T.w55, marginTop: "6px", lineHeight: 1.5 }}>{stateData.note}</div>
              <div style={{ fontFamily: F.body, fontSize: "11px", color: T.w40, marginTop: "6px", fontStyle: "italic" }}>Enter the rate you're modeling. Consult a production tax attorney to confirm qualification.</div>
            </div>
            <ComboInput label="Tax Credit Rate You're Modeling" value={inp.taxCreditPct} onChange={v => s("taxCreditPct", v)} min={0} max={45} explain={`= ${fF(Math.round(inp.totalBudget * inp.taxCreditPct / 100))} — Use the base rate as a conservative assumption.`} benchMin={stateData.id !== "OTHER" ? Math.max(0, stateData.rate - 5) : undefined} benchMax={stateData.id !== "OTHER" ? stateData.rate + 10 : undefined} />
            <ComboInput label="Tax Credit Loan Advance" value={inp.taxCreditLoanPct} onChange={v => s("taxCreditLoanPct", v)} min={0} max={100} explain={`= ${fF(Math.round(inp.totalBudget * inp.taxCreditPct / 100 * inp.taxCreditLoanPct / 100))} senior debt — Most banks advance 90%.`} benchMin={85} benchMax={95} />
            <ComboInput label="Gap / Mezz Financing" value={inp.gapMezz} onChange={v => s("gapMezz", v)} min={0} max={Math.round(inp.totalBudget * .2)} step={10000} suffix="" fmt={fmt} explain="Second-priority loan. Most projects don't need it." />
            <ComboInput label="Pre-Sale Loan" value={inp.preSaleLoan} onChange={v => s("preSaleLoan", v)} min={0} max={Math.round(inp.totalBudget * .25)} step={10000} suffix="" fmt={fmt} explain="Requires a sales agent with executed MGs. $0 if none." />
            <div style={{ background: T.goldGhost, border: `2px solid ${T.goldDim}`, borderRadius: "12px", padding: "20px", textAlign: "center", margin: "12px 0" }}>
              <div style={{ fontFamily: F.mono, fontSize: "10px", color: T.w55, letterSpacing: "2px" }}>EQUITY RAISE NEEDED</div>
              <div style={{ fontFamily: F.display, fontSize: "48px", color: T.equity, lineHeight: 1.1, marginTop: "6px" }}>{fF(d.eq)}</div>
              <div style={{ fontFamily: F.body, fontSize: "12px", color: T.w40, marginTop: "8px" }}>Cash needed from investors</div>
              <div style={{ fontFamily: F.mono, fontSize: "11px", color: T.w25, marginTop: "4px" }}>~{d.estInv} investors at {fF(inp.minInvestment)} min</div>
            </div>
            <ComboInput label="Min Investment per Investor" value={inp.minInvestment} onChange={v => s("minInvestment", v)} min={10000} max={250000} step={5000} suffix="" fmt={fmt} explain="Smallest check you'll accept." benchMin={25000} benchMax={100000} />
          </>}

          {wizStep === 2 && <>
            <ComboInput label="Recoupment Premium" value={inp.recoupPremium} onChange={v => s("recoupPremium", v)} min={0} max={40} explain={`Investors get ${100 + inp.recoupPremium}% back before profit. 20% is standard.`} benchMin={15} benchMax={25} />
            <ComboInput label="Investor Backend Split" value={inp.investorBackend} onChange={v => s("investorBackend", v)} min={20} max={80} explain={`Profit: ${inp.investorBackend}% investors / ${100 - inp.investorBackend}% you. 50/50 typical.`} benchMin={40} benchMax={50} />
            <ComboInput label="Senior Debt Rate" value={inp.seniorDebtRate} onChange={v => s("seniorDebtRate", v)} min={5} max={18} step={.5} explain="Tax credit bridge loan rate. 8-12% typical." benchMin={8} benchMax={12} />
            {inp.gapMezz > 0 && <ComboInput label="Gap Loan Rate" value={inp.gapRate} onChange={v => s("gapRate", v)} min={8} max={24} step={.5} explain="Higher risk = higher rate. 12-20% typical." benchMin={12} benchMax={20} />}
            <ComboInput label="Loan Term" value={inp.loanTerm} onChange={v => s("loanTerm", v)} min={6} max={48} suffix=" mo" explain="Time to repay from distribution." benchMin={12} benchMax={36} />
            <SD title="PRODUCTION REQUIREMENTS" />
            <div style={{ display: "flex", gap: "16px", marginBottom: "22px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.mono, fontSize: "11px", color: T.w55, letterSpacing: "1px", marginBottom: "6px" }}>COMPLETION BOND</div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button onClick={() => setBondOn(!bondOn)} style={{ width: "48px", height: "26px", borderRadius: "13px", background: bondOn ? T.gold : "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", position: "relative" }}><div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#fff", position: "absolute", top: "3px", left: bondOn ? "25px" : "3px", transition: "left 0.2s" }} /></button>
                  <span style={{ fontFamily: F.mono, fontSize: "12px", color: bondOn ? T.gold : T.w40 }}>{bondOn ? "ON" : "OFF"}</span>
                </div>
                <div style={{ fontFamily: F.body, fontSize: "11px", color: T.w40, marginTop: "4px" }}>Required by most lenders. Skip to save 2-3%.</div>
              </div>
              {bondOn && <div style={{ flex: 1 }}><ComboInput label="Bond %" value={bondPct} onChange={setBondPct} min={1.5} max={4} step={.5} explain={`= ${fF(Math.round(inp.totalBudget * bondPct / 100))}`} benchMin={2} benchMax={3} /></div>}
            </div>
            <SelectInput label="SAG-AFTRA Tier" value={sagTier} onChange={setSagTier} options={["Ultra Low Budget", "Modified Low Budget", "Low Budget", "Standard"]} explain="Guild minimums affect cast budget — confirm with line producer." />
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "22px" }}>
              <span style={{ fontFamily: F.mono, fontSize: "11px", color: T.w55, letterSpacing: "1px" }}>UNION</span>
              <button onClick={() => setIsUnion(!isUnion)} style={{ width: "48px", height: "26px", borderRadius: "13px", background: isUnion ? T.gold : "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", position: "relative" }}><div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#fff", position: "absolute", top: "3px", left: isUnion ? "25px" : "3px", transition: "left 0.2s" }} /></button>
              <span style={{ fontFamily: F.mono, fontSize: "12px", color: isUnion ? T.gold : T.w40 }}>{isUnion ? "UNION" : "NON-UNION"}</span>
            </div>
          </>}

          {wizStep === 3 && <>
            <div style={{ fontFamily: F.body, fontSize: "13px", color: T.w55, marginBottom: "16px" }}>Choose a strategy to auto-fill, then adjust.</div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>{Object.keys(DIST_PRESETS).map(n => <button key={n} onClick={() => applyDistPreset(n)} style={{ flex: 1, background: distPreset === n ? T.goldGhost : "transparent", border: `1px solid ${distPreset === n ? T.goldDim : T.goldGhost}`, borderRadius: "10px", padding: "12px", cursor: "pointer", textAlign: "left" }}><div style={{ fontFamily: F.mono, fontSize: "11px", color: distPreset === n ? T.gold : T.w55, fontWeight: 600 }}>{n}</div><div style={{ fontFamily: F.body, fontSize: "10px", color: T.w25, marginTop: "4px", lineHeight: 1.4 }}>{DIST_PRESETS[n].desc}</div></button>)}</div>
            <ComboInput label="Exhibitor Split" value={inp.exhibitorPct} onChange={v => s("exhibitorPct", v)} min={0} max={60} explain="Theater's cut. 0% for streaming-only." benchMin={45} benchMax={55} />
            <ComboInput label="P&A / Marketing" value={inp.paBudget} onChange={v => s("paBudget", v)} min={0} max={Math.round(inp.totalBudget * .5)} step={10000} suffix="" fmt={fmt} explain="Distributor's spend recouped from revenue — not your check. $0 for streaming." />
            <ComboInput label="Distribution Fee" value={inp.distFeePct} onChange={v => s("distFeePct", v)} min={10} max={40} explain="Distributor's commission. 25-35% typical." benchMin={25} benchMax={35} />
            <ComboInput label="Sales Agent Commission" value={inp.saCommPct} onChange={v => s("saCommPct", v)} min={5} max={20} explain="Agent's fee on international. 10-15% typical." benchMin={10} benchMax={15} />
            {warnings.length > 0 && <div style={{ background: T.amberDim, border: "1px solid rgba(245,158,11,0.3)", borderRadius: "10px", padding: "14px 16px", margin: "16px 0" }}>{warnings.map((w, i) => <div key={i} style={{ fontFamily: F.body, fontSize: "12px", color: T.amber, marginBottom: i < warnings.length - 1 ? "8px" : 0, lineHeight: 1.4 }}>⚠ {w}</div>)}</div>}
          </>}

          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            {wizStep > 0 && <button onClick={() => setWizStep(w => w - 1)} style={{ flex: 1, padding: "16px", background: "transparent", border: `1px solid ${T.goldDim}`, borderRadius: "10px", fontFamily: F.display, fontSize: "16px", letterSpacing: "2px", color: T.gold, cursor: "pointer" }}>← BACK</button>}
            {wizStep < 3
              ? <button onClick={() => setWizStep(w => w + 1)} style={{ flex: 1, padding: "16px", background: T.goldGhost, border: `1px solid ${T.goldDim}`, borderRadius: "10px", fontFamily: F.display, fontSize: "16px", letterSpacing: "2px", color: T.gold, cursor: "pointer" }}>NEXT →</button>
              : <button onClick={() => switchTab(1)} style={{ flex: 1, padding: "16px", background: `linear-gradient(135deg,${T.gold},${T.goldBright})`, border: "none", borderRadius: "10px", fontFamily: F.display, fontSize: "18px", letterSpacing: "3px", color: "#000", cursor: "pointer", fontWeight: 700 }}>VIEW YOUR DEAL →</button>}
          </div>
        </Glass></div>}

        {/* SNAPSHOT */}
        {tid === "snapshot" && <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "720px", margin: "0 auto" }}>
          <Glass tier="primary"><SL>The Project</SL>
            {logline ? <div style={{ fontFamily: F.body, fontSize: "15px", color: T.w75, fontStyle: "italic", marginBottom: "12px", lineHeight: 1.5 }}>"{logline}"</div> : <input type="text" value={logline} onChange={e => setLogline(e.target.value)} placeholder="Add a one-line description (optional)" style={{ width: "100%", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "8px", padding: "10px 14px", color: T.w75, fontFamily: F.body, fontSize: "13px", outline: "none", boxSizing: "border-box", fontStyle: "italic", marginBottom: "12px" }} />}
            <div style={{ fontFamily: F.body, fontSize: "15px", color: T.w92, lineHeight: 1.7 }}>You're making a <strong style={{ color: T.gold }}>{inp.genre}</strong> film with a budget of <strong style={{ color: T.gold }}>{fF(d.actualBudget)}</strong>. You need <strong style={{ color: T.equity }}>{fF(d.eq)}</strong> from investors — roughly <strong>{d.estInv} investors</strong> at {fF(inp.minInvestment)} each.</div>
            {(crew.producer || crew.director || crew.writer || crew.cast) && <div style={{ marginTop: "12px", display: "flex", gap: "16px", flexWrap: "wrap" }}>{[{ l: "Producer", v: crew.producer }, { l: "Director", v: crew.director }, { l: "Writer", v: crew.writer }, { l: "Cast", v: crew.cast }].filter(x => x.v).map(x => <div key={x.l}><div style={{ fontFamily: F.mono, fontSize: "9px", color: T.w25, letterSpacing: "1px" }}>{x.l.toUpperCase()}</div><div style={{ fontFamily: F.body, fontSize: "13px", color: T.w75, marginTop: "2px" }}>{x.v}</div></div>)}</div>}
          </Glass>
          <Glass><SL sub="Production cash sources = budget uses. These must balance.">Sources & Uses</SL>
            <div style={{ display: "flex", gap: "24px", marginTop: "12px" }}>
              <div style={{ flex: 1 }}><div style={{ fontFamily: F.mono, fontSize: "11px", color: T.gold, letterSpacing: "2px", marginBottom: "10px" }}>SOURCES</div>{d.sources.map(c => <div key={c.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.goldGhost}` }}><span style={{ fontFamily: F.body, fontSize: "13px", color: T.w75 }}>{c.name}</span><span style={{ fontFamily: F.mono, fontSize: "13px", color: c.color }}>{fF(c.amount)}</span></div>)}<div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: `2px solid ${T.goldDim}`, marginTop: "4px" }}><span style={{ fontFamily: F.body, fontSize: "14px", color: T.w92, fontWeight: 600 }}>Total</span><span style={{ fontFamily: F.mono, fontSize: "14px", color: T.w92, fontWeight: 600 }}>{fF(d.sources.reduce((s, c) => s + c.amount, 0))}</span></div></div>
              <div style={{ width: "1px", background: T.goldGhost }} />
              <div style={{ flex: 1 }}><div style={{ fontFamily: F.mono, fontSize: "11px", color: T.gold, letterSpacing: "2px", marginBottom: "10px" }}>USES</div>{d.bd.map(c => <div key={c.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.goldGhost}` }}><span style={{ fontFamily: F.body, fontSize: "13px", color: T.w75 }}>{c.name}</span><span style={{ fontFamily: F.mono, fontSize: "13px", color: T.w75 }}>{fF(c.value)}</span></div>)}<div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: `2px solid ${T.goldDim}`, marginTop: "4px" }}><span style={{ fontFamily: F.body, fontSize: "14px", color: T.w92, fontWeight: 600 }}>Total</span><span style={{ fontFamily: F.mono, fontSize: "14px", color: T.w92, fontWeight: 600 }}>{fF(d.bd.reduce((s, c) => s + c.value, 0))}</span></div></div>
            </div>
          </Glass>
          {/* Thermometer */}
          <Glass tier="primary"><SL sub="Revenue needed at each outcome level.">What Has to Happen</SL>
            {(() => { const mx = Math.max(d.rt.upside, find2x) * 1.15; const mk = [{ l: "Breakeven", v: findBE, c: T.amber }, { l: "Base", v: d.rt.base, c: T.gold }, { l: "Upside", v: d.rt.upside, c: T.green }]; if (find2x < mx * .95) mk.push({ l: "2×", v: find2x, c: T.goldBright }); return <div style={{ marginTop: "16px" }}><div style={{ position: "relative", height: "40px", background: T.goldGhost, borderRadius: "8px", overflow: "hidden" }}><div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${Math.min(95, (d.rt.base / mx) * 100)}%`, background: "linear-gradient(90deg,rgba(60,179,113,0.12),rgba(212,175,55,0.18))", borderRadius: "8px" }} />{mk.map(m => <div key={m.l} style={{ position: "absolute", left: `${Math.min(97, (m.v / mx) * 100)}%`, top: 0, height: "100%", width: "2px", background: m.c, opacity: 0.9 }} />)}</div><div style={{ position: "relative", height: "56px", marginTop: "6px" }}>{mk.map(m => <div key={m.l} style={{ position: "absolute", left: `${Math.min(88, Math.max(2, (m.v / mx) * 100))}%`, textAlign: "center", transform: "translateX(-50%)" }}><div style={{ fontFamily: F.mono, fontSize: "10px", color: m.c, fontWeight: 700 }}>{m.l}</div><div style={{ fontFamily: F.mono, fontSize: "12px", color: T.w55 }}>{fmt(m.v)}</div></div>)}</div></div>; })()}
            <div style={{ fontFamily: F.body, fontSize: "15px", color: T.w75, lineHeight: 1.7 }}>At <strong>Base Case</strong>, investors receive <strong style={{ color: wfBase.moic >= 1 ? T.green : T.red }}>{fF(Math.round(wfBase.tr))}</strong> on {fF(d.eq)} — a <strong style={{ color: wfBase.moic >= 1 ? T.green : T.red }}>{wfBase.moic.toFixed(2)}× return</strong>.{wfBase.moic < 1 && " Partial loss."}{wfBase.moic >= 1 && wfBase.moic < 1.5 && " Capital recovered."}{wfBase.moic >= 1.5 && " Strong return."}</div>
          </Glass>
          {/* Flow */}
          <Glass><SL sub="Every dollar passes through deductions in this order.">How Investors Get Paid</SL>
            <FlowStep num="1" label="Your film earns revenue" explain="Streaming, theatrical, international, TV" amount={wfBase.gr} />
            <FlowStep num="2" label={wfBase.hasTh ? "Theaters and distributors take their cut" : "Distributor and sales agent take their fees"} explain={wfBase.hasTh ? `Exhibitors (~${inp.exhibitorPct}%), distributor (~${inp.distFeePct}%), P&A (distributor's spend, not yours), SA commission` : `Distributor fee (~${inp.distFeePct}%) and SA commission (~${inp.saCommPct}%). No theatrical deductions.`} amount={-(wfBase.et + wfBase.pa + wfBase.df + wfBase.sc)} isLoss />
            <FlowStep num="3" label="Net Producer Proceeds" explain="Money reaching your production company" amount={wfBase.npp} isHighlight />
            <FlowStep num="4" label="Loans repaid first" explain="Senior debt + gap financing, first priority" amount={-(wfBase.dr + wfBase.gp)} isLoss />
            <FlowStep num="5" label={`Investors get ${100 + inp.recoupPremium}% back`} explain={`${fF(d.eq)} + ${inp.recoupPremium}% = ${fF(Math.round(d.eq * (1 + inp.recoupPremium / 100)))}`} amount={-wfBase.ir} isLoss />
            <FlowStep num="6" label={`Profit splits ${inp.investorBackend}/${100 - inp.investorBackend}`} explain={`${inp.investorBackend}% investors / ${100 - inp.investorBackend}% filmmaker`} amount={wfBase.ib + wfBase.pb} />
          </Glass>
          {/* Risk */}
          <Glass tier="recessed"><SL>The Risk</SL>
            {RISKS.filter(r => r.score >= 1.2).sort((a, b) => b.score - a.score).slice(0, 3).map((r, i) => <div key={i} style={{ padding: "10px 0", borderBottom: `1px solid ${T.goldGhost}` }}><div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ fontFamily: F.mono, fontSize: "11px", color: T.red, fontWeight: 700, minWidth: "34px" }}>{r.prob}%</span><span style={{ fontFamily: F.body, fontSize: "13px", color: T.w92 }}>{r.name}</span></div><div style={{ fontFamily: F.body, fontSize: "11px", color: T.w55, marginTop: "4px", marginLeft: "44px", fontStyle: "italic" }}>{r.mit}</div></div>)}
            <div style={{ fontFamily: F.body, fontSize: "13px", color: T.red, marginTop: "14px", fontWeight: 500, opacity: 0.85 }}>It is possible to lose the entire investment.</div>
          </Glass>
          {/* Opportunity */}
          <Glass tier="primary" style={{ borderColor: T.goldDim }}><SL>The Opportunity</SL>
            <div style={{ fontFamily: F.body, fontSize: "14px", color: T.w75, lineHeight: 1.7 }}>At <strong style={{ color: T.green }}>Upside</strong> ({fF(d.rt.upside)}), investors receive <strong style={{ color: T.green }}>{fF(Math.round(wfUp.tr))}</strong> — <strong style={{ color: T.green }}>{wfUp.moic.toFixed(2)}×</strong>. Capital at risk drops from {fF(d.actualBudget)} to <strong style={{ color: T.equity }}>{fF(d.eq)}</strong> — <strong style={{ color: T.equity }}>{Math.round((1 - d.eq / d.actualBudget) * 100)}% reduction</strong>.</div>
            <div style={{ fontFamily: F.body, fontSize: "12px", color: T.w40, marginTop: "12px", fontStyle: "italic" }}>Stress-tested range: total loss to {wfUp.moic.toFixed(1)}×.</div>
          </Glass>
          <div style={{ fontFamily: F.body, fontSize: "11px", color: T.w25, textAlign: "center", lineHeight: 1.5, maxWidth: "520px", margin: "0 auto" }}>Illustrative projections from genre-comparable data. Not financial, legal, or tax advice. Verify with qualified professionals.</div>
          <div style={{ textAlign: "center", marginTop: "8px" }}><button onClick={() => switchTab(2)} style={{ background: "transparent", border: `1px solid ${T.goldDim}`, borderRadius: "8px", padding: "12px 28px", fontFamily: F.display, fontSize: "14px", letterSpacing: "3px", color: T.gold, cursor: "pointer" }}>EXPLORE FULL MODEL →</button></div>
        </div>}

        {/* OVERVIEW */}
        {tid === "overview" && <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <Glass tier="recessed" style={{ padding: "14px 20px" }}><div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}><span style={{ fontFamily: F.mono, fontSize: "10px", color: T.gold, letterSpacing: "2px" }}>QUICK ADJUST</span><div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ fontFamily: F.mono, fontSize: "10px", color: T.w40 }}>State:</span><select value={inp.shootState} onChange={e => s("shootState", e.target.value)} style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "6px", padding: "4px 8px", color: T.w92, fontFamily: F.mono, fontSize: "11px", outline: "none" }}>{STATES.map(st => <option key={st.id} value={st.id} style={{ background: "#111" }}>{st.name}</option>)}</select></div><div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ fontFamily: F.mono, fontSize: "10px", color: T.w40 }}>Strategy:</span><select value={distPreset} onChange={e => applyDistPreset(e.target.value)} style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "6px", padding: "4px 8px", color: T.w92, fontFamily: F.mono, fontSize: "11px", outline: "none" }}>{Object.keys(DIST_PRESETS).map(n => <option key={n} value={n} style={{ background: "#111" }}>{n}</option>)}</select></div><div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ fontFamily: F.mono, fontSize: "10px", color: T.w40 }}>Bond:</span><button onClick={() => setBondOn(!bondOn)} style={{ background: bondOn ? T.goldGhost : "transparent", border: `1px solid ${bondOn ? T.goldDim : T.goldGhost}`, borderRadius: "6px", padding: "4px 10px", fontFamily: F.mono, fontSize: "10px", color: bondOn ? T.gold : T.w40, cursor: "pointer" }}>{bondOn ? "ON" : "OFF"}</button></div></div></Glass>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}><KPI label="Budget" value={fmt(d.actualBudget)} /><KPI label="Equity" value={fmt(d.eq)} color={T.equity} /><KPI label="Tax Credit" value={fmt(d.tc)} color={T.green} sub={`${stateData.name} @ ${inp.taxCreditPct}%`} /><KPI label="Base MOIC" value={wfBase.moic.toFixed(2) + "×"} color={wfBase.moic >= 1 ? T.green : T.red} /></div>
          <Divider />
          <Glass><SL>Capital Stack</SL><div style={{ display: "flex", height: "36px", borderRadius: "8px", overflow: "hidden", marginTop: "12px" }}>{d.cs.map(c => <div key={c.name} style={{ width: `${(c.amount / (d.actualBudget + d.tc)) * 100}%`, background: c.color, opacity: 0.8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.mono, fontSize: "11px", color: "#000", fontWeight: 600 }}>{c.amount >= d.actualBudget * .08 ? fmt(c.amount) : ""}</div>)}</div><div style={{ display: "flex", gap: "18px", marginTop: "10px", flexWrap: "wrap" }}>{d.cs.map(c => <div key={c.name} style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: 9, height: 9, borderRadius: "50%", background: c.color }} /><span style={{ fontFamily: F.mono, fontSize: "11px", color: T.w55 }}>{c.name}</span></div>)}</div></Glass>
          <div style={{ display: "flex", gap: "14px" }}>
            <Glass style={{ flex: 1 }}><SL>Revenue</SL><div style={{ display: "flex", gap: "14px", marginTop: "12px" }}>{[{ l: "Conservative", v: d.rt.conservative, c: T.red }, { l: "Base", v: d.rt.base, c: T.gold }, { l: "Upside", v: d.rt.upside, c: T.green }].map(x => <div key={x.l} style={{ flex: 1, textAlign: "center" }}><div style={{ fontFamily: F.mono, fontSize: "9px", color: T.w40, letterSpacing: "1px" }}>{x.l}</div><div style={{ fontFamily: F.display, fontSize: "30px", color: x.c, lineHeight: 1.2, marginTop: "4px" }}>{fmt(x.v)}</div></div>)}</div></Glass>
            <Glass style={{ flex: 1 }}><SL>Budget</SL><div style={{ display: "flex", alignItems: "center", gap: "20px" }}><div style={{ width: 130, height: 130, position: "relative" }}><ResponsiveContainer><PieChart><Pie data={d.bd} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={58} stroke="none">{d.bd.map((e, i) => <Cell key={i} fill={e.color} opacity={0.8} />)}</Pie></PieChart></ResponsiveContainer><div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}><div style={{ fontFamily: F.mono, fontSize: "7px", color: T.gold, letterSpacing: "1.5px" }}>TOTAL</div><div style={{ fontFamily: F.display, fontSize: "16px", color: T.w92 }}>{fmt(d.actualBudget)}</div></div></div><div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>{d.bd.map(e => <div key={e.name} style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: 8, height: 8, borderRadius: "2px", background: e.color, opacity: 0.8 }} /><span style={{ fontFamily: F.mono, fontSize: "10px", color: T.w55, minWidth: "90px" }}>{e.name}</span><span style={{ fontFamily: F.mono, fontSize: "10px", color: T.w75 }}>{fmt(e.value)}</span></div>)}</div></div></Glass>
          </div>
        </div>}

        {/* WATERFALL */}
        {tid === "waterfall" && <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <Glass tier="primary"><SL>Revenue Scenario</SL>
            <div style={{ fontFamily: F.mono, fontSize: "12px", color: T.w55, marginBottom: "8px" }}>Gross: <span style={{ color: T.gold, fontSize: "22px", fontFamily: F.display }}>{fF(scenario)}</span></div>
            <input type="range" min={250000} max={Math.max(1e7, inp.totalBudget * 5)} step={50000} value={scenario} onChange={e => setScenario(Number(e.target.value))} style={{ width: "100%", accentColor: T.gold, height: "4px", cursor: "pointer" }} />
            <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>{[{ l: "Conservative", v: d.rt.conservative, desc: "Soft market", moic: wfCon.moic }, { l: "Base Case", v: d.rt.base, desc: "Standard acquisition", moic: wfBase.moic }, { l: "Upside", v: d.rt.upside, desc: "Competitive bidding", moic: wfUp.moic }].map(x => <button key={x.l} onClick={() => setScenario(x.v)} style={{ flex: 1, background: scenario === x.v ? T.goldGhost : "transparent", border: `1px solid ${scenario === x.v ? T.goldDim : T.goldGhost}`, borderLeft: scenario === x.v ? `3px solid ${T.gold}` : undefined, borderRadius: "10px", padding: "14px", cursor: "pointer", textAlign: "left" }}><div style={{ fontFamily: F.mono, fontSize: "12px", color: scenario === x.v ? T.gold : T.w55, fontWeight: 600 }}>{x.l}</div><div style={{ fontFamily: F.display, fontSize: "22px", color: scenario === x.v ? T.w92 : T.w55, marginTop: "4px" }}>{fmt(x.v)}</div><div style={{ fontFamily: F.mono, fontSize: "11px", color: x.moic >= 1 ? T.green : T.red, marginTop: "4px" }}>{x.moic.toFixed(2)}× MOIC</div><div style={{ fontFamily: F.body, fontSize: "10px", color: T.w25, marginTop: "4px" }}>{x.desc}</div></button>)}</div>
          </Glass>
          <Glass><SL>Waterfall Bridge</SL><div style={{ width: "100%", height: 340, marginTop: "8px" }}><ResponsiveContainer><BarChart data={wb} margin={{ left: 10, right: 10, top: 10, bottom: 35 }}><CartesianGrid horizontal vertical={false} stroke="rgba(255,255,255,0.03)" /><XAxis dataKey="name" tick={{ fill: T.w25, fontSize: 10, fontFamily: F.mono }} angle={-30} textAnchor="end" height={55} /><YAxis tick={{ fill: T.w25, fontSize: 10, fontFamily: F.mono }} tickFormatter={fmt} /><Tooltip content={<CTT />} /><Bar dataKey="base" stackId="a" fill="transparent" /><Bar dataKey="value" stackId="a" radius={[4, 4, 0, 0]}>{wb.map((d, i) => <Cell key={i} fill={d.fill} />)}</Bar></BarChart></ResponsiveContainer></div></Glass>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}><KPI label="Investor Return" value={fmt(wf.tr)} color={wf.tr >= d.eq ? T.green : T.red} /><KPI label="MOIC" value={wf.moic.toFixed(2) + "×"} color={wf.moic >= 1 ? T.green : T.red} /><KPI label="ROI" value={pct(wf.roi)} color={wf.roi >= 0 ? T.green : T.red} /><KPI label="Producer Net" value={fmt(wf.pb)} color={T.purple} /></div>
        </div>}

        {/* REVENUE */}
        {tid === "revenue" && <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}><KPI label="Conservative" value={fmt(d.rt.conservative)} color={T.red} sub="incl. credit" /><KPI label="Base" value={fmt(d.rt.base)} color={T.gold} sub="incl. credit" /><KPI label="Upside" value={fmt(d.rt.upside)} color={T.green} sub="incl. credit" /></div>
          <Glass><SL sub={`${inp.genre} benchmarks at ${fmt(inp.totalBudget)}. Illustrative.`}>Revenue by Window</SL><div style={{ width: "100%", height: 380, marginTop: "12px" }}><ResponsiveContainer><BarChart data={d.rw} margin={{ left: 10, right: 10, top: 10, bottom: 55 }}><CartesianGrid horizontal vertical={false} stroke="rgba(255,255,255,0.03)" /><XAxis dataKey="window" tick={{ fill: T.w25, fontSize: 10, fontFamily: F.mono }} angle={-30} textAnchor="end" height={55} /><YAxis tick={{ fill: T.w25, fontSize: 10, fontFamily: F.mono }} tickFormatter={fmt} /><Tooltip content={<CTT />} /><Bar dataKey="conservative" name="Con" fill={T.red} opacity={0.6} radius={[2, 2, 0, 0]} barSize={14} /><Bar dataKey="base" name="Base" fill={T.gold} opacity={0.7} radius={[2, 2, 0, 0]} barSize={14} /><Bar dataKey="upside" name="Up" fill={T.green} opacity={0.7} radius={[2, 2, 0, 0]} barSize={14} /><Legend wrapperStyle={{ fontFamily: F.mono, fontSize: "10px" }} /></BarChart></ResponsiveContainer></div></Glass>
          <Glass><SL sub="Gold line = budget.">Breakeven by Strategy</SL><div style={{ width: "100%", height: 220, marginTop: "12px" }}><ResponsiveContainer><BarChart data={d.be} layout="vertical" margin={{ left: 120, right: 30 }}><XAxis type="number" tick={{ fill: T.w25, fontSize: 10, fontFamily: F.mono }} tickFormatter={fmt} /><YAxis type="category" dataKey="strategy" tick={{ fill: T.w55, fontSize: 11, fontFamily: F.mono }} width={115} /><Tooltip content={<CTT />} /><ReferenceLine x={d.actualBudget} stroke={T.gold} strokeDasharray="5 5" /><Bar dataKey="breakeven" name="Breakeven" radius={[0, 4, 4, 0]} barSize={20}>{d.be.map((b, i) => <Cell key={i} fill={b.breakeven < d.actualBudget * 1.5 ? T.green : b.breakeven < d.actualBudget * 4 ? T.amber : T.red} opacity={.65} />)}</Bar></BarChart></ResponsiveContainer></div></Glass>
          <Glass tier="recessed" style={{ textAlign: "center", borderColor: "rgba(120,60,180,0.2)" }}><div style={{ fontFamily: F.display, fontSize: "16px", color: T.purple, letterSpacing: "3px", marginBottom: "8px" }}>CUSTOM COMP REPORTS</div><div style={{ fontFamily: F.body, fontSize: "13px", color: T.w55, lineHeight: 1.6 }}>How did comparable films perform? Real market data for your genre.</div><div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "14px" }}><div style={{ background: T.goldGhost, border: `1px solid ${T.goldDim}`, borderRadius: "8px", padding: "10px 20px" }}><div style={{ fontFamily: F.display, fontSize: "20px", color: T.gold }}>$595</div><div style={{ fontFamily: F.mono, fontSize: "10px", color: T.w40 }}>10 Films</div></div><div style={{ background: T.goldGhost, border: `1px solid ${T.goldDim}`, borderRadius: "8px", padding: "10px 20px" }}><div style={{ fontFamily: F.display, fontSize: "20px", color: T.gold }}>$995</div><div style={{ fontFamily: F.mono, fontSize: "10px", color: T.w40 }}>20 Films</div></div></div></Glass>
        </div>}

        {/* BUDGET */}
        {tid === "budget" && <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontFamily: F.body, fontSize: "13px", color: T.w40 }}>Click any amount to customize. Total recalculates.</div>
          <Glass><SL>Budget — {fmt(d.actualBudget)}</SL><div style={{ width: "100%", height: 220 }}><ResponsiveContainer><PieChart><Pie data={d.bd} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={90} stroke={T.bg} strokeWidth={2}>{d.bd.map((e, i) => <Cell key={i} fill={e.color} opacity={0.85} />)}</Pie><Tooltip content={<CTT />} /></PieChart></ResponsiveContainer></div></Glass>
          {Object.keys(CC).map(cat => { const items = d.bi.filter(b => b.category === cat && !b.isBond); return <Glass key={cat} tier="recessed"><div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}><SL>{CL[cat]}</SL><span style={{ fontFamily: F.mono, fontSize: "14px", color: CC[cat] }}>{fmt(items.reduce((s, b) => s + b.amount, 0) + (cat === "G&A" && bondOn ? d.bondAmt : 0))}</span></div>{items.map(item => { const gi = d.bi.indexOf(item); return <div key={item.name} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: `1px solid ${T.goldGhost}` }}><span style={{ fontFamily: F.mono, fontSize: "12px", color: T.w55, flex: 1 }}>{item.name}</span><div style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ fontFamily: F.mono, fontSize: "11px", color: T.gold }}>$</span><input type="number" value={item.amount} onChange={e => setBudgetEdits(p => ({ ...p, [gi]: Number(e.target.value) || 0 }))} style={{ width: "100px", background: item.isEdited ? T.goldGhost : T.inputBg, border: `1px solid ${item.isEdited ? T.goldDim : T.inputBorder}`, borderRadius: "6px", padding: "6px 8px", color: item.isEdited ? T.gold : T.w92, fontFamily: F.mono, fontSize: "12px", outline: "none", textAlign: "right" }} /></div>{item.isEdited && <button onClick={() => setBudgetEdits(p => { const n = { ...p }; delete n[gi]; return n; })} style={{ background: "none", border: "none", color: T.w25, cursor: "pointer", fontFamily: F.mono, fontSize: "10px" }}>reset</button>}</div>; })}{cat === "G&A" && bondOn && <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0" }}><span style={{ fontFamily: F.mono, fontSize: "12px", color: T.w55, flex: 1 }}>Completion Bond</span><span style={{ fontFamily: F.mono, fontSize: "12px", color: T.w75 }}>{fF(d.bondAmt)}</span></div>}</Glass>; })}
          <Glass style={{ textAlign: "center" }} tier="recessed"><span style={{ fontFamily: F.mono, fontSize: "11px", color: T.w40 }}>CONTINGENCY (10% BTL+Post)</span><div style={{ fontFamily: F.display, fontSize: "30px", color: T.amber }}>{fmt(d.cont)}</div></Glass>
        </div>}

        {/* CAPITAL */}
        {tid === "capital" && <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <Glass><SL>Capital Stack</SL><div style={{ marginTop: "16px" }}>{d.cs.map((l, i) => <div key={l.name} style={{ display: "flex", alignItems: "stretch", borderBottom: i < d.cs.length - 1 ? `1px solid ${T.goldGhost}` : "none" }}><div style={{ width: "8px", background: l.color, opacity: 0.7 }} /><div style={{ flex: 1, padding: "18px" }}><div style={{ display: "flex", justifyContent: "space-between" }}><div><div style={{ fontFamily: F.body, fontSize: "15px", color: T.w92, fontWeight: 500 }}>{l.name}</div><div style={{ fontFamily: F.mono, fontSize: "11px", color: T.w40 }}>{l.pos}</div></div><div style={{ fontFamily: F.mono, fontSize: "16px", color: l.color }}>{fF(l.amount)}</div></div></div></div>)}</div></Glass>
          <Glass><SL>Investor Terms</SL><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "18px", marginTop: "12px" }}>{[{ l: "Vehicle", v: "Single-Purpose LLC" }, { l: "Min Investment", v: fF(inp.minInvestment) }, { l: "Exemption", v: "Reg D 506(b)" }, { l: "Premium", v: `${100 + inp.recoupPremium}%` }, { l: "Inv Backend", v: `${inp.investorBackend}%` }, { l: "Prod Backend", v: `${100 - inp.investorBackend}%` }, { l: "SAG Tier", v: sagTier }, { l: "Union", v: isUnion ? "Union" : "Non-Union" }, { l: "Loan Term", v: `${inp.loanTerm} mo` }].map(x => <div key={x.l}><div style={{ fontFamily: F.mono, fontSize: "9px", color: T.w40, letterSpacing: "1px" }}>{x.l.toUpperCase()}</div><div style={{ fontFamily: F.body, fontSize: "13px", color: T.w92, marginTop: "3px" }}>{x.v}</div></div>)}</div><div style={{ fontFamily: F.body, fontSize: "11px", color: T.w25, marginTop: "16px", fontStyle: "italic" }}>Default structure. Your attorney will confirm.</div></Glass>
        </div>}

        {/* CASH FLOW */}
        {tid === "cashflow" && <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontFamily: F.body, fontSize: "13px", color: T.w40 }}>Cash deploys during production, returns through distribution.{stateData.months !== "—" ? ` TC receipt est: ${stateData.months} mo (${stateData.name}).` : ""}</div>
          <Glass><SL>Cash Flow</SL><div style={{ width: "100%", height: 340, marginTop: "12px" }}><ResponsiveContainer><ComposedChart data={d.cf} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}><CartesianGrid horizontal vertical={false} stroke="rgba(255,255,255,0.03)" /><XAxis dataKey="month" tick={{ fill: T.w25, fontSize: 10, fontFamily: F.mono }} /><YAxis yAxisId="b" tick={{ fill: T.w25, fontSize: 10, fontFamily: F.mono }} tickFormatter={fmt} /><YAxis yAxisId="l" orientation="right" tick={{ fill: T.w25, fontSize: 10, fontFamily: F.mono }} tickFormatter={fmt} /><Tooltip content={<CTT />} /><Bar yAxisId="b" dataKey="inflows" name="In" fill={T.green} opacity={0.6} radius={[3, 3, 0, 0]} barSize={16} /><Bar yAxisId="b" dataKey="outflows" name="Out" fill={T.red} opacity={0.5} radius={[0, 0, 3, 3]} barSize={16} /><Line yAxisId="l" type="monotone" dataKey="cumulative" name="Cum" stroke={T.gold} strokeWidth={2} dot={{ fill: T.gold, r: 3 }} /><ReferenceLine yAxisId="b" y={0} stroke={T.w25} /><Legend wrapperStyle={{ fontFamily: F.mono, fontSize: "10px" }} /></ComposedChart></ResponsiveContainer></div></Glass>
          <Glass><SL>Timeline</SL><div style={{ display: "flex", height: "30px", borderRadius: "6px", overflow: "hidden", marginTop: "12px" }}>{[{ p: "Pre", m: 2, c: T.blue }, { p: "Prod", m: 3, c: T.gold }, { p: "Post", m: 3, c: T.purple }, { p: "Del", m: 2, c: T.amber }, { p: "Dist", m: 4, c: T.green }].map(x => <div key={x.p} style={{ flex: x.m, background: x.c, opacity: 0.5, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.mono, fontSize: "9px", color: "#fff", fontWeight: 600, borderRight: "1px solid #000" }}>{x.p}</div>)}</div></Glass>
        </div>}

        {/* SENSITIVITY */}
        {tid === "sensitivity" && <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <Glass><SL sub="Your equity highlighted.">ROI Heat Map</SL><div style={{ overflowX: "auto", marginTop: "12px" }}><table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.mono, fontSize: "11px" }}><thead><tr><th style={{ padding: "10px 6px", color: T.w40, textAlign: "left", borderBottom: `1px solid ${T.goldDim}`, fontSize: "10px" }}>Equity ↓ / Rev →</th>{sR.map(r => <th key={r} style={{ padding: "10px 6px", color: T.w55, textAlign: "center", borderBottom: `1px solid ${T.goldDim}`, fontSize: "10px" }}>{fmt(r)}</th>)}</tr></thead><tbody>{sE.map(eq => <tr key={eq}><td style={{ padding: "10px 6px", color: T.w55, borderBottom: `1px solid ${T.goldGhost}` }}>{fmt(eq)}</td>{sR.map(rev => { const roi = cSR(rev, eq); const bg = roi <= -1 ? "rgba(220,38,38,0.3)" : roi < -.5 ? "rgba(220,38,38,0.15)" : roi < 0 ? "rgba(245,158,11,0.15)" : roi < .5 ? "rgba(60,179,113,0.12)" : "rgba(60,179,113,0.25)"; const c = roi <= -.5 ? T.red : roi < 0 ? T.amber : T.green; return <td key={rev} style={{ padding: "10px 6px", textAlign: "center", background: bg, color: c, borderBottom: `1px solid ${T.goldGhost}`, fontWeight: eq === d.eq ? 700 : 400, outline: eq === d.eq ? `1px solid ${T.goldDim}` : undefined }}>{roi <= -1 ? "Loss" : pct(roi)}</td>; })}</tr>)}</tbody></table></div></Glass>
          <Glass><SL sub="Gold line = budget.">Breakeven</SL><div style={{ width: "100%", height: 220, marginTop: "12px" }}><ResponsiveContainer><BarChart data={d.be} layout="vertical" margin={{ left: 120, right: 30 }}><CartesianGrid horizontal vertical={false} stroke="rgba(255,255,255,0.03)" /><XAxis type="number" tick={{ fill: T.w25, fontSize: 10, fontFamily: F.mono }} tickFormatter={fmt} /><YAxis type="category" dataKey="strategy" tick={{ fill: T.w55, fontSize: 11, fontFamily: F.mono }} width={115} /><Tooltip content={<CTT />} /><ReferenceLine x={d.actualBudget} stroke={T.gold} strokeDasharray="5 5" /><Bar dataKey="breakeven" radius={[0, 4, 4, 0]} barSize={20}>{d.be.map((b, i) => <Cell key={i} fill={b.breakeven < d.actualBudget * 1.5 ? T.green : b.breakeven < d.actualBudget * 4 ? T.amber : T.red} opacity={.65} />)}</Bar></BarChart></ResponsiveContainer></div></Glass>
        </div>}

        {/* RISK */}
        {tid === "risk" && <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <Glass><SL>Risk Matrix</SL><div style={{ width: "100%", height: 340, marginTop: "12px" }}><ResponsiveContainer><ScatterChart margin={{ left: 10, right: 30, top: 10, bottom: 10 }}><CartesianGrid horizontal vertical={false} stroke="rgba(255,255,255,0.03)" /><XAxis type="number" dataKey="prob" name="P" unit="%" domain={[0, 55]} tick={{ fill: T.w25, fontSize: 10, fontFamily: F.mono }} /><YAxis type="number" dataKey="impact" name="I" domain={[1, 5.5]} tick={{ fill: T.w25, fontSize: 10, fontFamily: F.mono }} /><Tooltip content={({ active, payload }) => { if (!active || !payload?.length) return null; const r = payload[0].payload; return <div style={{ background: "rgba(0,0,0,0.95)", border: `1px solid ${T.goldDim}`, borderRadius: "8px", padding: "10px 14px", fontFamily: F.mono, fontSize: "11px" }}><div style={{ color: T.w92, fontWeight: 600 }}>{r.name}</div><div style={{ color: T.w55 }}>{r.prob}% · {r.impact}/5 · {r.score.toFixed(1)}</div></div>; }} /><Scatter data={d.risks} shape={({ cx, cy, payload }) => { const c = payload.score >= 2 ? T.red : payload.score >= 1 ? T.amber : T.green; return <g><circle cx={cx} cy={cy} r={Math.max(8, payload.score * 6)} fill={c} opacity={0.45} stroke={c} strokeWidth={1} /><text x={cx} y={cy - Math.max(10, payload.score * 6) - 4} textAnchor="middle" fill={T.w55} fontSize={9} fontFamily={F.mono}>{payload.name}</text></g>; }} /></ScatterChart></ResponsiveContainer></div><div style={{ display: "flex", gap: "18px", justifyContent: "center", marginTop: "8px" }}>{[{ l: "High ≥2", c: T.red }, { l: "Med 1-2", c: T.amber }, { l: "Low <1", c: T.green }].map(x => <div key={x.l} style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: x.c, opacity: 0.6 }} /><span style={{ fontFamily: F.mono, fontSize: "10px", color: T.w55 }}>{x.l}</span></div>)}</div></Glass>
          <Glass><SL>Risk Register</SL>{[...d.risks].sort((a, b) => b.score - a.score).map((r, i) => { const c = r.score >= 2 ? T.red : r.score >= 1 ? T.amber : T.green; const bg = r.score >= 2 ? T.redDim : r.score >= 1 ? T.amberDim : T.greenDim; const ex = expandedRisk === i; return <div key={i} onClick={() => setExpandedRisk(ex ? null : i)} style={{ cursor: "pointer", padding: "10px 0", borderBottom: `1px solid ${T.goldGhost}` }}><div style={{ display: "flex", alignItems: "center", gap: "10px" }}><div style={{ width: "34px", height: "24px", borderRadius: "4px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.mono, fontSize: "11px", color: c, fontWeight: 700, flexShrink: 0 }}>{r.score.toFixed(1)}</div><div style={{ flex: 1 }}><div style={{ fontFamily: F.body, fontSize: "13px", color: T.w92 }}>{r.name}</div><div style={{ fontFamily: F.mono, fontSize: "10px", color: T.w40 }}>{r.cat} · {r.prob}% · {r.impact}/5</div></div><span style={{ fontFamily: F.mono, fontSize: "11px", color: T.w25 }}>{ex ? "▾" : "▸"}</span></div>{ex && <div style={{ marginTop: "10px", marginLeft: "44px", fontFamily: F.body, fontSize: "12px", color: T.w55, lineHeight: 1.6 }}>{r.mit}</div>}</div>; })}</Glass>
        </div>}
      </div>

      <div style={{ marginTop: "36px", paddingTop: "16px", borderTop: `1px solid ${T.goldGhost}`, textAlign: "center", fontFamily: F.mono, fontSize: "10px", color: T.w25 }}>Illustrative model only. Not an offer of securities. Consult entertainment attorneys before raising capital.</div>
    </div>
  );
}
