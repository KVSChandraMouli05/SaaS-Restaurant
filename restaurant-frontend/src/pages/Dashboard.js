import { useEffect, useMemo, useRef, useState } from "react";
import "./Dashboard.css";

const toDateInput = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};
const todayInput = () => toDateInput(new Date());
const daysAgoInput = (days) => toDateInput(new Date(Date.now() - days * 86400000));
const parseDateInput = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const [y, m, d] = String(value).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};
const formatShortDate = (value) => {
  const d = parseDateInput(value);
  if (!d) return "";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};
const parseMonthInput = (value) => {
  if (!value) return null;
  const [y, m] = String(value).split("-").map(Number);
  if (!y || !m) return null;
  return { year: y, month: m - 1 };
};
const formatMonthYear = (value) => {
  const parsed = parseMonthInput(value);
  if (!parsed) return "";
  return new Date(parsed.year, parsed.month, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};
const formatFullDate = (value) => {
  const d = parseDateInput(value);
  if (!d) return "";
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
const formatDateDayYear = (value) => {
  const d = parseDateInput(value);
  if (!d) return "";
  const datePart = d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const dayPart = d.toLocaleDateString("en-IN", { weekday: "long" });
  return `${datePart} • ${dayPart}`;
};
const getDayPhaseWish = (hour) => {
  if (hour >= 5 && hour < 12) {
    return { message: "Have a Great Morning", symbol: "☀️" };
  }
  if (hour >= 12 && hour < 17) {
    return { message: "Have a Productive Afternoon", symbol: "🌤️" };
  }
  return { message: "Have a Peaceful Night", symbol: "🌙" };
};

/* ── Locked Section ── */
function DashLocked({ title, subtitle, requiredPlan }) {
  return (
    <div style={{
      position: "relative", borderRadius: 14, overflow: "hidden",
      background: "#0D1220", border: "1px solid rgba(255,255,255,0.07)",
      minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 10, padding: 32, textAlign: "center",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" width="18" height="18">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
      </div>
      <p style={{ color: "#EDF2FF", fontWeight: 600, fontSize: 14, margin: 0 }}>{title}</p>
      {subtitle && <p style={{ color: "#7A8BA8", fontSize: 12, margin: 0 }}>{subtitle}</p>}
      <a href="/subscription" style={{
        padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500,
        background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)",
        color: "#A855F7", textDecoration: "none", marginTop: 4,
      }}>
        Upgrade to {requiredPlan} →
      </a>
    </div>
  );
}

/* ── Upgrade Banner ── */
function UpgradeBanner({ text, plan }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 20px", borderRadius: 10, marginTop: 16,
      background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.15)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" width="15" height="15">
          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
        <span style={{ color: "#EDF2FF", fontSize: 13 }}>{text}</span>
      </div>
      <a href="/subscription" style={{
        padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500,
        background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)",
        color: "#A855F7", textDecoration: "none", whiteSpace: "nowrap",
      }}>
        Upgrade to {plan} →
      </a>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [greeting, setGreeting]         = useState("");
  const [animateCards, setAnimateCards] = useState(false);
  const [rangeStart, setRangeStart]     = useState(daysAgoInput(6));
  const [rangeEnd, setRangeEnd]         = useState(todayInput());
  const [refreshing, setRefreshing]     = useState(false);
  const [restaurants, setRestaurants]   = useState([]);
  const [allOrders, setAllOrders]       = useState([]);
  const [planName, setPlanName]         = useState(null); // null = loading
  const [year, setYear]                 = useState(() => new Date().getFullYear());
  const [monthInput, setMonthInput]     = useState(() => new Date().toISOString().slice(0, 7));
  const [revenuePhase, setRevenuePhase] = useState("H1");
  const [kpiDate, setKpiDate]           = useState(() => todayInput());
  const kpiDateInputRef                 = useRef(null);
  const token = localStorage.getItem("token");

  const openKpiDatePicker = () => {
    const input = kpiDateInputRef.current;
    if (!input) return;

    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
        return;
      }
    } catch {
      // Some browsers reject showPicker without a trusted direct gesture.
    }

    try {
      input.focus({ preventScroll: true });
    } catch {
      input.focus();
    }
    input.click();
  };

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 5)       setGreeting("Good Night");
    else if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else if (hour < 21) setGreeting("Good Evening");
    else                setGreeting("Good Night");
    fetchDashboard();
  }, []);

  const fetchDashboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Fetch plan
      try {
        const pRes  = await fetch("http://localhost:5000/api/subscription/current", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const pData = await pRes.json();
        if (pData.status === "success") {
          const d = pData.data;
          const name = d?.name ?? d?.plan_name ?? d?.subscription?.plan_name ?? d?.plan?.name ?? null;
          console.log("SUB DATA:", JSON.stringify(d), "PLAN:", name);
          if (name) setPlanName(name);
        }
      } catch(e) { console.error("plan fetch:", e); }

      const res  = await fetch("http://localhost:5000/api/analytics/user/all-revenue", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const d = data.data;
      setStats(d);

      if (d?.restaurants?.length > 0) {
        setRestaurants(d.restaurants.map(r => ({ id: r.id, restaurant_name: r.name, ...r })));
      }

      try {
        const oRes  = await fetch("http://localhost:5000/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const oData = await oRes.json();
        if (oData.status === "success") {
          setAllOrders(Array.isArray(oData.data) ? oData.data : []);
        }
      } catch {}

      setTimeout(() => setAnimateCards(true), 80);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    let minYear = currentYear;
    let maxYear = currentYear;
    allOrders.forEach((o) => {
      if (!o.created_at) return;
      const y = new Date(o.created_at).getFullYear();
      if (y < minYear) minYear = y;
      if (y > maxYear) maxYear = y;
    });
    // Always show previous year for quick comparison (e.g., 2025 in 2026)
    minYear = Math.min(minYear, currentYear - 1);
    const years = [];
    for (let y = maxYear; y >= minYear; y -= 1) years.push(y);
    return years;
  }, [allOrders]);

  useEffect(() => {
    if (!yearOptions.includes(year)) {
      setYear(yearOptions[0]);
    }
  }, [yearOptions, year]);

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyRevenue = useMemo(() => {
    const totals = Array(12).fill(0);
    allOrders.forEach((o) => {
      if (!o.created_at) return;
      const d = new Date(o.created_at);
      if (d.getFullYear() !== year) return;
      totals[d.getMonth()] += parseFloat(o.total_amount || 0);
    });
    return totals;
  }, [allOrders, year]);
  const phaseLabels = revenuePhase === "H2" ? monthLabels.slice(6) : monthLabels.slice(0, 6);
  const phaseData = revenuePhase === "H2" ? monthlyRevenue.slice(6) : monthlyRevenue.slice(0, 6);
  const phaseRangeLabel = revenuePhase === "H2" ? "Jul - Dec" : "Jan - Jun";
  const hasPhaseRevenue = phaseData.some((v) => v > 0);

  const weeklyRevenue = useMemo(() => {
    const totals = Array(5).fill(0);
    const parsed = parseMonthInput(monthInput);
    if (!parsed) return totals;
    allOrders.forEach((o) => {
      if (!o.created_at) return;
      const d = new Date(o.created_at);
      if (d.getFullYear() !== parsed.year || d.getMonth() !== parsed.month) return;
      const idx = Math.min(4, Math.floor((d.getDate() - 1) / 7));
      totals[idx] += parseFloat(o.total_amount || 0);
    });
    return totals;
  }, [allOrders, monthInput]);
  const hasWeeklyRevenue = weeklyRevenue.some((v) => v > 0);
  const weeklyLabels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];

  const kpiOrders = useMemo(() => {
    if (!kpiDate) return [];
    return allOrders.filter((o) => toDateInput(o.created_at) === kpiDate);
  }, [allOrders, kpiDate]);
  const kpiOrdersCount = kpiOrders.length;
  const kpiRevenue = kpiOrders.reduce(
    (sum, o) => sum + parseFloat(o.total_amount || 0),
    0
  );
  const kpiActiveRestaurants = new Set(
    kpiOrders.map((o) => o.restaurant_id)
  ).size;
  const kpiAvgOrderValue =
    kpiOrdersCount > 0 ? Math.round(kpiRevenue / kpiOrdersCount) : 0;
  const kpiDateLabel = formatFullDate(kpiDate);
  const presentDateLabel = formatDateDayYear(todayInput());
  const dayPhaseWish = getDayPhaseWish(new Date().getHours());

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-loading-inner">
          <div className="loading-logo">🍽️</div>
          <div className="loading-ring"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-error">
        <div className="dash-error-inner">
          <span className="error-icon">⚠️</span>
          <h3>Failed to load dashboard</h3>
          <p>{error}</p>
          <button className="error-retry" onClick={() => fetchDashboard()}>Retry</button>
        </div>
      </div>
    );
  }

  const totalOrders      = stats?.total_orders       ?? 0;
  const totalRevenue     = stats?.total_revenue      ?? 0;

  // Plan flags — null means still loading, treat as full access to avoid flash of locked content
  const isPremium  = planName === "Premium" || planName === null;
  const isPro      = planName === "Pro";
  const isTrial    = planName === "Trial";
  const isBasic    = planName === "Basic";

  // ── Top Revenue Restaurants ──
  const topRestaurants = (() => {
    if (!restaurants.length) return [];
    const map = {};
    allOrders.forEach(o => {
      const id   = o.restaurant_id;
      const name = o.restaurant_name || restaurants.find(r => r.id === id)?.restaurant_name || "Unknown";
      if (!map[id]) map[id] = { id, name, orders: 0, revenue: 0 };
      map[id].orders  += 1;
      map[id].revenue += parseFloat(o.total_amount || 0);
    });
    restaurants.forEach(r => {
      if (!map[r.id]) map[r.id] = { id: r.id, name: r.restaurant_name || r.name, orders: 0, revenue: 0 };
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  })();
  const maxRevenue = topRestaurants[0]?.revenue || 1;

  const filteredOrders = (() => {
    const start = parseDateInput(rangeStart);
    const end = parseDateInput(rangeEnd);
    if (!start || !end || end < start) return [];
    return allOrders.filter((o) => {
      const dateKey = toDateInput(o.created_at);
      return dateKey && dateKey >= rangeStart && dateKey <= rangeEnd;
    });
  })();

  const rangeSeries = (() => {
    const start = parseDateInput(rangeStart);
    const end = parseDateInput(rangeEnd);
    if (!start || !end || end < start) return [];
    const days = Math.floor((end - start) / 86400000);
    const map = new Map();
    for (let i = 0; i <= days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = toDateInput(d);
      map.set(key, { date: key, revenue: 0, orders: 0 });
    }
    filteredOrders.forEach((o) => {
      const key = toDateInput(o.created_at);
      if (!map.has(key)) return;
      const row = map.get(key);
      row.orders += 1;
      row.revenue += parseFloat(o.total_amount || 0);
    });
    return Array.from(map.values()).map((row) => ({
      ...row,
      label: formatShortDate(row.date),
    }));
  })();

  // ── Peak Hours Heatmap ──

  return (
    <div className="dash-page">
      <main className="dash-main">

        {/* ── Header ── */}
        <div className="dash-header">
          <div>
            <p className="dash-greeting">
              <span className="dash-greet-icon">
                {(greeting === "Good Morning" || greeting === "Good Afternoon")
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                }
              </span>
              {greeting}
            </p>
            <h1 className="dash-title">Dashboard</h1>
            <p className="dash-subtitle">Overview of your restaurant operations</p>
          </div>
          <div className="dash-header-right">
            <div className="dash-right-date" aria-live="polite">
              <p className="dash-right-date-main">{presentDateLabel}</p>
              <p className="dash-right-date-sub">
                {dayPhaseWish.message}
                <span className="dash-right-date-symbol" aria-hidden="true">
                  {dayPhaseWish.symbol}
                </span>
              </p>
            </div>
            <div className="dash-header-actions">
              <label className="dash-date-picker" onClick={openKpiDatePicker}>
                <span
                  className="dash-date-icon"
                  role="button"
                  tabIndex={0}
                  aria-label="Open calendar"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openKpiDatePicker();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openKpiDatePicker();
                    }
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                    <rect x="3" y="5" width="18" height="16" rx="2"/>
                    <line x1="16" y1="3" x2="16" y2="7"/>
                    <line x1="8" y1="3" x2="8" y2="7"/>
                    <line x1="3" y1="11" x2="21" y2="11"/>
                  </svg>
                </span>
                <span className="dash-date-text">{kpiDateLabel || "Select date"}</span>
                <span className="dash-date-caret">
                  <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                    <path d="M5 7l5 6 5-6H5z"/>
                  </svg>
                </span>
                <input
                  ref={kpiDateInputRef}
                  type="date"
                  value={kpiDate}
                  onChange={(e) => setKpiDate(e.target.value)}
                />
              </label>
              <button
                type="button"
                className={`dash-refresh-btn ${refreshing ? "spinning" : ""}`}
                onClick={() => fetchDashboard(true)}
                title="Refresh data"
                aria-label="Refresh dashboard data"
                disabled={refreshing}
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Stat Cards (all plans) ── */}
        <div className={`dash-cards ${animateCards ? "dash-cards--animate" : ""}`}>
          <StatCard
            title="Total Orders" value={kpiOrdersCount.toLocaleString("en-IN")}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>}
            iconColor="#3B82F6" iconBg="rgba(59,130,246,0.12)"
            change={`${totalOrders} orders all time`} positive={null} delay="0s"
            sparkColor="#3B82F6" sparkData={[3,7,5,9,6,11,8,14,10,kpiOrdersCount||1]}
          />
          <StatCard
            title="Revenue" value={`₹${Math.round(kpiRevenue).toLocaleString("en-IN")}`}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
            iconColor="#10B981" iconBg="rgba(16,185,129,0.12)"
            change={`₹${totalRevenue.toLocaleString("en-IN")} all time`} positive={null} delay="0.08s"
            sparkColor="#10B981" sparkData={[5,8,6,12,9,15,11,17,13,kpiRevenue>0?18:5]}
          />
          <StatCard
            title="Active Restaurants" value={kpiActiveRestaurants.toLocaleString("en-IN")}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
            iconColor="#F59E0B" iconBg="rgba(245,158,11,0.12)"
            change="On selected date" positive={null} delay="0.16s"
            sparkColor="#F59E0B" sparkData={[1,2,2,3,3,4,4,5,5,kpiActiveRestaurants||1]}
          />
          <StatCard
            title="Avg. Order Value" value={kpiAvgOrderValue > 0 ? `₹${kpiAvgOrderValue.toLocaleString("en-IN")}` : "—"}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
            iconColor="#8B5CF6" iconBg="rgba(139,92,246,0.12)"
            change="Selected date average" positive={null} delay="0.24s"
            sparkColor="#8B5CF6" sparkData={[8,6,10,7,12,9,11,8,13,kpiAvgOrderValue>0?15:8]}
          />
        </div>

        {/* ── Charts — locked for Basic ── */}
        {isBasic ? (
          <>
            <UpgradeBanner text="Upgrade to Pro or Premium to unlock the Revenue chart" plan="Pro" />
            <div className="dash-charts" style={{marginTop:16}}>
              <DashLocked title="Revenue Chart Locked" subtitle="Visual revenue trends over time" requiredPlan="Pro" />
            </div>
          </>
        ) : (
          <>
            <div className="dash-charts">
              <div className="dash-chart-card">
                <div className="chart-card-header">
                  <div>
                    <h3 className="chart-title">Revenue Overview</h3>
                    <p className="chart-sub">
                      {rangeStart === rangeEnd
                        ? `Selected: ${formatShortDate(rangeStart)}`
                        : `Selected: ${formatShortDate(rangeStart)} - ${formatShortDate(rangeEnd)}`}
                    </p>
                  </div>
                  <div className="dash-range-picker chart-range-inline">
                    <label className="dash-range-field">
                      <span>From</span>
                      <input
                        type="date"
                        value={rangeStart}
                        onChange={(e) => {
                          const next = e.target.value;
                          setRangeStart(next);
                          if (rangeEnd && next > rangeEnd) setRangeEnd(next);
                        }}
                      />
                    </label>
                    <label className="dash-range-field">
                      <span>To</span>
                      <input
                        type="date"
                        value={rangeEnd}
                        onChange={(e) => {
                          const next = e.target.value;
                          setRangeEnd(next);
                          if (rangeStart && next < rangeStart) setRangeStart(next);
                        }}
                      />
                    </label>
                  </div>
                  {totalRevenue > 0 && <div className="chart-badge chart-badge--blue">₹{totalRevenue.toLocaleString("en-IN")} total</div>}
                </div>
                {filteredOrders.length === 0 && <p className="dash-range-note">No order data yet for this period</p>}
                {filteredOrders.length > 0
                  ? <LineChart data={rangeSeries.map(d => d.revenue || 0)} labels={rangeSeries.map(d => d.label || "")} color="#3B82F6" prefix="₹"/>
                  : <EmptyChart message="Place some orders to see revenue chart" />
                }
              </div>
              <div className="dash-chart-card">
                <div className="chart-card-header">
                  <div>
                    <h3 className="chart-title">Monthly Revenue</h3>
                    <p className="chart-sub">{phaseRangeLabel} {year}</p>
                  </div>
                  <div className="chart-actions">
                    <div className="chart-phase">
                      <button
                        className={revenuePhase === "H1" ? "phase-btn phase-btn--active" : "phase-btn"}
                        onClick={() => setRevenuePhase("H1")}
                      >
                        Phase 1
                      </button>
                      <button
                        className={revenuePhase === "H2" ? "phase-btn phase-btn--active" : "phase-btn"}
                        onClick={() => setRevenuePhase("H2")}
                      >
                        Phase 2
                      </button>
                    </div>
                    <div className="chart-year">
                      <label>Year</label>
                      <select value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))}>
                        {yearOptions.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                {hasPhaseRevenue
                  ? <BarChart data={phaseData} labels={phaseLabels} color="#F59E0B" prefix="₹" showValues />
                  : <EmptyChart message="No revenue for this phase" />
                }
              </div>
            </div>
          </>
        )}

        {/* ── Two Panels ── */}
        <div className="dash-panels">
          {/* Weekly Revenue */}
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Weekly Revenue</h3>
                <p className="panel-sub">Weeks in {formatMonthYear(monthInput)}</p>
              </div>
              <div className="panel-month">
                <label>Month</label>
                <input
                  type="month"
                  value={monthInput}
                  onChange={(e) => setMonthInput(e.target.value)}
                />
              </div>
            </div>
            {isBasic ? (
              <DashLocked title="Weekly Revenue Locked" subtitle="See revenue by week within a month" requiredPlan="Pro" />
            ) : !hasWeeklyRevenue ? (
              <div className="panel-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36" style={{color:"#1C2A42"}}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <p>No revenue for this month</p>
              </div>
            ) : (
              <BarChart data={weeklyRevenue} labels={weeklyLabels} color="#10B981" prefix="₹" showValues />
            )}
          </div>

          {/* Top 3 Revenue */}
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Top 3 Revenue</h3>
                <p className="panel-sub">Best performing restaurants</p>
              </div>
              <div className="panel-icon" style={{ color: "#F59E0B", background: "rgba(245,158,11,0.1)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              </div>
            </div>
            {isBasic ? (
              <DashLocked title="Top Revenue Locked" subtitle="Restaurant revenue comparison" requiredPlan="Pro" />
            ) : topRestaurants.filter(r=>r.revenue>0).length === 0 ? (
              <div className="panel-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36" style={{color:"#1C2A42"}}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <p>No revenue yet</p>
              </div>
            ) : (
              <div className="top3-wrap">
                {topRestaurants.slice(0,3).map((r,i)=>{
                  const gradients = ["linear-gradient(90deg,#F59E0B,#FCD34D)","linear-gradient(90deg,#3B82F6,#60A5FA)","linear-gradient(90deg,#10B981,#34D399)"];
                  const barPct = maxRevenue>0 ? (r.revenue/maxRevenue)*100 : 0;
                  const medalTone = i === 0 ? "top3-medal--gold" : i === 1 ? "top3-medal--silver" : "top3-medal--bronze";
                  return (
                    <div key={r.id} className={`top3-row ${i===0?"top3-row--gold":""}`}>
                      <div className={`top3-medal ${medalTone}`}>
                        <svg className="top3-medal-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M8 2h3l1 5H9z" fill="currentColor" opacity="0.8" />
                          <path d="M13 2h3l-1 5h-3z" fill="currentColor" opacity="0.6" />
                          <circle cx="12" cy="14" r="6" fill="currentColor" opacity="0.22" />
                          <circle cx="12" cy="14" r="4.4" fill="currentColor" opacity="0.35" />
                        </svg>
                        <span className="top3-medal-rank">{i + 1}</span>
                      </div>
                      <div className="top3-info">
                        <div className="top3-nameline">
                          <span className="top3-name">{r.name}</span>
                          <span className="top3-orders">{r.orders} order{r.orders!==1?"s":""}</span>
                        </div>
                        <div className="top3-bar-track">
                          <div className="top3-bar-fill" style={{width:`${barPct}%`,background:gradients[i]}}/>
                        </div>
                      </div>
                      <div className="top3-rev" style={{color:i===0?"#F59E0B":i===1?"#60A5FA":"#34D399"}}>
                        ₹{r.revenue.toLocaleString("en-IN")}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Leaderboard ── */}
        {isBasic ? (
          <div className="leaderboard-card">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Revenue Leaderboard</h3>
                <p className="panel-sub">All restaurants ranked by total revenue</p>
              </div>
            </div>
            <DashLocked title="Leaderboard Locked" subtitle="Full restaurant revenue ranking" requiredPlan="Pro" />
            <UpgradeBanner text="Upgrade to Pro or Premium to access advanced insights and analytics" plan="Pro" />
          </div>
        ) : (
          <div className="leaderboard-card">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Revenue Leaderboard</h3>
                <p className="panel-sub">All restaurants ranked by total revenue</p>
              </div>
              <div className="panel-icon" style={{ color: "#3B82F6", background: "rgba(59,130,246,0.1)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </div>
            </div>
            <div className="lb-table">
              <div className="lb-thead">
                <span className="lb-th lb-th--rank">#</span>
                <span className="lb-th lb-th--name">Restaurant</span>
                <span className="lb-th lb-th--orders">Orders</span>
                <span className="lb-th lb-th--avg">Avg. Order</span>
                <span className="lb-th lb-th--share">Revenue Share</span>
                <span className="lb-th lb-th--rev">Total Revenue</span>
              </div>
              {topRestaurants.length === 0 ? (
                <div className="panel-empty" style={{padding:"32px 0"}}><p>No restaurant data</p></div>
              ) : topRestaurants.map((r,i)=>{
                const shareBarPct = maxRevenue>0 ? (r.revenue/maxRevenue)*100 : 0;
                const avgVal      = r.orders>0 ? Math.round(r.revenue/r.orders) : 0;
                const totalRev    = topRestaurants.reduce((s,x)=>s+x.revenue,0);
                const sharePct    = totalRev>0 ? Math.round((r.revenue/totalRev)*100) : 0;
                const medals      = ["#F59E0B","#8896B3","#CD7C3A"];
                const dotColors   = ["#F59E0B","#3B82F6","#10B981","#8B5CF6","#EC4899"];
                return (
                  <div key={r.id} className={`lb-row ${i===0?"lb-row--top":""}`}>
                    <span className="lb-rank">
                      {i<3
                        ? <span className="lb-medal" style={{color:medals[i],background:`${medals[i]}15`,borderColor:`${medals[i]}30`}}>{i+1}</span>
                        : <span className="lb-num">{i+1}</span>}
                    </span>
                    <span className="lb-name">
                      <span className="lb-dot" style={{background:dotColors[i%dotColors.length]}}/>
                      {r.name}
                    </span>
                    <span className="lb-orders"><span className="lb-orders-pill">{r.orders}</span></span>
                    <span className="lb-avg">₹{avgVal.toLocaleString("en-IN")}</span>
                    <span className="lb-share">
                      <div className="lb-share-track">
                        <div className="lb-share-fill" style={{
                          width:`${shareBarPct}%`,
                          background:i===0?"linear-gradient(90deg,#F59E0B,#FCD34D)":i===1?"linear-gradient(90deg,#3B82F6,#60A5FA)":"linear-gradient(90deg,#10B981,#34D399)"
                        }}/>
                      </div>
                      <span className="lb-share-pct">{sharePct}%</span>
                    </span>
                    <span className="lb-rev">₹{r.revenue.toLocaleString("en-IN")}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

function StatCard({ title, value, icon, iconColor, iconBg, change, positive, delay, sparkColor, sparkData }) {
  return (
    <div className="stat-card" style={{ animationDelay: delay }}>
      <div className="stat-card-top">
        <div className="stat-left">
          <p className="stat-title">{title}</p>
          <h2 className="stat-value">{value}</h2>
          <p className={`stat-change ${positive === true ? "stat-change--up" : positive === false ? "stat-change--down" : "stat-change--neutral"}`}>
            {positive === true ? "+" : ""}{change}
          </p>
        </div>
        <div className="stat-icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
      </div>
      {sparkData && <MiniSparkline color={sparkColor} data={sparkData} />}
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="empty-chart">
      <svg viewBox="0 0 20 20" fill="currentColor" width="28" height="28" style={{ color: "#2a2a2a" }}>
        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
      </svg>
      <p>{message}</p>
    </div>
  );
}

function MiniSparkline({ data, color }) {
  if (!data || data.length < 2) return <div className="mini-chart-empty" />;
  const W = 200, H = 48;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 6) - 3;
    return `${x},${y}`;
  }).join(" ");
  const fillPts = `0,${H} ` + pts + ` ${W},${H}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mini-sparkline" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#sg-${color.replace("#","")})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      {(() => {
        const last = data[data.length - 1];
        const x = W;
        const y = H - ((last - min) / range) * (H - 6) - 3;
        return <circle cx={x} cy={y} r="3" fill={color}/>;
      })()}
    </svg>
  );
}

function LineChart({ data, labels, color, prefix = "" }) {
  if (!data || data.length === 0) return <EmptyChart message="No data" />;
  const max = Math.max(...data); const min = Math.min(...data);
  const range = max - min || 1;
  const W = 500, H = 170, padL = 52, padR = 12, padT = 10, padB = 30;
  const iW = W - padL - padR; const iH = H - padT - padB;
  const pts = data.map((v, i) => [padL + (i / Math.max(data.length - 1, 1)) * iW, padT + (1 - (v - min) / range) * iH]);
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]},${p[1]}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length-1][0]},${padT + iH} L ${pts[0][0]},${padT + iH} Z`;
  const fmt = (v) => prefix ? `${prefix}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}` : (v >= 1000 ? `${(v/1000).toFixed(0)}k` : v);
  const fmtValue = (v) => {
    const rounded = Math.round(v || 0);
    return prefix ? `${prefix}${rounded.toLocaleString("en-IN")}` : rounded.toLocaleString("en-IN");
  };
  const ticks = [0, 0.5, 1].map(t => ({ val: min + t * range, y: padT + (1 - t) * iH }));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={t.y} x2={W-padR} y2={t.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4,4"/>
          <text x={padL-6} y={t.y+4} textAnchor="end" fill="#444" fontSize="10">{fmt(t.val)}</text>
        </g>
      ))}
      <path d={areaD} fill="url(#lineGrad)"/>
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map(([x, y], i) => {
        const show = data.length <= 10 || i % Math.ceil(data.length / 7) === 0 || i === data.length - 1;
        const valueY = Math.max(y - 8, padT + 8);
        return (
          <g key={i}>
            {show && <circle cx={x} cy={y} r="3.5" fill={color} stroke="#141414" strokeWidth="1.5"/>}
            {show && (
              <text x={x} y={valueY} textAnchor="middle" fill="#7A8BA8" fontSize="10" fontWeight="600">
                {fmtValue(data[i])}
              </text>
            )}
            {show && <text x={x} y={H-8} textAnchor="middle" fill="#444" fontSize="10">{labels[i]}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function BarChart({ data, labels, color, prefix = "", showValues = false }) {
  if (!data || data.length === 0) return <EmptyChart message="No data" />;
  const max = Math.max(...data) || 1;
  const W = 500, H = 170, padL = 36, padR = 12, padT = showValues ? 18 : 10, padB = 30;
  const iW = W - padL - padR; const iH = H - padT - padB;
  const barW = (iW / data.length) * 0.6;
  const gap  = iW / data.length;
  const compactFormatter = (() => {
    try {
      return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
    } catch {
      return null;
    }
  })();
  const fmtValueFull = (v) => {
    const rounded = Math.round(v || 0);
    return prefix ? `${prefix}${rounded.toLocaleString("en-IN")}` : rounded.toLocaleString("en-IN");
  };
  const fmtValue = (v) => {
    const value = Math.round(v || 0);
    const compact = compactFormatter ? compactFormatter.format(value) : value.toString();
    return prefix ? `${prefix}${compact}` : compact;
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      {[0, 0.5, 1].map((t, i) => {
        const val = Math.round(t * max);
        const y   = padT + (1 - t) * iH;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W-padR} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4,4"/>
            <text x={padL-4} y={y+4} textAnchor="end" fill="#444" fontSize="10">{val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}</text>
          </g>
        );
      })}
      {data.map((v, i) => {
        const bh = (v / max) * iH;
        const x  = padL + i * gap + (gap - barW) / 2;
        const y  = padT + iH - bh;
        const show = data.length <= 10 || i % Math.ceil(data.length / 7) === 0 || i === data.length - 1;
        const showValue = showValues && v > 0;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} fill={color} rx="4" opacity="0.85" title={fmtValueFull(v)} />
            {showValue && (
              <text
                x={x + barW/2}
                y={Math.max(y - 6, padT + 10)}
                textAnchor="middle"
                fill="#F8FAFC"
                fontSize="9"
                fontWeight="700"
                paintOrder="stroke"
                stroke="#0A0A0A"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {fmtValue(v)}
              </text>
            )}
            {show && <text x={x + barW/2} y={H-8} textAnchor="middle" fill="#444" fontSize="10">{labels[i]}</text>}
          </g>
        );
      })}
    </svg>
  );
}
