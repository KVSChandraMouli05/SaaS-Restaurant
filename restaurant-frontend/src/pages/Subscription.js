import React, { useEffect, useState } from "react";
import "./Subscription.css";

/* ─────────────────── CONFIG ─────────────────── */
const PLAN_CONFIG = {
  Trial:   { color: "#6B7280", badge: "Free Trial",   popular: false },
  Basic:   { color: "#10B981", badge: "Starter",      popular: false },
  Pro:     { color: "#3B82F6", badge: "Most Popular", popular: true  },
  Premium: { color: "#A855F7", badge: "Best Value",   popular: false },
};

const FEATURE_ROWS = [
  { ico: "Restaurants",      label: "Restaurants",      values: { Trial: "1",         Basic: "1",         Pro: "5",        Premium: "10"      }, type: "count" },
  { ico: "Orders",           label: "Orders",           values: { Trial: "Unlimited", Basic: "Unlimited", Pro: "Unlimited",Premium: "Unlimited"}, type: "count" },
  { ico: "Dashboard",        label: "Dashboard",        values: { Trial: "Full",      Basic: "Basic",     Pro: "Full",     Premium: "Full"     }, type: "tier",
    tiers: { Trial: "full", Basic: "basic", Pro: "full", Premium: "full" } },
  { ico: "Analytics",        label: "Analytics",        values: { Trial: "Full",      Basic: null,        Pro: "Basic",    Premium: "Advanced" }, type: "tier",
    tiers: { Trial: "full", Basic: "none",  Pro: "basic", Premium: "advanced" } },
  { ico: "OrderManagement",  label: "Order Management", values: { Trial: true,        Basic: true,        Pro: true,       Premium: true       }, type: "bool" },
  { ico: "OrderTracking",    label: "Order Tracking",   values: { Trial: true,        Basic: true,        Pro: true,       Premium: true       }, type: "bool" },
  { ico: "PrioritySupport",  label: "Priority Support", values: { Trial: false,       Basic: false,       Pro: true,       Premium: true       }, type: "bool" },
  { ico: "DedicatedManager", label: "Dedicated Manager",values: { Trial: false,       Basic: false,       Pro: false,      Premium: true       }, type: "bool" },
];

const PLAN_ORDER = ["Trial", "Basic", "Pro", "Premium"];

const TIER_STYLES = {
  full:     { label: "Full",     bg: "#10B98114", border: "#10B98124", color: "#34D399" },
  advanced: { label: "Advanced", bg: "#A855F714", border: "#A855F724", color: "#C084FC" },
  basic:    { label: "Basic",    bg: "#3B82F614", border: "#3B82F624", color: "#60A5FA" },
  none:     { label: "—",        bg: "#1E253528", border: "#2A345038", color: "#354057" },
};

/* ─────────────────── SVG ICON LIBRARY ─────────────────── */
const CheckIco = ({ color, size = 13 }) => (
  <svg viewBox="0 0 16 16" fill="none" width={size} height={size}>
    <circle cx="8" cy="8" r="7" fill={`${color}16`} stroke={`${color}28`}/>
    <path d="M4.5 8l2.5 2.5L11.5 5.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const CrossIco = () => (
  <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
    <circle cx="8" cy="8" r="7" fill="#1A2035" stroke="#253048"/>
    <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#2E3D56" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

/* Plan icons */
const IcoTrial = ({ color = "#6B7280", size = 16 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IcoBasic = ({ color = "#10B981", size = 16 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);
const IcoPro = ({ color = "#3B82F6", size = 16 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IcoPremium = ({ color = "#A855F7", size = 16 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const PLAN_ICONS = {
  Trial:   (color, size) => <IcoTrial   color={color} size={size} />,
  Basic:   (color, size) => <IcoBasic   color={color} size={size} />,
  Pro:     (color, size) => <IcoPro     color={color} size={size} />,
  Premium: (color, size) => <IcoPremium color={color} size={size} />,
};

/* Feature row icons — all SVG */
const FeatIcons = {
  Restaurants: ({ color = "#7A8BA8", size = 14 }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Orders: ({ color = "#7A8BA8", size = 14 }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="2"/>
      <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  ),
  Dashboard: ({ color = "#7A8BA8", size = 14 }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  Analytics: ({ color = "#7A8BA8", size = 14 }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  OrderManagement: ({ color = "#7A8BA8", size = 14 }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.97-1.67L23 6H6"/>
    </svg>
  ),
  OrderTracking: ({ color = "#7A8BA8", size = 14 }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
      <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/>
    </svg>
  ),
  PrioritySupport: ({ color = "#7A8BA8", size = 14 }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.7A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
    </svg>
  ),
  DedicatedManager: ({ color = "#7A8BA8", size = 14 }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

/* ─────────────────── PAYMENT MODAL ─────────────────── */
function PaymentModal({ plan, curIdx, onClose }) {
  const pc = PLAN_CONFIG[plan?.name] ?? PLAN_CONFIG.Pro;
  const isUpgrade = curIdx < PLAN_ORDER.indexOf(plan?.name);
  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-card" onClick={e => e.stopPropagation()}>
        <div className="pm-glow" style={{ background: `radial-gradient(ellipse at top, ${pc.color}18 0%, transparent 65%)` }} />
        <button className="pm-close" onClick={onClose}>✕</button>

        <div className="pm-icon-wrap" style={{ background: `${pc.color}12`, border: `1px solid ${pc.color}25` }}>
          <svg viewBox="0 0 24 24" fill="none" stroke={pc.color} strokeWidth="1.8" width="28" height="28">
            <rect x="1" y="4" width="22" height="16" rx="3"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
            <line x1="5" y1="15" x2="9" y2="15"/>
          </svg>
        </div>

        <h2 className="pm-title">{isUpgrade ? "Upgrade" : "Switch"} to {plan?.name}</h2>
        <div className="pm-price" style={{ color: pc.color }}>
          ₹{plan?.price?.toLocaleString("en-IN")}<span className="pm-price-mo">/month</span>
        </div>

        <div className="pm-coming-badge">
          <svg viewBox="0 0 20 20" fill="currentColor" width="11" height="11">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
          </svg>
          Online Payment — Coming Soon
        </div>

        <p className="pm-desc">
          Our payment gateway is currently under development.<br/>
          To change your plan, please contact our admin directly.
        </p>

        <div className="pm-contact">
          <p className="pm-contact-hd">Contact Admin</p>
          {[
            { svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, lbl: "Email",    val: "admin@mouliServe.com" },
            { svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 012 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>, lbl: "Phone",    val: "+91 98765 43210" },
            { svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>, lbl: "WhatsApp", val: "Click to message" },
          ].map((c, i) => (
            <div className="pm-contact-row" key={i}>
              <span style={{ color: "#5A6B84", display:"inline-flex" }}>{c.svg}</span>
              <span className="pm-contact-lbl">{c.lbl}</span>
              <span className="pm-contact-val">{c.val}</span>
            </div>
          ))}
        </div>

        <button className="pm-btn-ok" style={{ background: `${pc.color}12`, border: `1px solid ${pc.color}25`, color: pc.color }} onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}

/* ─────────────────── TIER PILL ─────────────────── */
function TierPill({ tier }) {
  const s = TIER_STYLES[tier] ?? TIER_STYLES.none;
  return (
    <span className="tier-pill" style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {s.label}
    </span>
  );
}

/* ─────────────────── MAIN ─────────────────── */
export default function Subscription({ subscriptionLocked = false }) {
  const [plans,        setPlans]        = useState([]);
  const [currentPlan,  setCurrentPlan]  = useState(null);
  const [restCount,    setRestCount]    = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [paymentModal, setPaymentModal] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => { fetchAll(); }, []);
  const fetchAll = async () => {
    await Promise.all([fetchPlans(), fetchCurrent(), fetchRestCount()]);
    setLoading(false);
  };

  const fetchPlans = async () => {
    try {
      const r = await fetch("https://backend-1wnt.onrender.com/api/subscription/plans");
      const d = await r.json();
      if (d.status === "success") setPlans(Array.isArray(d.data) ? d.data : d.data?.plans ?? []);
    } catch {}
  };

  const fetchCurrent = async () => {
    if (!token) return;
    try {
      const r = await fetch("https://backend-1wnt.onrender.com/api/subscription/current", { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.status === "success") setCurrentPlan(d.data?.subscription ?? d.data);
    } catch {}
  };

  const fetchRestCount = async () => {
    if (!token) return;
    try {
      const r = await fetch("https://backend-1wnt.onrender.com/api/restaurants", { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.status === "success") {
        const n = d.data?.count ?? d.data?.restaurants?.length ?? (Array.isArray(d.data) ? d.data.length : 0);
        setRestCount(n ?? 0);
      }
    } catch {}
  };

  const fmt     = d => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const getDays = d => d ? Math.max(0, Math.ceil((new Date(d) - new Date()) / 86400000)) : null;

  const planName  = currentPlan?.name ?? currentPlan?.plan_name ?? null;
  const days      = getDays(currentPlan?.end_date ?? currentPlan?.expires_at);
  const cfg       = PLAN_CONFIG[planName] ?? null;
  const planData  = plans.find(p => p.name === planName);
  const restLimit = currentPlan?.restaurant_limit ?? planData?.restaurant_limit ?? 1;
  const restLeft  = Math.max(0, restLimit - restCount);
  const restPct   = Math.min(100, (restCount / restLimit) * 100);
  const curIdx    = PLAN_ORDER.indexOf(planName);
  const paidPlans = plans.filter(p => p.name !== "Trial");
  const trialPlan = plans.find(p => p.name === "Trial");
  const endDateRaw = currentPlan?.end_date ?? currentPlan?.expires_at;
  const isExpired = (() => {
    if (!endDateRaw) return false;
    const end = new Date(endDateRaw);
    if (Number.isNaN(end.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return end < today;
  })();
  const showLockedNotice = subscriptionLocked || isExpired;

  return (
    <div className="sub-page">
      {paymentModal && <PaymentModal plan={paymentModal} curIdx={curIdx} onClose={() => setPaymentModal(null)} />}

      <div className="sub-inner">

        {/* ── HEADER ── */}
        <div className="sub-hdr">
          <div>
            <h1 className="sub-title">Subscription</h1>
            <p className="sub-subtitle">Manage your plan and billing</p>
          </div>
          {planName && cfg && (
            <div className="sub-plan-badge" style={{ background: `${cfg.color}10`, border: `1px solid ${cfg.color}22`, color: cfg.color }}>
              <span style={{ display:"inline-flex", verticalAlign:"middle", marginRight:5 }}>{PLAN_ICONS[planName]?.(cfg.color, 13)}</span>{planName} Plan
            </div>
          )}
        </div>

        {/* ── ACTIVE BAR ── */}
        {currentPlan && cfg && planName && (
          <div className="sub-bar" style={{ borderColor: `${cfg.color}20` }}>
            <div className="sub-bar-shine" style={{ background: `linear-gradient(90deg, ${cfg.color}12, transparent 60%)` }} />
            <div className="sub-bar-cells">

              <div className="sbc sbc--plan">
                <span className="sbc-lbl">Active Plan</span>
                <div className="sbc-plan-name" style={{ color: cfg.color, display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ display:"inline-flex" }}>{PLAN_ICONS[planName]?.(cfg.color, 15)}</span>{planName}
                </div>
                <span className="sbc-chip" style={{ color: cfg.color, background: `${cfg.color}10`, borderColor: `${cfg.color}20` }}>{cfg.badge}</span>
              </div>

              <div className="sub-bar-div" />

              <div className="sbc">
                <span className="sbc-lbl">Price</span>
                <div className="sbc-price">
                  <span className="sbc-price-sym">₹</span>
                  <span className="sbc-price-num">{(planData?.price ?? 0).toLocaleString("en-IN")}</span>
                  <span className="sbc-price-mo">/mo</span>
                </div>
              </div>

              <div className="sub-bar-div" />

              <div className="sbc sbc--rest">
                <span className="sbc-lbl">Restaurants</span>
                <div className="sbc-rest-row">
                  <span style={{ color: cfg.color, fontWeight: 600, fontSize: 15 }}>{restCount}</span>
                  <span className="sbc-slash">/</span>
                  <span style={{ color: "#7A8BA8", fontSize: 14 }}>{restLimit}</span>
                  <span className="sbc-left" style={{ color: restLeft === 0 ? "#F87171" : "#34D399" }}>({restLeft} left)</span>
                </div>
                <div className="sbc-rest-track">
                  <div className="sbc-rest-fill" style={{ width: `${restPct}%`, background: restPct >= 90 ? "#F87171" : restPct >= 70 ? "#FBBF24" : cfg.color }} />
                </div>
              </div>

              <div className="sub-bar-div" />
              <div className="sbc"><span className="sbc-lbl">Orders</span><span className="sbc-val">Unlimited</span></div>
              <div className="sub-bar-div" />
              <div className="sbc"><span className="sbc-lbl">Expires</span><span className="sbc-val">{fmt(currentPlan?.end_date ?? currentPlan?.expires_at)}</span></div>
              <div className="sub-bar-div" />

              <div className="sbc">
                <span className="sbc-lbl">Days Left</span>
                <span className={`sbc-days ${days !== null && days <= 7 ? "sbc-days--warn" : "sbc-days--ok"}`}>
                  {days ?? "—"}{days !== null && <span style={{ fontSize: 10, color: "#7A8BA8", marginLeft: 2 }}>d</span>}
                </span>
              </div>

              <div className="sub-bar-div" />

              <div className="sbc">
                <span className="sbc-lbl">Status</span>
                <span className={`sbc-status ${currentPlan.status === "active" ? "sbc-status--on" : ""}`}>
                  <span className="sbc-status-dot" />{currentPlan.status === "active" ? "Active" : (currentPlan.status ?? "—")}
                </span>
              </div>

            </div>
          </div>
        )}

        {showLockedNotice && (
          <div className="sub-expired-hero">
            <div className="sub-expired-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                <path fillRule="evenodd" d="M10 1a9 9 0 100 18 9 9 0 000-18zm1 5a1 1 0 10-2 0v4a1 1 0 102 0V6zm-1 8a1.25 1.25 0 100 2.5A1.25 1.25 0 0010 14z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="sub-expired-title">Your trial plan has expired</p>
              <p className="sub-expired-text">
                Access to dashboard, restaurants, orders, menu, and analytics is locked.
                Subscribe to Basic, Pro, or Premium to continue.
              </p>
            </div>
          </div>
        )}

        {/* Expiry warning */}
        {days !== null && days <= 7 && (
          <div className={`sub-warn ${days === 0 ? "sub-warn--red" : "sub-warn--yellow"}`}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            {days === 0 ? "Your plan expires today!" : `${days} day${days !== 1 ? "s" : ""} remaining.`} Contact admin to renew.
          </div>
        )}

        {loading ? (
          <div className="sub-loading"><div className="sub-spinner" /><span>Loading plans…</span></div>
        ) : (
          <>
            {/* ── TRIAL ROW ── */}
            {trialPlan && (
              <>
                <p className="sub-sec-lbl">Free Trial</p>
                <div className={`trial-row ${planName === "Trial" ? "trial-row--active" : ""}`}>
                  <div className="trial-glow" />
                  <div className="trial-col trial-col--id">
                    <div className="trial-name" style={{ display:"flex", alignItems:"center", gap:7 }}>
                      <IcoTrial color="#6B7280" size={15} /> Trial
                    </div>
                    <div className="trial-tagline">7 days · no card required</div>
                    {planName === "Trial" && <span className="trial-cur-pill">✓ Current Plan</span>}
                  </div>
                  <div className="trial-col trial-col--stats">
                    {[
                      { lbl: "Price",       val: "Free",      green: false },
                      { lbl: "Duration",    val: "7 days",    green: false },
                      { lbl: "Restaurants", val: "1",         green: false },
                      { lbl: "Orders",      val: "Unlimited", green: true  },
                    ].map(s => (
                      <div className="trial-stat" key={s.lbl}>
                        <span className="trial-stat-lbl">{s.lbl}</span>
                        <span className="trial-stat-val" style={s.green ? { color: "#34D399" } : {}}>{s.val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="trial-col trial-col--feats">
                    {[
                      { IcoC: FeatIcons.Dashboard,       txt: "Full Dashboard"   },
                      { IcoC: FeatIcons.Analytics,       txt: "Full Analytics"   },
                      { IcoC: FeatIcons.OrderManagement, txt: "Order Management" },
                      { IcoC: FeatIcons.OrderTracking,   txt: "Order Tracking"   },
                    ].map(f => (
                      <div className="trial-feat" key={f.txt}>
                        <CheckIco color="#34D399" size={12} />
                        <f.IcoC color="#5A6B84" size={13} />
                        <span>{f.txt}</span>
                      </div>
                    ))}
                  </div>
                  <div className="trial-col trial-col--cta">
                    {planName === "Trial"
                      ? <button className="trial-btn trial-btn--cur" disabled><CheckIco color="#9CA3AF" size={11} /> Current Plan</button>
                      : <button className="trial-btn trial-btn--used" disabled>✓ Already Used</button>
                    }
                  </div>
                </div>
              </>
            )}

            {/* ── PAID PLANS ── */}
            <p className="sub-sec-lbl">Paid Plans</p>
            <div className="plans-grid">
              {paidPlans.map((plan, i) => {
                const pc       = PLAN_CONFIG[plan.name] ?? PLAN_CONFIG.Basic;
                const isActive = planName === plan.name;
                const isUp     = curIdx < PLAN_ORDER.indexOf(plan.name);

                return (
                  <div
                    key={plan.name}
                    className={`pc ${pc.popular ? "pc--pop" : ""} ${isActive ? "pc--active" : ""}`}
                    style={{ "--pc": pc.color, animationDelay: `${i * 0.07}s` }}
                  >
                    <div className="pc-top-line" style={{ background: `linear-gradient(90deg, ${pc.color}, ${pc.color}28)` }} />

                    {isActive
                      ? <div className="pc-ribbon pc-ribbon--active">✓ Your Plan</div>
                      : pc.popular
                        ? <div className="pc-ribbon pc-ribbon--pop" style={{ background: pc.color }}>⭐ Most Popular</div>
                        : null
                    }

                    <div className="pc-body">

                      {/* Head */}
                      <div className="pc-head">
                        <div className="pc-head-left">
                          <span className="pc-plan-icon">{PLAN_ICONS[plan.name]?.(pc.color, 17)}</span>
                          <h3 className="pc-plan-name" style={{ color: pc.color }}>{plan.name}</h3>
                        </div>
                        <span className="pc-badge" style={{ color: pc.color, background: `${pc.color}0E`, borderColor: `${pc.color}1E` }}>{pc.badge}</span>
                      </div>

                      {/* Price */}
                      <div className="pc-price">
                        <span className="pc-price-sym">₹</span>
                        <span className="pc-price-num">{plan.price?.toLocaleString("en-IN")}</span>
                        <span className="pc-price-mo">/ month</span>
                      </div>

                      <div className="pc-hr" />

                      {/* Feature rows */}
                      <div className="pc-feats">
                        {FEATURE_ROWS.map((row, ri) => {
                          const val  = row.values[plan.name];
                          const tier = row.tiers?.[plan.name];
                          const isOff = val === false || val === null || val === "—" || val === undefined;

                          return (
                            <div key={ri} className={`pc-feat ${isOff ? "pc-feat--off" : ""}`}>
                              <div className="pc-feat-l">
                                {isOff ? <CrossIco /> : <CheckIco color={pc.color} size={13} />}
                                <span className="pc-feat-ico">
                                  {FeatIcons[row.ico] ? React.createElement(FeatIcons[row.ico], { color: isOff ? "#2E3D56" : "#5A6B84", size: 13 }) : null}
                                </span>
                                <span className="pc-feat-lbl">{row.label}</span>
                              </div>
                              <div className="pc-feat-r">
                                {row.type === "tier" ? (
                                  <TierPill tier={tier} />
                                ) : row.type === "bool" ? (
                                  isOff
                                    ? <span className="pc-feat-none">—</span>
                                    : <span className="pc-feat-yes" style={{ color: pc.color }}>✓</span>
                                ) : (
                                  <span className={isOff ? "pc-feat-none" : "pc-feat-count"} style={isOff ? {} : { color: pc.color }}>
                                    {val}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* CTA */}
                      {isActive ? (
                        <button className="pc-cta pc-cta--active"
                          style={{ background: `${pc.color}0E`, borderColor: `${pc.color}25`, color: pc.color }} disabled>
                          <CheckIco color={pc.color} size={12} /> Current Plan
                        </button>
                      ) : (
                        <button
                          className={`pc-cta ${pc.popular ? "pc-cta--pop" : "pc-cta--out"}`}
                          style={pc.popular
                            ? { background: pc.color, borderColor: pc.color, color: "#fff" }
                            : { background: `${pc.color}0E`, borderColor: `${pc.color}28`, color: pc.color }
                          }
                          onClick={() => setPaymentModal(plan)}
                        >
                          {isUp ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`} →
                        </button>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trust footer */}
            <div className="sub-trust">
              {[
                { svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>, txt: "Secure Payments" },
                { svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>, txt: "24/7 Support" },
                { svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, txt: "Instant Activation" },
                { svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>, txt: "Unlimited Orders" },
              ].map((t, i) => (
                <div className="sub-trust-item" key={i}>{t.svg}<span>{t.txt}</span></div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}