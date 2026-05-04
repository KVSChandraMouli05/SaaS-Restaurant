import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "./Topbar.css";

const API = "http://localhost:5000";

const Topbar = ({ onToggleSidebar, sidebarOpen = false }) => {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [userRole,     setUserRole]     = useState("user");
  const [userInitials, setUserInitials] = useState("?");
  const [userName,     setUserName]     = useState("");
  const [userEmail,    setUserEmail]    = useState("");
  const [mailOpen,     setMailOpen]     = useState(false);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [avatarOpen,   setAvatarOpen]   = useState(false);

  /* ── THEME ── */
  const [theme, setTheme] = useState(
    () => localStorage.getItem("ms-theme") || "dark"
  );
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ms-theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  /* mock notifications */
  const [notifications, setNotifications] = useState([
    { id:1, icon:"🛒", title:"New order received",    desc:"A new order just came in",        time:"2 min ago",  unread:true  },
    { id:2, icon:"✅", title:"Order #1042 completed", desc:"Payment confirmed successfully",  time:"15 min ago", unread:true  },
    { id:3, icon:"⚠️", title:"Low stock warning",     desc:"Chicken Biryani — only 3 left",  time:"1 hr ago",   unread:false },
    { id:4, icon:"📊", title:"Weekly report ready",   desc:"Your analytics for this week",   time:"Yesterday",  unread:false },
  ]);
  const unreadCount = notifications.filter(n => n.unread).length;

  const mailRef   = useRef(null);
  const notifRef  = useRef(null);
  const avatarRef = useRef(null);

  /* decode JWT */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserRole(payload.role || "user");
      if (payload.name?.trim()) {
        const parts = payload.name.trim().split(" ");
        setUserName(payload.name.trim());
        setUserEmail(payload.email || "");
        setUserInitials(
          parts.length >= 2
            ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase()
            : parts[0].slice(0,2).toUpperCase()
        );
      } else if (payload.email) {
        const eu = payload.email.split("@")[0];
        setUserName(eu); setUserEmail(payload.email);
        setUserInitials(eu.slice(0,2).toUpperCase());
      }
    } catch(e) { console.error(e); }
  }, []);

  /* fetch fresh profile */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API}/api/auth/me`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.status === "success" && d.data) {
          const u = d.data;
          setUserEmail(u.email || "");
          if (u.name?.trim()) {
            const parts = u.name.trim().split(" ");
            setUserName(u.name.trim());
            setUserInitials(
              parts.length >= 2
                ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase()
                : parts[0].slice(0,2).toUpperCase()
            );
          }
        }
      }).catch(() => {});
  }, []);

  /* close on outside click */
  useEffect(() => {
    const handle = (e) => {
      if (mailRef.current   && !mailRef.current.contains(e.target))   setMailOpen(false);
      if (notifRef.current  && !notifRef.current.contains(e.target))  setNotifOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const closeAll = (which) => {
    setMailOpen(  which === "mail"   ? p => !p : false);
    setNotifOpen( which === "notif"  ? p => !p : false);
    setAvatarOpen(which === "avatar" ? p => !p : false);
  };

  const markAllRead = () => setNotifications(n => n.map(x => ({...x, unread:false})));
  const markRead    = id  => setNotifications(n => n.map(x => x.id===id ? {...x,unread:false} : x));
  const handleLogout = () => { localStorage.removeItem("token"); navigate("/login"); };

  return (
    <header className="topbar">

      {/* ── LEFT ── */}
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-toggle"
          onClick={() => onToggleSidebar?.()}
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={sidebarOpen}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
          </svg>
        </button>

        {/* Search + theme toggle */}
        <div className="topbar-search">
          <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
          </svg>
          <input className="search-input" type="text" placeholder="Search…"/>

          {/* ── THEME TOGGLE ── */}
          <button className="tb-theme-btn" onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            {theme === "dark" ? (
              /* Sun */
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" width="14" height="14">
                <circle cx="10" cy="10" r="3.5"/>
                <path d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.1 4.1l1.1 1.1M13.8 13.8l1.1 1.1M4.1 15.9l1.1-1.1M13.8 6.2l1.1-1.1" strokeLinecap="round"/>
              </svg>
            ) : (
              /* Moon */
              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
              </svg>
            )}
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>

          <span className="search-kbd">⌘K</span>
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div className="topbar-right">

        {userRole === "admin" && (
          <div className="topbar-admin-badge">
            <svg viewBox="0 0 20 20" fill="currentColor" width="11" height="11">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            Admin
          </div>
        )}

        {/* Mail */}
        <div className="tb-dropdown-wrap" ref={mailRef}>
          <button className={`topbar-icon-btn ${mailOpen?"tb-btn-active":""}`}
            onClick={() => closeAll("mail")}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
            </svg>
          </button>
          {mailOpen && (
            <div className="tb-dropdown tb-mail-dropdown">
              <div className="tb-dd-arrow"/>
              <div className="tb-dd-header">
                <span className="tb-dd-title">Email Address</span>
              </div>
              <div className="tb-mail-body">
                <div className="tb-mail-avatar">{userInitials}</div>
                <div className="tb-mail-info">
                  <p className="tb-mail-name">{userName||"User"}</p>
                  <p className="tb-mail-address">{userEmail||"No email"}</p>
                  <span className="tb-mail-role-badge">
                    {userRole==="admin"?"Administrator":"Restaurant Owner"}
                  </span>
                </div>
              </div>
              <div className="tb-dd-footer">
                <button className="tb-dd-action" onClick={() => { setMailOpen(false); navigate("/settings"); }}>
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" width="11" height="11"><path d="M9 2l3 3-8 8H1V10l8-8z" strokeLinejoin="round"/></svg>
                  Edit Profile
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="tb-dropdown-wrap" ref={notifRef}>
          <button className={`topbar-icon-btn tb-notif-btn ${notifOpen?"tb-btn-active":""}`}
            onClick={() => closeAll("notif")}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
            </svg>
            {unreadCount > 0 && <span className="tb-notif-badge">{unreadCount}</span>}
          </button>
          {notifOpen && (
            <div className="tb-dropdown tb-notif-dropdown">
              <div className="tb-dd-arrow"/>
              <div className="tb-dd-header">
                <span className="tb-dd-title">Notifications</span>
                {unreadCount > 0 && <button className="tb-mark-all" onClick={markAllRead}>Mark all read</button>}
              </div>
              <div className="tb-notif-list">
                {notifications.map(n => (
                  <div key={n.id} className={`tb-notif-item ${n.unread?"unread":""}`} onClick={() => markRead(n.id)}>
                    <div className="tb-notif-icon-wrap">{n.icon}</div>
                    <div className="tb-notif-content">
                      <p className="tb-notif-title">{n.title}</p>
                      <p className="tb-notif-desc">{n.desc}</p>
                      <span className="tb-notif-time">{n.time}</span>
                    </div>
                    {n.unread && <div className="tb-unread-dot"/>}
                  </div>
                ))}
              </div>
              <div className="tb-dd-footer">
                <button className="tb-dd-action tb-dd-action-center">View all</button>
              </div>
            </div>
          )}
        </div>

        <div className="topbar-divider"/>

        {/* Avatar */}
        <div className="tb-dropdown-wrap" ref={avatarRef}>
          <div className={`topbar-avatar tb-avatar-btn ${avatarOpen?"tb-avatar-active":""}`}
            onClick={() => closeAll("avatar")} title={userName}>
            {userInitials}
          </div>
          {avatarOpen && (
            <div className="tb-dropdown tb-avatar-dropdown">
              <div className="tb-dd-arrow tb-dd-arrow-right"/>
              <div className="tb-avatar-profile">
                <div className="tb-av-circle">{userInitials}</div>
                <div>
                  <p className="tb-av-name">{userName||"User"}</p>
                  <p className="tb-av-email">{userEmail}</p>
                </div>
              </div>
              <div className="tb-av-divider"/>
              <div className="tb-av-menu">
                <button className="tb-av-item" onClick={() => { setAvatarOpen(false); navigate("/settings"); }}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round"/></svg>
                  My Profile
                </button>
                <button className="tb-av-item" onClick={() => { setAvatarOpen(false); navigate("/settings"); }}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V5a3 3 0 016 0v2" strokeLinecap="round"/></svg>
                  Change Password
                </button>
                <button className="tb-av-item" onClick={() => { setAvatarOpen(false); navigate("/subscription"); }}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><rect x="1" y="4" width="14" height="9" rx="1.5"/><path d="M1 7h14" strokeLinecap="round"/></svg>
                  Subscription
                </button>
                <button className="tb-av-item" onClick={() => { toggleTheme(); setAvatarOpen(false); }}>
                  {theme === "dark"
                    ? <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><circle cx="8" cy="8" r="3"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.2 3.2l1 1M11.8 11.8l1 1M3.2 12.8l1-1M11.8 4.2l1-1" strokeLinecap="round"/></svg>
                    : <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13"><path d="M14.5 10.5A6.5 6.5 0 015.5 1.5a6.5 6.5 0 109 9z"/></svg>}
                  Switch to {theme === "dark" ? "Light" : "Dark"} Mode
                </button>
              </div>
              <div className="tb-av-divider"/>
              <button className="tb-av-item tb-av-logout" onClick={handleLogout}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;