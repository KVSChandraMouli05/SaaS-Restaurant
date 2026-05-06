import { useState, useEffect, useRef } from "react";
import "./Settings.css";

const API = "https://backend-1wnt.onrender.com";

/* ── helper ── */
const token = () => localStorage.getItem("token");
const authH  = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

/* ── decode JWT for user id / name ── */
function decodeToken() {
  try {
    const payload = JSON.parse(atob(token().split(".")[1]));
    return payload;
  } catch { return {}; }
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [user,      setUser]      = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/auth/me`, { headers: authH() });
      const data = await res.json();
      if (data.status === "success") setUser(data.data);
      else {
        // fallback: decode from JWT
        const p = decodeToken();
        setUser({ id: p.id, name: p.name || "", email: p.email || "", role: p.role || "user" });
      }
    } catch {
      const p = decodeToken();
      setUser({ id: p.id, name: "", email: "", role: "user" });
    }
    setLoading(false);
  };

  const tabs = [
    { id: "profile",  label: "Profile",        icon: IconUser },
    { id: "security", label: "Security",        icon: IconLock },
    { id: "notif",    label: "Notifications",   icon: IconBell },
    { id: "danger",   label: "Danger Zone",     icon: IconAlert, danger: true },
  ];

  if (loading) return (
    <div className="set-loading">
      <div className="set-spinner" />
    </div>
  );

  return (
    <div className="set-page">
      {/* ── Page header ── */}
      <div className="set-header">
        <div>
          <h1 className="set-title">Settings</h1>
          <p className="set-subtitle">Manage your account, security and preferences</p>
        </div>
        <div className="set-header-avatar">
          <span>{(user?.name?.[0] || "U").toUpperCase()}</span>
        </div>
      </div>

      <div className="set-layout">
        {/* ── Left tab nav ── */}
        <nav className="set-nav">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`set-nav-item ${activeTab === t.id ? "active" : ""} ${t.danger ? "danger" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <t.icon />
              <span>{t.label}</span>
              {activeTab === t.id && <div className="set-nav-dot" />}
            </button>
          ))}
        </nav>

        {/* ── Right panel ── */}
        <div className="set-panel">
          {activeTab === "profile"  && <ProfileSection  user={user} onUpdate={setUser} />}
          {activeTab === "security" && <SecuritySection />}
          {activeTab === "notif"    && <NotifSection />}
          {activeTab === "danger"   && <DangerSection   user={user} />}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PROFILE SECTION
══════════════════════════════════════════ */
function ProfileSection({ user, onUpdate }) {
  const [name,    setName]    = useState(user?.name  || "");
  const [email,   setEmail]   = useState(user?.email || "");
  const [phone,   setPhone]   = useState(user?.phone || "");
  const [bio,     setBio]     = useState(user?.bio   || "");
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!name.trim()) { showToast("Name cannot be empty", "error"); return; }
    setSaving(true);
    try {
      const res  = await fetch(`${API}/api/auth/profile`, {
        method: "PUT",
        headers: authH(),
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone, bio }),
      });
      const data = await res.json();
      if (data.status === "success") {
        onUpdate(prev => ({ ...prev, name, email, phone, bio }));
        showToast("Profile updated successfully");
      } else {
        showToast(data.message || "Update failed", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    }
    setSaving(false);
  };

  return (
    <div className="set-section">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Avatar block */}
      <div className="set-avatar-block">
        <div className="set-avatar-circle">
          <span>{(name[0] || "U").toUpperCase()}</span>
        </div>
        <div>
          <p className="set-avatar-name">{name || "Your Name"}</p>
          <p className="set-avatar-role">{user?.role === "admin" ? "Administrator" : "Restaurant Owner"}</p>
          <p className="set-avatar-since">Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-IN", { year:"numeric", month:"long" }) : "—"}</p>
        </div>
      </div>

      <div className="set-divider" />

      <div className="set-section-title">
        <IconUser />
        Personal Information
      </div>

      <div className="set-form-grid">
        <Field label="Full Name" icon={<IconUser />} required>
          <input
            className="set-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your full name"
          />
        </Field>

        <Field label="Email Address" icon={<IconMail />} required>
          <input
            className="set-input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Phone Number" icon={<IconPhone />}>
          <input
            className="set-input"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
          />
        </Field>

        <Field label="Role" icon={<IconShield />}>
          <div className="set-input set-input-readonly">
            {user?.role === "admin" ? "Administrator" : "Restaurant Owner"}
          </div>
        </Field>
      </div>

      <Field label="Bio / About" icon={<IconEdit />} full>
        <textarea
          className="set-input set-textarea"
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="A short bio about you or your business…"
          rows={3}
        />
      </Field>

      <div className="set-form-actions">
        <button className="set-btn-secondary" onClick={() => {
          setName(user?.name || ""); setEmail(user?.email || "");
          setPhone(user?.phone || ""); setBio(user?.bio || "");
        }}>
          Discard Changes
        </button>
        <button className="set-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <><div className="set-btn-spin" />Saving…</> : <><IconCheck />Save Changes</>}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   SECURITY SECTION
══════════════════════════════════════════ */
function SecuritySection() {
  const [cur,     setCur]     = useState("");
  const [nw,      setNw]      = useState("");
  const [conf,    setConf]    = useState("");
  const [show,    setShow]    = useState({ cur:false, nw:false, conf:false });
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  const strength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const strLabel = ["", "Weak", "Fair", "Good", "Strong"];
  const strColor = ["", "#EF4444", "#F59E0B", "#3B82F6", "#10B981"];
  const s = strength(nw);

  const handleChange = async () => {
    if (!cur)             { showToast("Enter current password", "error"); return; }
    if (nw.length < 8)    { showToast("New password must be 8+ characters", "error"); return; }
    if (nw !== conf)       { showToast("Passwords do not match", "error"); return; }
    setSaving(true);
    try {
      const res  = await fetch(`${API}/api/auth/change-password`, {
        method: "PUT", headers: authH(),
        body: JSON.stringify({ currentPassword: cur, newPassword: nw }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast("Password changed successfully");
        setCur(""); setNw(""); setConf("");
      } else {
        showToast(data.message || "Failed to change password", "error");
      }
    } catch { showToast("Network error", "error"); }
    setSaving(false);
  };

  return (
    <div className="set-section">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="set-section-title"><IconLock />Change Password</div>
      <p className="set-section-desc">Use a strong password with at least 8 characters, including uppercase letters, numbers, and symbols.</p>

      <div className="set-form-col">
        <Field label="Current Password" icon={<IconLock />} full>
          <div className="set-input-eye">
            <input
              className="set-input"
              type={show.cur ? "text" : "password"}
              value={cur}
              onChange={e => setCur(e.target.value)}
              placeholder="Enter current password"
            />
            <button onClick={() => setShow(s=>({...s,cur:!s.cur}))} className="set-eye">{show.cur ? <IconEyeOff/> : <IconEye/>}</button>
          </div>
        </Field>

        <Field label="New Password" icon={<IconLock />} full>
          <div className="set-input-eye">
            <input
              className="set-input"
              type={show.nw ? "text" : "password"}
              value={nw}
              onChange={e => setNw(e.target.value)}
              placeholder="Enter new password"
            />
            <button onClick={() => setShow(s=>({...s,nw:!s.nw}))} className="set-eye">{show.nw ? <IconEyeOff/> : <IconEye/>}</button>
          </div>
          {nw && (
            <div className="set-strength">
              <div className="set-strength-bars">
                {[1,2,3,4].map(i=>(
                  <div key={i} className="set-strength-bar" style={{ background: i<=s ? strColor[s] : "#1E2A3A" }}/>
                ))}
              </div>
              <span style={{ color: strColor[s], fontSize:11 }}>{strLabel[s]}</span>
            </div>
          )}
        </Field>

        <Field label="Confirm New Password" icon={<IconLock />} full>
          <div className="set-input-eye">
            <input
              className="set-input"
              type={show.conf ? "text" : "password"}
              value={conf}
              onChange={e => setConf(e.target.value)}
              placeholder="Re-enter new password"
            />
            <button onClick={() => setShow(s=>({...s,conf:!s.conf}))} className="set-eye">{show.conf ? <IconEyeOff/> : <IconEye/>}</button>
          </div>
          {conf && nw && (
            <p className="set-match" style={{ color: conf===nw ? "#10B981" : "#EF4444" }}>
              {conf===nw ? "✓ Passwords match" : "✗ Passwords do not match"}
            </p>
          )}
        </Field>
      </div>

      <div className="set-form-actions">
        <button className="set-btn-primary" onClick={handleChange} disabled={saving}>
          {saving ? <><div className="set-btn-spin"/>Changing…</> : <><IconLock />Update Password</>}
        </button>
      </div>

      {/* Session info card */}
      <div className="set-divider" style={{marginTop:32}}/>
      <div className="set-section-title"><IconShield />Active Session</div>
      <div className="set-session-card">
        <div className="set-session-icon"><IconShield /></div>
        <div>
          <p className="set-session-device">Current Browser Session</p>
          <p className="set-session-meta">Logged in · This device · MouliServe Dashboard</p>
        </div>
        <span className="set-session-badge">Active</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   NOTIFICATIONS SECTION
══════════════════════════════════════════ */
function NotifSection() {
  const [prefs, setPrefs] = useState({
    newOrders:     true,
    orderStatus:   true,
    dailySummary:  false,
    weeklySummary: true,
    lowStock:      false,
    newReviews:    true,
    systemAlerts:  true,
    marketing:     false,
  });
  const [saved, setSaved] = useState(false);

  const toggle = key => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const groups = [
    {
      title: "Order Alerts",
      icon: <IconBell />,
      items: [
        { key:"newOrders",   label:"New order received",          desc:"Notify when a customer places a new order" },
        { key:"orderStatus", label:"Order status updates",        desc:"When an order is confirmed, prepared or delivered" },
      ]
    },
    {
      title: "Reports & Summaries",
      icon: <IconChart />,
      items: [
        { key:"dailySummary",  label:"Daily summary email",   desc:"End-of-day report with total orders and revenue" },
        { key:"weeklySummary", label:"Weekly performance",    desc:"Weekly digest with trends and analytics" },
      ]
    },
    {
      title: "Business Alerts",
      icon: <IconShield />,
      items: [
        { key:"lowStock",   label:"Low stock warning",  desc:"When menu items need to be restocked" },
        { key:"newReviews", label:"New customer review", desc:"When customers leave feedback on your restaurant" },
      ]
    },
    {
      title: "System",
      icon: <IconAlert />,
      items: [
        { key:"systemAlerts", label:"System & security alerts", desc:"Important account and security notifications" },
        { key:"marketing",    label:"Tips & product updates",   desc:"Helpful tips, new features and promotions from MouliServe" },
      ]
    },
  ];

  return (
    <div className="set-section">
      {saved && <Toast msg="Notification preferences saved" type="success" />}

      {groups.map(g => (
        <div key={g.title} className="set-notif-group">
          <div className="set-section-title">{g.icon}{g.title}</div>
          {g.items.map(item => (
            <div key={item.key} className="set-notif-row">
              <div className="set-notif-info">
                <p className="set-notif-label">{item.label}</p>
                <p className="set-notif-desc">{item.desc}</p>
              </div>
              <Toggle on={prefs[item.key]} onToggle={() => toggle(item.key)} />
            </div>
          ))}
        </div>
      ))}

      <div className="set-form-actions">
        <button className="set-btn-primary" onClick={() => { setSaved(true); setTimeout(()=>setSaved(false),3000); }}>
          <IconCheck />Save Preferences
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   DANGER ZONE SECTION
══════════════════════════════════════════ */
function DangerSection({ user }) {
  const [confirmText, setConfirmText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogoutAll = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const dangerItems = [
    {
      icon: <IconLogout />,
      title:  "Sign Out Everywhere",
      desc:   "Immediately invalidate all active sessions on all devices.",
      action: "Sign Out All",
      color:  "#F59E0B",
      bg:     "rgba(245,158,11,.08)",
      border: "rgba(245,158,11,.2)",
      onClick: handleLogoutAll,
      confirm: false,
    },
    {
      icon: <IconTrash />,
      title:  "Delete Account",
      desc:   "Permanently delete your account and all associated data. This action cannot be undone.",
      action: "Delete Account",
      color:  "#EF4444",
      bg:     "rgba(239,68,68,.08)",
      border: "rgba(239,68,68,.2)",
      onClick: () => setShowConfirm(true),
      confirm: true,
    },
  ];

  return (
    <div className="set-section">
      <div className="set-danger-warn">
        <IconAlert />
        <div>
          <p className="set-danger-warn-title">Proceed with caution</p>
          <p className="set-danger-warn-desc">Actions in this section are irreversible or have significant impact on your account.</p>
        </div>
      </div>

      {dangerItems.map(item => (
        <div key={item.title} className="set-danger-card" style={{ borderColor: item.border, background: item.bg }}>
          <div className="set-danger-icon" style={{ color: item.color, background: `rgba(${item.color === "#EF4444" ? "239,68,68" : "245,158,11"},.12)` }}>
            {item.icon}
          </div>
          <div className="set-danger-body">
            <p className="set-danger-title" style={{ color: item.color }}>{item.title}</p>
            <p className="set-danger-desc">{item.desc}</p>
          </div>
          <button
            className="set-danger-btn"
            style={{ borderColor: item.border, color: item.color }}
            onClick={item.onClick}
          >
            {item.action}
          </button>
        </div>
      ))}

      {/* Delete confirm modal */}
      {showConfirm && (
        <div className="set-modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="set-modal" onClick={e => e.stopPropagation()}>
            <div className="set-modal-icon"><IconTrash /></div>
            <h3>Delete your account?</h3>
            <p>This will permanently delete all your restaurants, orders, and data. Type <strong>{user?.email || "your email"}</strong> to confirm.</p>
            <input
              className="set-input"
              placeholder={user?.email || "your email"}
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
            />
            <div className="set-modal-actions">
              <button className="set-btn-secondary" onClick={() => { setShowConfirm(false); setConfirmText(""); }}>
                Cancel
              </button>
              <button
                className="set-btn-danger"
                disabled={confirmText !== (user?.email || "")}
                onClick={() => alert("Account deletion would happen here. Connect to backend delete endpoint.")}
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   SHARED COMPONENTS
══════════════════════════════════════════ */
function Field({ label, icon, children, required, full }) {
  return (
    <div className={`set-field ${full ? "set-field-full" : ""}`}>
      <label className="set-label">
        {icon && <span className="set-label-icon">{icon}</span>}
        {label}
        {required && <span className="set-required">*</span>}
      </label>
      {children}
    </div>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <button
      className={`set-toggle ${on ? "on" : ""}`}
      onClick={onToggle}
      aria-label="toggle"
    >
      <span className="set-toggle-thumb" />
    </button>
  );
}

function Toast({ msg, type }) {
  return (
    <div className={`set-toast set-toast-${type}`}>
      {type === "success" ? <IconCheck /> : <IconAlert />}
      {msg}
    </div>
  );
}

/* ── SVG Icons ── */
const IconUser   = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="14" height="14"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round"/></svg>;
const IconLock   = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="14" height="14"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V5a3 3 0 016 0v2" strokeLinecap="round"/></svg>;
const IconBell   = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="14" height="14"><path d="M8 2a5 5 0 00-5 5v3l-1 2h12l-1-2V7a5 5 0 00-5-5z"/><path d="M6.5 13a1.5 1.5 0 003 0" strokeLinecap="round"/></svg>;
const IconAlert  = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="14" height="14"><path d="M8 2L1 13h14L8 2z" strokeLinejoin="round"/><path d="M8 7v3M8 11.5v.5" strokeLinecap="round"/></svg>;
const IconMail   = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><rect x="1" y="3" width="14" height="10" rx="1.5"/><path d="M1 4l7 5 7-5" strokeLinecap="round"/></svg>;
const IconPhone  = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M3 2h3l1.5 3.5-2 1.2A9 9 0 009.3 10.5l1.2-2L14 10v3a1 1 0 01-1 1A12 12 0 012 3a1 1 0 011-1z" strokeLinejoin="round"/></svg>;
const IconShield = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M8 1L2 4v4c0 3.3 2.7 5.8 6 7 3.3-1.2 6-3.7 6-7V4L8 1z" strokeLinejoin="round"/></svg>;
const IconEdit   = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M11 2l3 3-8 8H3v-3l8-8z" strokeLinejoin="round"/></svg>;
const IconCheck  = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M3 8l3.5 3.5 6.5-7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconEye    = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>;
const IconEyeOff = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M13.3 6.3C12.1 7.6 10.2 9 8 9s-4.1-1.4-5.3-2.7M1 1l14 14M6.4 6.4A2 2 0 0010 9.6" strokeLinecap="round"/></svg>;
const IconLogout = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconTrash  = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M2 4h12M5 4V3h6v1M6 7v5M10 7v5M3 4l1 9h8l1-9" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconChart  = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M2 12l4-4 3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/></svg>;