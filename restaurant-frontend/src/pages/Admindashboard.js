import { useEffect, useState } from "react";
import "./Admindashboard.css";

const PLAN_COLORS = {
  Trial:      "#6B7280",
  Basic:      "#10B981",
  Pro:        "#3B82F6",
  Business:   "#F59E0B",
  Premium:    "#8B5CF6",
  Enterprise: "#EC4899",
};

export default function AdminDashboard() {
  const [stats,      setStats]      = useState(null);
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [search,     setSearch]     = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const token    = localStorage.getItem("token");

  useEffect(() => {
    fetchAdminStats();
    fetchAllUsers();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const fetchAdminStats = async () => {
    try {
      const res  = await fetch("http://localhost:5000/api/admin/platform-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "success") setStats(data.data);
      else if (res.status === 403) { window.location.href = "/login"; }
    } catch { window.location.href = "/login"; }
    finally { setLoading(false); }
  };

  const fetchAllUsers = async () => {
    try {
      const res  = await fetch("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "success") setUsers(Array.isArray(data.data) ? data.data : []);
    } catch {}
  };

  // Filtered users
  const filteredUsers = users.filter(u => {
    const matchSearch = search === "" ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === "all" || u.plan_name?.toLowerCase() === planFilter;
    return matchSearch && matchPlan;
  });

  const uniquePlans = [...new Set(users.map(u => u.plan_name).filter(Boolean))];

  if (loading) return (
    <div className="adm-page">
      <div className="adm-center">
        <div className="adm-spinner" />
        <p>Loading admin panel...</p>
      </div>
    </div>
  );

  if (!stats) return (
    <div className="adm-page">
      <div className="adm-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" width="48" height="48">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p style={{color:"#EF4444",fontWeight:700,fontSize:18}}>Access Denied</p>
        <p style={{color:"#4A5568"}}>Admin privileges required</p>
        <button className="adm-btn adm-btn--blue" onClick={() => window.location.href = "/login"}>Go to Dashboard</button>
      </div>
    </div>
  );

  const activeSubs  = (stats.total_users || 0) - (stats.trial_users || 0);
  const totalRev    = parseFloat(stats.total_revenue || 0);
  const maxPlanRev  = stats.revenue_by_plan?.length
    ? Math.max(...stats.revenue_by_plan.map(p => parseFloat(p.revenue || 0)), 1)
    : 1;

  return (
    <div className="adm-page">

      {/* ══ LOGOUT CONFIRM OVERLAY ══ */}
      {showLogout && (
        <div className="adm-overlay" onClick={() => setShowLogout(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="28" height="28">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <h3>Sign out of Admin Panel?</h3>
            <p>You'll be redirected to the login page.</p>
            <div className="adm-modal-actions">
              <button className="adm-btn adm-btn--ghost" onClick={() => setShowLogout(false)}>Cancel</button>
              <button className="adm-btn adm-btn--danger" onClick={handleLogout}>Yes, Sign Out</button>
            </div>
          </div>
        </div>
      )}

      <div className="adm-inner">

        {/* ══ HEADER ══ */}
        <header className="adm-header">
          <div className="adm-header-left">
            <div className="adm-crown-badge">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                <path d="M2 19h20v2H2v-2zM2 5l5 7.5L12 3l5 9.5L22 5v12H2V5z"/>
              </svg>
              Super Admin
            </div>
            <h1 className="adm-title">Admin Dashboard</h1>
            <p className="adm-subtitle">Platform-wide SaaS analytics & user management</p>
          </div>
          <div className="adm-header-right">
            <div className="adm-live-badge">
              <span className="adm-live-dot" />
              Live
            </div>
            <button className="adm-signout-btn" onClick={() => setShowLogout(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
          </div>
        </header>

        {/* ══ KPI CARDS ══ */}
        <div className="adm-kpis">

          <div className="adm-kpi" style={{"--delay":"0s"}}>
            <div className="adm-kpi-icon" style={{color:"#3B82F6",background:"rgba(59,130,246,0.1)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <div>
              <p className="adm-kpi-label">Total Users</p>
              <h3 className="adm-kpi-val">{stats.total_users || 0}</h3>
              <p className="adm-kpi-note"><span style={{color:"#10B981"}}>+{stats.recent_signups || 0}</span> last 30 days</p>
            </div>
          </div>

          <div className="adm-kpi" style={{"--delay":"0.07s"}}>
            <div className="adm-kpi-icon" style={{color:"#10B981",background:"rgba(16,185,129,0.1)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <div>
              <p className="adm-kpi-label">Active Subscriptions</p>
              <h3 className="adm-kpi-val">{activeSubs}</h3>
              <p className="adm-kpi-note"><span style={{color:"#F59E0B"}}>{stats.trial_users || 0}</span> on trial</p>
            </div>
          </div>

          <div className="adm-kpi" style={{"--delay":"0.14s"}}>
            <div className="adm-kpi-icon" style={{color:"#F59E0B",background:"rgba(245,158,11,0.1)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
            </div>
            <div>
              <p className="adm-kpi-label">Total MRR</p>
              <h3 className="adm-kpi-val">₹{totalRev.toLocaleString("en-IN")}</h3>
              <p className="adm-kpi-note">Monthly Recurring Revenue</p>
            </div>
          </div>

          <div className="adm-kpi" style={{"--delay":"0.21s"}}>
            <div className="adm-kpi-icon" style={{color:"#EF4444",background:"rgba(239,68,68,0.1)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <p className="adm-kpi-label">Expired Subscriptions</p>
              <h3 className="adm-kpi-val" style={{color:"#EF4444"}}>{stats.expired_users || 0}</h3>
              <p className="adm-kpi-note">Needs attention</p>
            </div>
          </div>

        </div>

        {/* ══ ROW 2: Plan Breakdown + Revenue by Plan ══ */}
        <div className="adm-row adm-row--half">

          {/* Plan Breakdown */}
          <div className="adm-card">
            <div className="adm-card-header">
              <h3 className="adm-card-title">Subscription Breakdown</h3>
              <span className="adm-card-badge">{stats.total_users || 0} users</span>
            </div>
            {stats.active_by_plan?.length > 0 ? (
              <div className="plan-breakdown">
                {/* Stacked bar */}
                <div className="plan-stack-bar">
                  {stats.active_by_plan.map((plan, i) => {
                    const pct = stats.total_users > 0
                      ? (plan.count / stats.total_users) * 100 : 0;
                    return (
                      <div key={i} className="plan-stack-seg"
                        style={{width:`${pct}%`, background: PLAN_COLORS[plan.plan_name] || "#4A5568"}}
                        title={`${plan.plan_name}: ${plan.count} users (${Math.round(pct)}%)`}
                      />
                    );
                  })}
                </div>
                {/* Legend rows */}
                <div className="plan-rows">
                  {stats.active_by_plan.map((plan, i) => {
                    const pct = stats.total_users > 0
                      ? Math.round((plan.count / stats.total_users) * 100) : 0;
                    const col = PLAN_COLORS[plan.plan_name] || "#4A5568";
                    return (
                      <div key={i} className="plan-row-item">
                        <div className="plan-row-left">
                          <span className="plan-dot" style={{background:col}}/>
                          <span className="plan-row-name">{plan.plan_name}</span>
                        </div>
                        <div className="plan-row-right">
                          <span className="plan-row-count">{plan.count} users</span>
                          <span className="plan-row-pct">{pct}%</span>
                          <span className="plan-row-rev">₹{parseFloat(plan.revenue||0).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : <EmptyState label="No subscription data" />}
          </div>

          {/* Revenue by Plan */}
          <div className="adm-card">
            <div className="adm-card-header">
              <h3 className="adm-card-title">Revenue by Plan</h3>
              <span className="adm-card-badge">₹{totalRev.toLocaleString("en-IN")} total</span>
            </div>
            {stats.revenue_by_plan?.length > 0 ? (
              <div className="rev-bars">
                {stats.revenue_by_plan.map((plan, i) => {
                  const rev  = parseFloat(plan.revenue || 0);
                  const pct  = (rev / maxPlanRev) * 100;
                  const col  = PLAN_COLORS[plan.plan_name] || "#4A5568";
                  const share = totalRev > 0 ? Math.round((rev/totalRev)*100) : 0;
                  return (
                    <div key={i} className="rev-bar-row">
                      <div className="rev-bar-meta">
                        <div className="rev-bar-name">
                          <span className="plan-dot" style={{background:col}}/>
                          {plan.plan_name}
                        </div>
                        <div className="rev-bar-nums">
                          <span className="rev-bar-share">{share}%</span>
                          <span className="rev-bar-val">₹{rev.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                      <div className="rev-bar-track">
                        <div className="rev-bar-fill"
                          style={{width:`${pct}%`, background:`linear-gradient(90deg,${col},${col}99)`}}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <EmptyState label="No revenue data" />}
          </div>

        </div>

        {/* ══ USERS TABLE ══ */}
        <div className="adm-card adm-card--full">
          <div className="adm-card-header">
            <h3 className="adm-card-title">All Users
              <span className="adm-card-badge" style={{marginLeft:10}}>{filteredUsers.length}</span>
            </h3>
            <div className="adm-table-controls">
              {/* Search */}
              <div className="adm-search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  className="adm-search-input"
                  placeholder="Search name or email…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              {/* Plan filter */}
              <select className="adm-select" value={planFilter} onChange={e => setPlanFilter(e.target.value)}>
                <option value="all">All Plans</option>
                {uniquePlans.map(p => (
                  <option key={p} value={p.toLowerCase()}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Expires</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={7} style={{textAlign:"center",padding:"32px",color:"#4A5568"}}>No users found</td></tr>
                ) : filteredUsers.map((user, i) => {
                  const planCol = PLAN_COLORS[user.plan_name] || "#4A5568";
                  const isExpired = user.status?.toLowerCase() === "expired" || user.status?.toLowerCase() === "cancelled";
                  const isActive  = user.status?.toLowerCase() === "active";
                  const isTrial   = user.status?.toLowerCase() === "trial";
                  return (
                    <tr key={user.id} className={i % 2 === 0 ? "adm-tr--even" : ""}>
                      <td className="adm-td--num">{i + 1}</td>
                      <td className="adm-td--name">
                        <div className="adm-user-avatar" style={{background:`${planCol}20`,color:planCol}}>
                          {(user.name || "?")[0].toUpperCase()}
                        </div>
                        {user.name || "—"}
                      </td>
                      <td className="adm-td--email">{user.email}</td>
                      <td>
                        <span className="adm-plan-badge"
                          style={{color:planCol, background:`${planCol}15`, borderColor:`${planCol}30`}}>
                          {user.plan_name || "None"}
                        </span>
                      </td>
                      <td>
                        <span className={`adm-status-badge ${isActive?"adm-status--active":isTrial?"adm-status--trial":isExpired?"adm-status--expired":"adm-status--neutral"}`}>
                          <span className="adm-status-dot"/>
                          {user.status || "Unknown"}
                        </span>
                      </td>
                      <td className="adm-td--date">
                        {user.end_date
                          ? new Date(user.end_date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})
                          : "—"}
                      </td>
                      <td>
                        {user.role === "admin" ? (
                          <span className="adm-role-badge adm-role--admin">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10"><path d="M2 19h20v2H2v-2zM2 5l5 7.5L12 3l5 9.5L22 5v12H2V5z"/></svg>
                            Admin
                          </span>
                        ) : (
                          <span className="adm-role-badge adm-role--owner">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            Owner
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="adm-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" width="32" height="32" style={{color:"#1C2A42"}}>
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>
      <p>{label}</p>
    </div>
  );
}