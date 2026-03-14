import { useEffect, useState } from "react";
import "./OwnerAnalytics.css";

const RANGES = [
  { label: "7D",    value: "7"   },
  { label: "30D",   value: "30"  },
  { label: "3M",    value: "90"  },
  { label: "1Y",    value: "365" },
];

const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ── Locked Section Overlay ── */
function LockedSection({ plan, requiredPlan, children }) {
  return (
    <div style={{ position: "relative", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ filter: "blur(3px)", pointerEvents: "none", userSelect: "none", opacity: 0.4 }}>
        {children}
      </div>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: "rgba(8,12,20,0.7)", backdropFilter: "blur(2px)",
        borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" width="20" height="20">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>
        <p style={{ color: "#EDF2FF", fontWeight: 600, fontSize: 14, margin: 0 }}>
          {requiredPlan} Feature
        </p>
        <p style={{ color: "#7A8BA8", fontSize: 12, margin: "4px 0 14px", textAlign: "center", maxWidth: 220 }}>
          Upgrade to {requiredPlan} to unlock this section
        </p>
        <a href="/subscription" style={{
          padding: "7px 16px", borderRadius: 7,
          background: "linear-gradient(135deg, #A855F7, #7C3AED)",
          color: "#fff", fontSize: 12, fontWeight: 500,
          textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5,
        }}>
          Upgrade Now →
        </a>
      </div>
    </div>
  );
}

/* ── Full Page Locked ── */
function AnalyticsLocked() {
  return (
    <div className="ana-page">
      <div style={{
        maxWidth: 480, margin: "80px auto", textAlign: "center",
        padding: "60px 40px",
        background: "#0D1220", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="1.8" width="28" height="28">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>
        <h2 style={{ color: "#EDF2FF", fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>
          Analytics Locked
        </h2>
        <p style={{ color: "#7A8BA8", fontSize: 14, lineHeight: 1.6, margin: "0 0 8px" }}>
          Your current plan does not include the Analytics dashboard.
        </p>
        <p style={{ color: "#A855F7", fontSize: 13, fontWeight: 500, margin: "0 0 28px" }}>
          Upgrade to Pro or Premium to unlock Analytics
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 28 }}>
          {[
            { plan: "Pro", price: "₹4,999", color: "#3B82F6", features: ["5 restaurants", "Revenue charts", "Order trends", "Restaurant breakdown"] },
            { plan: "Premium", price: "₹9,999", color: "#A855F7", features: ["10 restaurants", "Full analytics", "Advanced insights", "All features"] },
          ].map(p => (
            <div key={p.plan} style={{
              flex: 1, padding: "16px 14px", borderRadius: 10,
              background: `${p.color}08`, border: `1px solid ${p.color}22`,
              textAlign: "left",
            }}>
              <div style={{ color: p.color, fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{p.plan}</div>
              <div style={{ color: "#EDF2FF", fontSize: 16, fontWeight: 600, marginBottom: 10 }}>{p.price}<span style={{ color: "#7A8BA8", fontSize: 11, fontWeight: 400 }}>/mo</span></div>
              {p.features.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, fontSize: 12, color: "#7A8BA8" }}>
                  <svg viewBox="0 0 16 16" fill="none" width="11" height="11"><path d="M3 8l3.5 3.5L13 4.5" stroke={p.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {f}
                </div>
              ))}
            </div>
          ))}
        </div>
        <a href="/subscription" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "10px 24px", borderRadius: 8,
          background: "linear-gradient(135deg, #A855F7, #7C3AED)",
          color: "#fff", fontSize: 13, fontWeight: 500, textDecoration: "none",
        }}>
          View Plans →
        </a>
      </div>
    </div>
  );
}

/* ── Pro Upgrade Banner ── */
function ProUpgradeBanner() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 20px", borderRadius: 10, marginTop: 16,
      background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.15)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" width="16" height="16">
          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
        <span style={{ color: "#EDF2FF", fontSize: 13, fontWeight: 500 }}>
          Upgrade to Premium to unlock advanced analytics insights
        </span>
      </div>
      <a href="/subscription" style={{
        padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500,
        background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)",
        color: "#A855F7", textDecoration: "none", whiteSpace: "nowrap",
      }}>
        Upgrade →
      </a>
    </div>
  );
}

export default function OwnerAnalytics() {
  const [timeRange,    setTimeRange]    = useState("30");
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState(null);
  const [restaurants,  setRestaurants]  = useState([]);
  const [allOrders,    setAllOrders]    = useState([]);
  const [menuItems,    setMenuItems]    = useState([]);
  const [selectedRest, setSelectedRest] = useState("all");
  const [planName,     setPlanName]     = useState(null); // null = loading
  const token = localStorage.getItem("token");

  useEffect(() => { loadAll(); }, [timeRange]);

  const loadAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch plan
      try {
        const pRes  = await fetch("http://localhost:5000/api/subscription/current", { headers });
        const pData = await pRes.json();
        if (pData.status === "success") {
          const d = pData.data;
          const name = d?.name ?? d?.plan_name ?? d?.subscription?.plan_name ?? d?.plan?.name ?? null;
          console.log("SUB DATA:", JSON.stringify(d), "PLAN:", name);
          if (name) setPlanName(name);
        }
      } catch(e) { console.error("plan fetch:", e); }

      const rRes  = await fetch("http://localhost:5000/api/restaurants", { headers });
      const rData = await rRes.json();
      const rList = rData.data?.restaurants ?? rData.data ?? [];
      const restArr = Array.isArray(rList) ? rList : [];
      setRestaurants(restArr);

      const oRes  = await fetch("http://localhost:5000/api/orders", { headers });
      const oData = await oRes.json();
      const orders = Array.isArray(oData.data) ? oData.data : [];
      setAllOrders(orders);

      const allItems = [];
      for (const r of restArr) {
        try {
          const mRes  = await fetch(`http://localhost:5000/api/restaurants/${r.id}/menu`, { headers });
          const mData = await mRes.json();
          const items = mData.data?.items ?? mData.data ?? [];
          if (Array.isArray(items)) {
            items.forEach(item => allItems.push({ ...item, restaurant_id: r.id, restaurant_name: r.restaurant_name || r.name }));
          }
        } catch {}
      }
      setMenuItems(allItems);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Plan helpers — null = still loading, show full access to avoid flash of locked content
  const isPremium = planName === "Premium" || planName === null;
  const isPro     = planName === "Pro";
  const isTrial   = planName === "Trial";
  const isBasic   = planName === "Basic";
  const hasAnalytics = isPremium || isPro || isTrial;

  // ── Filter orders ──
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - parseInt(timeRange));
  const rangedOrders = allOrders.filter(o =>
    o.created_at ? new Date(o.created_at) >= cutoff : true
  );
  const filteredOrders = selectedRest === "all"
    ? rangedOrders
    : rangedOrders.filter(o => String(o.restaurant_id) === String(selectedRest));

  // ── Per-Restaurant Stats ──
  const restStats = restaurants.map(r => {
    const rOrders  = rangedOrders.filter(o => String(o.restaurant_id) === String(r.id));
    const revenue  = rOrders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    const completed = rOrders.filter(o => o.status === "completed").length;
    const cancelled = rOrders.filter(o => o.status === "cancelled").length;
    const avg      = rOrders.length > 0 ? revenue / rOrders.length : 0;
    return {
      id: r.id, name: r.restaurant_name || r.name,
      location: r.location || r.address || "—",
      orders: rOrders.length, revenue, avg: Math.round(avg),
      completed, cancelled,
      completionRate: rOrders.length > 0 ? Math.round((completed / rOrders.length) * 100) : 0,
    };
  }).sort((a, b) => b.revenue - a.revenue);
  const maxRestRevenue = restStats[0]?.revenue || 1;

  // ── Order Status Funnel ──
  const statusCounts = {
    pending:   filteredOrders.filter(o => o.status === "pending").length,
    confirmed: filteredOrders.filter(o => o.status === "confirmed").length,
    completed: filteredOrders.filter(o => o.status === "completed").length,
    cancelled: filteredOrders.filter(o => o.status === "cancelled").length,
  };
  const totalF = filteredOrders.length || 1;

  // ── Day of Week ──
  const dowRevenue = Array(7).fill(0);
  const dowOrders  = Array(7).fill(0);
  filteredOrders.forEach(o => {
    if (o.created_at) {
      const d = new Date(o.created_at).getDay();
      dowRevenue[d] += parseFloat(o.total_amount || 0);
      dowOrders[d]  += 1;
    }
  });
  const maxDowRev = Math.max(...dowRevenue, 1);
  const maxDowOrd = Math.max(...dowOrders, 1);

  // ── Timeline ──
  const timelineMap = {};
  filteredOrders.forEach(o => {
    if (!o.created_at) return;
    const d   = new Date(o.created_at);
    const key = parseInt(timeRange) <= 30
      ? `${d.getDate()} ${MONTHS[d.getMonth()]}`
      : `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    if (!timelineMap[key]) timelineMap[key] = { revenue: 0, orders: 0 };
    timelineMap[key].revenue += parseFloat(o.total_amount || 0);
    timelineMap[key].orders  += 1;
  });
  const timelineKeys    = Object.keys(timelineMap);
  const timelineRevenue = timelineKeys.map(k => timelineMap[k].revenue);
  const timelineOrders  = timelineKeys.map(k => timelineMap[k].orders);
  const maxTLRev = Math.max(...timelineRevenue, 1);
  const maxTLOrd = Math.max(...timelineOrders, 1);

  // ── Menu Performance ──
  const menuPerf = (() => {
    const map = {};
    filteredOrders.forEach(o => {
      let items = [];
      try { items = typeof o.items === "string" ? JSON.parse(o.items) : (o.items || []); } catch {}
      items.forEach(item => {
        const key = item.name || item.item_name || "Unknown";
        if (!map[key]) map[key] = { name: key, qty: 0, revenue: 0, category: item.category || "—" };
        const qty   = parseInt(item.quantity || item.qty || 1);
        const price = parseFloat(item.price || item.unit_price || 0);
        map[key].qty     += qty;
        map[key].revenue += qty * price;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  })();
  const maxMenuRev = menuPerf[0]?.revenue || 1;

  // ── Category Breakdown ──
  const categoryMap = {};
  menuPerf.forEach(item => {
    const cat = item.category || "Other";
    if (!categoryMap[cat]) categoryMap[cat] = { name: cat, revenue: 0, qty: 0 };
    categoryMap[cat].revenue += item.revenue;
    categoryMap[cat].qty     += item.qty;
  });
  const categories  = Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);
  const totalCatRev = categories.reduce((s, c) => s + c.revenue, 0) || 1;
  const catColors   = ["#3B82F6","#10B981","#F59E0B","#8B5CF6","#EC4899","#06B6D4"];

  if (loading) return (
    <div className="ana-page">
      <div className="ana-center">
        <div className="ana-spinner" />
        <p>Loading analytics...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="ana-page">
      <div className="ana-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" width="40" height="40"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p style={{color:"#EF4444",fontWeight:700,marginTop:12}}>Failed to load</p>
        <p style={{color:"#4A5568",fontSize:13}}>{error}</p>
        <button className="ana-retry" onClick={() => loadAll()}>Retry</button>
      </div>
    </div>
  );

  // ── Basic plan = full lock ──
  if (isBasic) return <AnalyticsLocked />;

  return (
    <div className="ana-page">
      <div className="ana-inner">

        {/* ══ HEADER ══ */}
        <div className="ana-header">
          <div>
            <h1 className="ana-title">Owner Analytics</h1>
            <p className="ana-subtitle">Deep insights across your restaurant network</p>
          </div>
          <div className="ana-header-right">
            <select className="ana-rest-select" value={selectedRest} onChange={e => setSelectedRest(e.target.value)}>
              <option value="all">All Restaurants</option>
              {restaurants.map(r => (
                <option key={r.id} value={String(r.id)}>{r.restaurant_name || r.name}</option>
              ))}
            </select>
            <div className="ana-range-tabs">
              {RANGES.map(r => (
                <button key={r.value}
                  className={`ana-range-tab ${timeRange === r.value ? "ana-range-tab--active" : ""}`}
                  onClick={() => setTimeRange(r.value)}>{r.label}</button>
              ))}
            </div>
            <button className={`ana-refresh ${refreshing ? "spinning" : ""}`} onClick={() => loadAll(true)} title="Refresh">
              <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ══ ROW 1: Timeline + Funnel (Pro + Premium + Trial) ══ */}
        <div className="ana-row ana-row--6040">
          <div className="ana-card">
            <div className="ana-card-header">
              <div>
                <h3 className="ana-card-title">Revenue & Orders Over Time</h3>
                <p className="ana-card-sub">{parseInt(timeRange) <= 30 ? "Daily" : "Monthly"} breakdown · last {timeRange === "365" ? "12 months" : `${timeRange} days`}</p>
              </div>
              <div className="ana-card-legend">
                <span className="leg-dot" style={{background:"#3B82F6"}} /> Revenue
                <span className="leg-dot" style={{background:"#10B981",marginLeft:12}} /> Orders
              </div>
            </div>
            {timelineKeys.length === 0 ? (
              <EmptyState label="No order data in this period" />
            ) : (
              <div className="timeline-chart">
                <svg viewBox="0 0 600 160" preserveAspectRatio="none" className="timeline-svg">
                  <defs>
                    <linearGradient id="tl-rev-g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02"/>
                    </linearGradient>
                    <linearGradient id="tl-ord-g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.25"/>
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.02"/>
                    </linearGradient>
                  </defs>
                  {(() => {
                    const pts = timelineRevenue.map((v,i) => {
                      const x = (i/(timelineRevenue.length-1||1))*600;
                      const y = 155 - (v/maxTLRev)*140;
                      return `${x},${y}`;
                    }).join(" ");
                    const fill = `0,155 ${pts} 600,155`;
                    return <><polygon points={fill} fill="url(#tl-rev-g)"/><polyline points={pts} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></>;
                  })()}
                  {(() => {
                    const pts = timelineOrders.map((v,i) => {
                      const x = (i/(timelineOrders.length-1||1))*600;
                      const y = 155 - (v/maxTLOrd)*140;
                      return `${x},${y}`;
                    }).join(" ");
                    const fill = `0,155 ${pts} 600,155`;
                    return <><polygon points={fill} fill="url(#tl-ord-g)"/><polyline points={pts} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5,3"/></>;
                  })()}
                </svg>
                <div className="timeline-labels">
                  {timelineKeys.filter((_,i) => {
                    const step = Math.max(1, Math.floor(timelineKeys.length / 6));
                    return i % step === 0;
                  }).map((k,i) => <span key={i} className="tl-label">{k}</span>)}
                </div>
              </div>
            )}
          </div>

          <div className="ana-card">
            <div className="ana-card-header">
              <h3 className="ana-card-title">Order Status Funnel</h3>
              <p className="ana-card-sub">{filteredOrders.length} total orders</p>
            </div>
            <div className="funnel-wrap">
              {[
                { label: "Pending",   count: statusCounts.pending,   color: "#F59E0B" },
                { label: "Confirmed", count: statusCounts.confirmed, color: "#3B82F6" },
                { label: "Completed", count: statusCounts.completed, color: "#10B981" },
                { label: "Cancelled", count: statusCounts.cancelled, color: "#EF4444" },
              ].map((s, i) => {
                const pct = Math.round((s.count / totalF) * 100);
                return (
                  <div key={i} className="funnel-row">
                    <div className="funnel-label-wrap">
                      <span className="funnel-dot" style={{background: s.color}}/>
                      <span className="funnel-label">{s.label}</span>
                    </div>
                    <div className="funnel-bar-wrap">
                      <div className="funnel-track">
                        <div className="funnel-fill" style={{width:`${pct}%`, background: s.color}}/>
                      </div>
                      <span className="funnel-count">{s.count}</span>
                      <span className="funnel-pct">{pct}%</span>
                    </div>
                  </div>
                );
              })}
              <div className="funnel-summary">
                <div className="funnel-summary-item">
                  <span className="fs-val" style={{color:"#10B981"}}>
                    {filteredOrders.length > 0 ? Math.round((statusCounts.completed/filteredOrders.length)*100) : 0}%
                  </span>
                  <span className="fs-lbl">Completion Rate</span>
                </div>
                <div className="funnel-summary-div"/>
                <div className="funnel-summary-item">
                  <span className="fs-val" style={{color:"#EF4444"}}>
                    {filteredOrders.length > 0 ? Math.round((statusCounts.cancelled/filteredOrders.length)*100) : 0}%
                  </span>
                  <span className="fs-lbl">Cancellation Rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ ROW 2: Per-Restaurant Breakdown (Pro + Premium + Trial) ══ */}
        <div className="ana-card ana-card--full">
          <div className="ana-card-header">
            <div>
              <h3 className="ana-card-title">Per-Restaurant Breakdown</h3>
              <p className="ana-card-sub">Revenue, orders and completion rate per restaurant</p>
            </div>
          </div>
          {restStats.length === 0 ? (
            <EmptyState label="No restaurants found" />
          ) : (
            <div className="restbreakdown-table">
              <div className="rbt-head">
                <span className="rbt-h rbt-h--rank">#</span>
                <span className="rbt-h rbt-h--name">Restaurant</span>
                <span className="rbt-h rbt-h--loc">Location</span>
                <span className="rbt-h">Orders</span>
                <span className="rbt-h">Avg Order</span>
                <span className="rbt-h rbt-h--bar">Revenue</span>
                <span className="rbt-h rbt-h--rate">Completion</span>
                <span className="rbt-h rbt-h--rev">Total</span>
              </div>
              {restStats.map((r, i) => {
                const barPct   = maxRestRevenue > 0 ? (r.revenue / maxRestRevenue) * 100 : 0;
                const rowColors = ["#F59E0B","#3B82F6","#10B981","#8B5CF6","#EC4899","#06B6D4"];
                const col = rowColors[i % rowColors.length];
                return (
                  <div key={r.id} className={`rbt-row ${i === 0 ? "rbt-row--top" : ""}`}>
                    <span className="rbt-rank">
                      <span className="rbt-rank-num" style={{color:i<3?col:"#4A5568",borderColor:`${col}30`,background:i<3?`${col}10`:"transparent"}}>{i+1}</span>
                    </span>
                    <span className="rbt-name"><span className="rbt-dot" style={{background:col}}/>{r.name}</span>
                    <span className="rbt-loc">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10" style={{color:"#4A5568",flexShrink:0}}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      {r.location.length > 16 ? r.location.slice(0,16)+"…" : r.location}
                    </span>
                    <span className="rbt-val"><span className="rbt-pill" style={{color:"#60A5FA",background:"rgba(59,130,246,0.1)",borderColor:"rgba(59,130,246,0.2)"}}>{r.orders}</span></span>
                    <span className="rbt-val rbt-val--right">₹{r.avg.toLocaleString("en-IN")}</span>
                    <span className="rbt-bar-cell">
                      <div className="rbt-bar-track"><div className="rbt-bar-fill" style={{width:`${barPct}%`,background:`linear-gradient(90deg,${col},${col}88)`}}/></div>
                    </span>
                    <span className="rbt-rate"><span className="rbt-rate-val" style={{color:r.completionRate>=70?"#10B981":r.completionRate>=40?"#F59E0B":"#EF4444"}}>{r.completionRate}%</span></span>
                    <span className="rbt-rev">₹{r.revenue.toLocaleString("en-IN")}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ══ ROW 3: Day-of-Week + Category — LOCKED for Pro ══ */}
        <div className="ana-row ana-row--5050">
          {isPro ? (
            <LockedSection requiredPlan="Premium">
              <div className="ana-card" style={{minHeight:280}}>
                <div className="ana-card-header"><h3 className="ana-card-title">Revenue by Day of Week</h3></div>
                <div className="dow-chart" style={{opacity:0.3}}/>
              </div>
            </LockedSection>
          ) : (
            <div className="ana-card">
              <div className="ana-card-header">
                <div>
                  <h3 className="ana-card-title">Revenue by Day of Week</h3>
                  <p className="ana-card-sub">Which days drive the most business</p>
                </div>
              </div>
              <div className="dow-chart">
                {DOW.map((day, i) => {
                  const revPct = (dowRevenue[i] / maxDowRev) * 100;
                  const ordPct = (dowOrders[i]  / maxDowOrd) * 100;
                  const isTop  = dowRevenue[i] === Math.max(...dowRevenue) && dowRevenue[i] > 0;
                  return (
                    <div key={i} className="dow-col">
                      <div className="dow-bars">
                        <div className="dow-bar-wrap">
                          <div className="dow-bar dow-bar--rev" style={{height:`${Math.max(revPct,4)}%`,background:isTop?"linear-gradient(180deg,#3B82F6,#1D4ED8)":"rgba(59,130,246,0.35)"}}/>
                        </div>
                        <div className="dow-bar-wrap">
                          <div className="dow-bar dow-bar--ord" style={{height:`${Math.max(ordPct,4)}%`,background:isTop?"linear-gradient(180deg,#10B981,#059669)":"rgba(16,185,129,0.3)"}}/>
                        </div>
                      </div>
                      <span className={`dow-label ${isTop?"dow-label--active":""}`}>{day}</span>
                      {isTop && <span className="dow-peak-badge">Peak</span>}
                    </div>
                  );
                })}
              </div>
              <div className="dow-legend">
                <span className="dow-leg-item"><span style={{background:"#3B82F6"}}/>Revenue</span>
                <span className="dow-leg-item"><span style={{background:"#10B981"}}/>Orders</span>
              </div>
            </div>
          )}

          {isPro ? (
            <LockedSection requiredPlan="Premium">
              <div className="ana-card" style={{minHeight:280}}>
                <div className="ana-card-header"><h3 className="ana-card-title">Revenue by Category</h3></div>
              </div>
            </LockedSection>
          ) : (
            <div className="ana-card">
              <div className="ana-card-header">
                <h3 className="ana-card-title">Revenue by Category</h3>
                <p className="ana-card-sub">Menu category performance</p>
              </div>
              {categories.length === 0 ? <EmptyState label="No menu order data yet" /> : (
                <div className="category-wrap">
                  <div className="donut-wrap">
                    <svg viewBox="0 0 120 120" className="donut-svg">
                      {(() => {
                        let offset = 0;
                        const r = 42, cx = 60, cy = 60, circ = 2 * Math.PI * r;
                        return categories.slice(0,5).map((c, i) => {
                          const pct  = c.revenue / totalCatRev;
                          const dash = pct * circ;
                          const gap  = circ - dash;
                          const el   = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={catColors[i%catColors.length]} strokeWidth="16" strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset} style={{transition:"stroke-dasharray 0.6s ease"}}/>;
                          offset += dash;
                          return el;
                        });
                      })()}
                      <circle cx="60" cy="60" r="30" fill="#111827"/>
                      <text x="60" y="57" textAnchor="middle" fill="#F0F4FF" fontSize="10" fontWeight="800">{categories.length}</text>
                      <text x="60" y="68" textAnchor="middle" fill="#4A5568" fontSize="7">categories</text>
                    </svg>
                  </div>
                  <div className="cat-list">
                    {categories.slice(0,5).map((c, i) => {
                      const pct = Math.round((c.revenue / totalCatRev) * 100);
                      return (
                        <div key={i} className="cat-row">
                          <span className="cat-dot" style={{background:catColors[i%catColors.length]}}/>
                          <span className="cat-name">{c.name}</span>
                          <div className="cat-bar-track"><div className="cat-bar-fill" style={{width:`${pct}%`,background:catColors[i%catColors.length]}}/></div>
                          <span className="cat-pct">{pct}%</span>
                          <span className="cat-rev">₹{c.revenue.toLocaleString("en-IN")}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══ ROW 4: Menu Performance — LOCKED for Pro ══ */}
        {isPro ? (
          <LockedSection requiredPlan="Premium">
            <div className="ana-card ana-card--full" style={{minHeight:200}}>
              <div className="ana-card-header"><h3 className="ana-card-title">Menu Item Performance</h3></div>
            </div>
          </LockedSection>
        ) : (
          <div className="ana-card ana-card--full">
            <div className="ana-card-header">
              <div>
                <h3 className="ana-card-title">Menu Item Performance</h3>
                <p className="ana-card-sub">Top selling dishes by revenue and quantity</p>
              </div>
              <span className="ana-card-badge">Top {menuPerf.length} items</span>
            </div>
            {menuPerf.length === 0 ? <EmptyState label="Menu order data will appear here once orders have items" /> : (
              <div className="menu-table">
                <div className="mt-head">
                  <span className="mt-h">#</span>
                  <span className="mt-h mt-h--name">Item Name</span>
                  <span className="mt-h">Category</span>
                  <span className="mt-h mt-h--center">Qty Sold</span>
                  <span className="mt-h mt-h--bar">Revenue Share</span>
                  <span className="mt-h mt-h--right">Total Revenue</span>
                </div>
                {menuPerf.map((item, i) => {
                  const barPct = (item.revenue / maxMenuRev) * 100;
                  const colors = ["#F59E0B","#3B82F6","#10B981","#8B5CF6","#EC4899","#06B6D4","#F97316","#84CC16"];
                  const col    = colors[i % colors.length];
                  return (
                    <div key={i} className={`mt-row ${i === 0 ? "mt-row--top" : ""}`}>
                      <span className="mt-rank">
                        {i < 3
                          ? <span className="mt-medal" style={{color:["#F59E0B","#8896B3","#CD7C3A"][i],background:`${["#F59E0B","#8896B3","#CD7C3A"][i]}12`}}>{i+1}</span>
                          : <span className="mt-num">{i+1}</span>}
                      </span>
                      <span className="mt-name"><span className="mt-dot" style={{background:col}}/>{item.name}</span>
                      <span className="mt-cat"><span className="mt-cat-tag">{item.category}</span></span>
                      <span className="mt-qty mt-center">{item.qty}</span>
                      <span className="mt-bar-cell">
                        <div className="mt-bar-track"><div className="mt-bar-fill" style={{width:`${barPct}%`,background:`linear-gradient(90deg,${col},${col}88)`}}/></div>
                        <span className="mt-bar-pct">{Math.round(barPct)}%</span>
                      </span>
                      <span className="mt-rev">₹{item.revenue.toLocaleString("en-IN")}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ Pro upgrade banner ══ */}
        {isPro && <ProUpgradeBanner />}

      </div>
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="ana-empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" width="36" height="36" style={{color:"#1C2A42"}}>
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>
      <p>{label}</p>
    </div>
  );
}