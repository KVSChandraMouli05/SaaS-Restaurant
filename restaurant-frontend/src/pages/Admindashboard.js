import { useEffect, useMemo, useState } from "react";
import "./Admindashboard.css";

const API = "http://localhost:5000";
const ENV_LABEL = "Production";

const fmtNumber = (n) => Number(n || 0).toLocaleString("en-IN");
const fmtMoney = (n) => `₹${fmtNumber(n)}`;
const safePct = (num, den) => (den > 0 ? Math.round((num / den) * 100) : 0);
const toDateInput = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};
const todayInput = () => toDateInput(new Date());
const daysAgoInput = (days) => toDateInput(new Date(Date.now() - days * 86400000));
const normalizePlan = (plan) => {
  const raw = (plan || "").toString().trim();
  if (!raw) return "Unknown";
  const key = raw.toLowerCase();
  if (key === "free") return "Basic";
  if (key === "basic") return "Basic";
  if (key === "pro") return "Pro";
  if (key === "premium") return "Premium";
  if (key === "trial") return "Trial";
  return raw;
};
const planTone = (plan) => {
  const key = (plan || "").toLowerCase();
  if (key === "basic") return "basic";
  if (key === "pro") return "pro";
  if (key === "premium") return "premium";
  if (key === "trial") return "trial";
  return "unknown";
};
const PLAN_ORDER = ["Basic", "Pro", "Premium", "Trial", "Unknown"];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [rangeStart, setRangeStart] = useState(daysAgoInput(29));
  const [rangeEnd, setRangeEnd] = useState(todayInput());
  const [revenueReport, setRevenueReport] = useState({
    range: { start: "", end: "" },
    summary: { total_revenue: 0, total_orders: 0 },
    series: [],
    plan_revenue: [],
  });
  const [planStats, setPlanStats] = useState({
    total_revenue: 0,
    plans: [],
  });
  const [planStatsLoading, setPlanStatsLoading] = useState(false);
  const [planStatsError, setPlanStatsError] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueError, setRevenueError] = useState(null);
  const token = localStorage.getItem("token");

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchAdminStats(), fetchAllUsers(), fetchPlanStats()]);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    fetchRevenueReport();
  }, [rangeStart, rangeEnd]);

  const fetchAdminStats = async () => {
    try {
      const res = await fetch(`${API}/api/admin/platform-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "success") setStats(data.data);
      else if (res.status === 403) window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await fetch(`${API}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "success") {
        const list = Array.isArray(data.data) ? data.data : [];
        const normalized = list.map((u) => ({
          ...u,
          plan: normalizePlan(u.plan || u.plan_name || u.subscription_plan),
        }));
        setUsers(normalized);
      }
    } catch {
      setUsers([]);
    }
  };

  const fetchRevenueReport = async () => {
    if (!rangeStart || !rangeEnd) return;
    setRevenueLoading(true);
    setRevenueError(null);
    try {
      const res = await fetch(
        `${API}/api/admin/revenue-report?start=${rangeStart}&end=${rangeEnd}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok || data?.status !== "success") {
        if (res.status === 403) {
          window.location.href = "/login";
          return;
        }
        setRevenueError(data?.message || "Failed to load revenue data");
        return;
      }
      if (data.status === "success") {
        setRevenueReport({
          range: data.data?.range || { start: rangeStart, end: rangeEnd },
          summary: data.data?.summary || { total_revenue: 0, total_orders: 0 },
          series: Array.isArray(data.data?.series) ? data.data.series : [],
          plan_revenue: Array.isArray(data.data?.plan_revenue)
            ? data.data.plan_revenue
            : [],
        });
      }
    } catch {
      setRevenueError("Failed to load revenue data");
    } finally {
      setRevenueLoading(false);
    }
  };

  const fetchPlanStats = async () => {
    setPlanStatsLoading(true);
    setPlanStatsError(null);
    try {
      const res = await fetch(`${API}/api/admin/plan-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok || data?.status !== "success") {
        if (res.status === 403) {
          window.location.href = "/login";
          return;
        }
        setPlanStatsError(data?.message || "Failed to load plan stats");
        setPlanStats({ total_revenue: 0, plans: [] });
        return;
      }
      setPlanStats({
        total_revenue: parseFloat(data.data?.total_revenue || 0),
        plans: Array.isArray(data.data?.plans) ? data.data.plans : [],
      });
    } catch {
      setPlanStatsError("Failed to load plan stats");
      setPlanStats({ total_revenue: 0, plans: [] });
    } finally {
      setPlanStatsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const exportUsers = () => {
    if (!users.length) return;
    const headers = ["id", "name", "email", "role", "plan"];
    const rows = users.map((u) => [
      u.id,
      u.name || "",
      u.email || "",
      u.role || "",
      u.plan || "",
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((val) => `"${String(val).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalUsers = stats?.total_users ?? users.length;
  const totalRestaurants = stats?.total_restaurants ?? 0;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const ownerCount = Math.max(0, totalUsers - adminCount);

  const planStatsRows = useMemo(() => {
    const list = Array.isArray(planStats?.plans) ? planStats.plans : [];
    return list.map((row) => {
      const label = normalizePlan(row.plan_name || row.name || row.plan);
      return {
        id: row.id,
        label,
        price: parseFloat(row.price || 0),
        restaurant_limit: row.restaurant_limit,
        features: row.features,
        active_users: parseInt(row.active_users || 0),
        revenue: parseFloat(row.revenue || 0),
        tone: planTone(label),
      };
    });
  }, [planStats]);

  const planStatsOrdered = useMemo(() => {
    const orderMap = PLAN_ORDER.reduce((acc, label, idx) => {
      acc[label.toLowerCase()] = idx;
      return acc;
    }, {});
    return [...planStatsRows].sort((a, b) => {
      const aIdx = orderMap[a.label.toLowerCase()];
      const bIdx = orderMap[b.label.toLowerCase()];
      if (aIdx !== undefined && bIdx !== undefined) return aIdx - bIdx;
      if (aIdx !== undefined) return -1;
      if (bIdx !== undefined) return 1;
      return a.label.localeCompare(b.label);
    });
  }, [planStatsRows]);

  const planRevenue = useMemo(() => {
    return planStatsOrdered.map((row) => ({
      label: row.label,
      revenue: row.revenue,
      users: row.active_users,
      tone: row.tone,
    }));
  }, [planStatsOrdered]);

  const planRevenueTotal = planRevenue.reduce((sum, p) => sum + p.revenue, 0);
  const subscriptionRevenue = planStats?.total_revenue ?? planRevenueTotal;
  const restaurantsPerOwner = ownerCount > 0 ? totalRestaurants / ownerCount : 0;
  const revenuePerRestaurant =
    totalRestaurants > 0 ? subscriptionRevenue / totalRestaurants : 0;
  const revenuePerOwner =
    ownerCount > 0 ? subscriptionRevenue / ownerCount : 0;

  const roleMix = useMemo(() => {
    const ownerPct = safePct(ownerCount, totalUsers);
    const adminPct = safePct(adminCount, totalUsers);
    return [
      { label: "Owners", count: ownerCount, pct: ownerPct, tone: "owner" },
      { label: "Admins", count: adminCount, pct: adminPct, tone: "admin" },
    ];
  }, [ownerCount, adminCount, totalUsers]);

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      search === "" ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole =
      roleFilter === "all" ||
      (roleFilter === "owner" && u.role !== "admin") ||
      (roleFilter === "admin" && u.role === "admin");
    const planName = normalizePlan(u.plan || u.plan_name || u.subscription_plan);
    const matchPlan =
      planFilter === "all" || planName.toLowerCase() === planFilter;
    return matchSearch && matchRole && matchPlan;
  });

  const recentUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => (b.id || 0) - (a.id || 0))
      .slice(0, 6);
  }, [users]);

  const kpis = [
    {
      label: "Total Users",
      value: fmtNumber(totalUsers),
      note: "All tenant accounts",
      tone: "blue",
    },
    {
      label: "Owners",
      value: fmtNumber(ownerCount),
      note: "Active operators",
      tone: "teal",
    },
    {
      label: "Subscription Revenue",
      value: fmtMoney(subscriptionRevenue),
      note: "Active plans",
      tone: "green",
    },
    {
      label: "Range Revenue",
      value: fmtMoney(revenueReport.summary?.total_revenue || 0),
      note: "Selected dates",
      tone: "purple",
    },
    {
      label: "Restaurants",
      value: fmtNumber(totalRestaurants),
      note: "Total locations",
      tone: "amber",
    },
    {
      label: "Revenue per Restaurant",
      value: fmtMoney(revenuePerRestaurant),
      note: "Average across network",
      tone: "teal",
    },
  ];

  const planCounts = useMemo(() => {
    return planRevenue.map((p) => ({
      label: p.label,
      count: p.users,
      tone: p.tone,
    }));
  }, [planRevenue]);

  const planRevenueMax = Math.max(
    ...planRevenue.map((p) => p.revenue),
    1
  );

  const seriesData = (revenueReport.series || []).map((row) => ({
    date: row.date,
    revenue: parseFloat(row.revenue || 0),
  }));
  const seriesMax = Math.max(...seriesData.map((s) => s.revenue), 1);
  const rangeDays = (() => {
    if (!rangeStart || !rangeEnd) return 0;
    const start = new Date(rangeStart);
    const end = new Date(rangeEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    return Math.max(1, Math.round((end - start) / 86400000) + 1);
  })();
  const avgDailyRevenue =
    rangeDays > 0 ? (revenueReport.summary?.total_revenue || 0) / rangeDays : 0;
  const chartLabels = seriesData.filter((_, i) => {
    const step = Math.max(1, Math.floor(seriesData.length / 6));
    return i % step === 0;
  });

  const health = [
    {
      label: "API",
      status: stats ? "Operational" : "Degraded",
      detail: stats ? "Stats endpoint OK" : "Stats unavailable",
      tone: stats ? "ok" : "warn",
    },
    {
      label: "Database",
      status: stats ? "Operational" : "Unknown",
      detail: stats ? "Queries responding" : "No signal",
      tone: stats ? "ok" : "muted",
    },
    {
      label: "Billing",
      status: "Not integrated",
      detail: "Manual upgrades",
      tone: "muted",
    },
    {
      label: "Notifications",
      status: "Not configured",
      detail: "Email/SMS pending",
      tone: "muted",
    },
  ];

  if (loading) {
    return (
      <div className="adm-page">
        <div className="adm-center">
          <div className="adm-spinner" />
          <p>Loading admin console...</p>
        </div>
      </div>
    );
  }

  if (!stats && users.length === 0) {
    return (
      <div className="adm-page">
        <div className="adm-center">
          <p className="adm-error-title">Access denied</p>
          <p className="adm-error-sub">Admin privileges required.</p>
          <button className="adm-btn adm-btn--primary" onClick={handleLogout}>
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-page">
      {showLogout && (
        <div className="adm-overlay" onClick={() => setShowLogout(false)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-icon" />
            <h3>Sign out of Admin Console?</h3>
            <p>You will be redirected to the login page.</p>
            <div className="adm-modal-actions">
              <button
                className="adm-btn adm-btn--ghost"
                onClick={() => setShowLogout(false)}
              >
                Cancel
              </button>
              <button className="adm-btn adm-btn--danger" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="adm-shell">
        <header className="adm-topbar">
          <div className="adm-brand">
            <div className="adm-brand-mark">MS</div>
            <div>
              <div className="adm-brand-kicker">Admin Command Center</div>
              <h1 className="adm-brand-title">Restaurant SaaS Control Tower</h1>
              <p className="adm-brand-sub">
                Monitor tenants, revenue, and operational health from one place.
              </p>
            </div>
          </div>
          <div className="adm-top-actions">
            <div className="adm-meta">
              <span className="adm-meta-chip">Environment: {ENV_LABEL}</span>
              <span className="adm-meta-chip">
                Last updated:{" "}
                {lastUpdated
                  ? lastUpdated.toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Unknown"}
              </span>
            </div>
            <div className="adm-action-row">
              <button
                className="adm-btn adm-btn--ghost"
                onClick={() => {
                  loadAll();
                  fetchRevenueReport();
                }}
              >
                Refresh
              </button>
              <button
                className="adm-btn adm-btn--ghost"
                onClick={exportUsers}
                disabled={!users.length}
              >
                Export Users
              </button>
              <button
                className="adm-btn adm-btn--danger"
                onClick={() => setShowLogout(true)}
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <section className="adm-kpi-grid">
          {kpis.map((k) => (
            <div key={k.label} className={`adm-kpi-card tone-${k.tone}`}>
              <div className="adm-kpi-label">{k.label}</div>
              <div className="adm-kpi-value">{k.value}</div>
              <div className="adm-kpi-note">{k.note}</div>
            </div>
          ))}
        </section>

        <section className="adm-row adm-row--wide">
          <div className="adm-card">
            <div className="adm-card-header">
              <div>
                <h3 className="adm-card-title">Revenue Timeline</h3>
                <p className="adm-card-sub">
                  Completed orders by day - {rangeStart} to {rangeEnd}
                </p>
              </div>
              <div className="adm-range">
                <label className="adm-range-field">
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
                <label className="adm-range-field">
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
            </div>

            <div className="adm-rev-summary">
              <div className="adm-rev-stat">
                <span>Range Revenue</span>
                <strong>{fmtMoney(revenueReport.summary?.total_revenue || 0)}</strong>
              </div>
              <div className="adm-rev-stat">
                <span>Avg per day</span>
                <strong>{fmtMoney(avgDailyRevenue)}</strong>
              </div>
              <div className="adm-rev-stat">
                <span>Completed orders</span>
                <strong>{fmtNumber(revenueReport.summary?.total_orders || 0)}</strong>
              </div>
            </div>

            {revenueLoading ? (
              <div className="adm-chart-empty">Loading revenue...</div>
            ) : revenueError ? (
              <div className="adm-chart-empty adm-chart-empty--error">
                {revenueError}
              </div>
            ) : seriesData.length === 0 ? (
              <div className="adm-chart-empty">No revenue in this range</div>
            ) : (
              <div className="adm-chart">
                <svg viewBox="0 0 600 180" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="adm-rev-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const h = 170;
                    const top = 10;
                    const bottom = 20;
                    const inner = h - top - bottom;
                    const pts = seriesData
                      .map((p, i) => {
                        const x =
                          (i / (seriesData.length - 1 || 1)) * 600;
                        const y = h - bottom - (p.revenue / seriesMax) * inner;
                        return `${x},${y}`;
                      })
                      .join(" ");
                    const fill = `0,${h - bottom} ${pts} 600,${h - bottom}`;
                    return (
                      <>
                        <polygon
                          points={fill}
                          fill="url(#adm-rev-fill)"
                          className="adm-chart-area"
                        />
                        <polyline
                          points={pts}
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="adm-chart-line"
                        />
                      </>
                    );
                  })()}
                </svg>
                <div className="adm-chart-labels">
                  {chartLabels.map((item) => (
                    <span key={item.date}>
                      {new Date(item.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="adm-card">
            <div className="adm-card-header">
              <div>
                <h3 className="adm-card-title">Subscription Revenue</h3>
                <p className="adm-card-sub">Active subscriptions by plan</p>
              </div>
              <span className="adm-card-badge">
                {fmtMoney(subscriptionRevenue)} total
              </span>
            </div>

            {planStatsLoading ? (
              <div className="adm-plan-note">Loading plan stats...</div>
            ) : planStatsError ? (
              <div className="adm-plan-note adm-plan-note--error">
                {planStatsError}
              </div>
            ) : planRevenue.length === 0 ? (
              <div className="adm-plan-note">No plans found.</div>
            ) : null}
            <div className="adm-plan-bars">
              {planRevenue.map((p) => (
                <div key={p.label} className="adm-plan-row">
                  <div className="adm-plan-meta">
                    <span className={`adm-plan-pill plan-${p.tone}`}>
                      {p.label}
                    </span>
                    <span className="adm-plan-orders">
                      {fmtNumber(p.users)} active users
                    </span>
                  </div>
                  <div className="adm-plan-bar">
                    <div
                      className={`adm-plan-fill plan-${p.tone}`}
                      style={{
                        width: `${(p.revenue / planRevenueMax) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="adm-plan-value">{fmtMoney(p.revenue)}</div>
                </div>
              ))}
            </div>

            <div className="adm-plan-counts">
              {planCounts.map((p) => (
                <div key={p.label} className="adm-plan-count">
                  <span className={`adm-plan-pill plan-${p.tone}`}>
                    {p.label}
                  </span>
                  <strong>{fmtNumber(p.count)}</strong>
                  <span>active</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="adm-card adm-card--full">
          <div className="adm-card-header">
            <div>
              <h3 className="adm-card-title">Subscription Plans</h3>
              <p className="adm-card-sub">
                Current plans, limits, and active subscribers
              </p>
            </div>
            <span className="adm-card-badge">
              {fmtMoney(subscriptionRevenue)} revenue
            </span>
          </div>

          {planStatsLoading ? (
            <div className="adm-plan-note">Loading plan stats...</div>
          ) : planStatsError ? (
            <div className="adm-plan-note adm-plan-note--error">
              {planStatsError}
            </div>
          ) : planStatsOrdered.length === 0 ? (
            <div className="adm-plan-note">No plans found.</div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table adm-plan-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Plan</th>
                    <th>Price</th>
                    <th>Restaurant Limit</th>
                    <th>Features</th>
                    <th>Active Users</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {planStatsOrdered.map((plan) => (
                    <tr key={plan.id}>
                      <td className="adm-td--num">{plan.id}</td>
                      <td>
                        <span className={`adm-plan-pill plan-${plan.tone}`}>
                          {plan.label}
                        </span>
                      </td>
                      <td>{fmtMoney(plan.price)}</td>
                      <td>{plan.restaurant_limit ?? "—"}</td>
                      <td className="adm-plan-features">
                        {plan.features || "—"}
                      </td>
                      <td>{fmtNumber(plan.active_users)}</td>
                      <td>{fmtMoney(plan.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="adm-row">
          <div className="adm-card">
            <div className="adm-card-header">
              <div>
                <h3 className="adm-card-title">Role Distribution</h3>
                <p className="adm-card-sub">Admin vs owner mix across tenants</p>
              </div>
              <span className="adm-card-badge">{fmtNumber(totalUsers)} users</span>
            </div>
            <div className="adm-role-bar">
              {roleMix.map((r) => (
                <span
                  key={r.label}
                  className={`adm-role-seg seg-${r.tone}`}
                  style={{ width: `${r.pct}%` }}
                  title={`${r.label}: ${r.count} users (${r.pct}%)`}
                />
              ))}
            </div>
            <div className="adm-role-legend">
              {roleMix.map((r) => (
                <div key={r.label} className={`adm-role-item ${r.tone}`}>
                  <span className="adm-role-dot" />
                  <span>{r.label}</span>
                  <strong>{fmtNumber(r.count)}</strong>
                  <em>{r.pct}%</em>
                </div>
              ))}
            </div>
            <div className="adm-mini-grid">
              <div>
                <span>Avg restaurants per owner</span>
                <strong>{restaurantsPerOwner.toFixed(2)}</strong>
              </div>
              <div>
                <span>Revenue per owner</span>
                <strong>{fmtMoney(revenuePerOwner)}</strong>
              </div>
            </div>
          </div>

          <div className="adm-card">
            <div className="adm-card-header">
              <div>
                <h3 className="adm-card-title">Platform Health</h3>
                <p className="adm-card-sub">Service checks and configuration</p>
              </div>
            </div>
            <div className="adm-health-list">
              {health.map((h) => (
                <div key={h.label} className={`adm-health-item ${h.tone}`}>
                  <div className="adm-health-left">
                    <span className="adm-health-label">{h.label}</span>
                    <span className="adm-health-detail">{h.detail}</span>
                  </div>
                  <span className="adm-health-status">{h.status}</span>
                </div>
              ))}
            </div>
            <div className="adm-action-card">
              <h4>Action Center</h4>
              <button className="adm-action-btn" disabled>
                Invite Admin (soon)
              </button>
              <button className="adm-action-btn" disabled>
                View Audit Logs (soon)
              </button>
              <button className="adm-action-btn" disabled>
                Configure Billing (soon)
              </button>
            </div>
          </div>
        </section>

        <section className="adm-card adm-card--full">
          <div className="adm-card-header">
            <div>
              <h3 className="adm-card-title">User Directory</h3>
              <p className="adm-card-sub">
                Search, filter, and review tenant accounts.
              </p>
            </div>
            <div className="adm-table-controls">
              <div className="adm-search">
                <input
                  className="adm-search-input"
                  placeholder="Search name or email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="adm-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All roles</option>
                <option value="owner">Owners</option>
                <option value="admin">Admins</option>
              </select>
              <select
                className="adm-select"
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
              >
                <option value="all">All plans</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
                <option value="trial">Trial</option>
              </select>
            </div>
          </div>

          <div className="adm-directory">
            <div className="adm-directory-main">
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Plan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="adm-empty-row">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user, i) => (
                        <tr key={user.id}>
                          <td className="adm-td--num">{i + 1}</td>
                          <td className="adm-td--name">
                            <span className="adm-user-avatar">
                              {(user.name || "?")[0].toUpperCase()}
                            </span>
                            {user.name || "Unknown"}
                          </td>
                          <td className="adm-td--email">{user.email || "Unknown"}</td>
                          <td>
                            <span
                              className={`adm-role-pill ${
                                user.role === "admin" ? "admin" : "owner"
                              }`}
                            >
                              {user.role === "admin" ? "Admin" : "Owner"}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`adm-plan-pill plan-${planTone(
                                user.plan
                              )}`}
                            >
                              {normalizePlan(user.plan)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <aside className="adm-directory-side">
              <div className="adm-side-header">
                <h4>Newest Users</h4>
                <span>By ID</span>
              </div>
              {recentUsers.length === 0 ? (
                <p className="adm-side-empty">No recent users</p>
              ) : (
                recentUsers.map((u) => (
                  <div key={u.id} className="adm-side-row">
                    <div className="adm-side-avatar">
                      {(u.name || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="adm-side-name">{u.name || "Unknown"}</div>
                      <div className="adm-side-email">{u.email || "Unknown"}</div>
                    </div>
                    <span
                      className={`adm-role-pill ${
                        u.role === "admin" ? "admin" : "owner"
                      }`}
                    >
                      {u.role === "admin" ? "Admin" : "Owner"}
                    </span>
                  </div>
                ))
              )}
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
}
