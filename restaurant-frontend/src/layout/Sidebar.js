import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({ isOpen, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate("/login");
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>

      {/* ── Logo ── */}
      <div className="sidebar-logo">
        <div className="logo-icon-wrap">
          <span className="logo-emoji">🍽️</span>
        </div>
        <span className="logo-text">
          Restaurant-<span className="logo-accent">-SaaS</span>
        </span>
      </div>

      <div className="sidebar-divider" />

      {/* ── Main Navigation ── */}
      <nav className="sidebar-nav">

        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <span className="nav-icon">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
            </svg>
          </span>
          <span className="nav-text">Dashboard</span>
        </NavLink>

        <NavLink to="/restaurants" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <span className="nav-icon">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm0 4h2v2H7V9zm0 4h2v2H7v-2zm4-8h2v2h-2V5zm0 4h2v2h-2V9zm0 4h2v2h-2v-2z" clipRule="evenodd"/>
            </svg>
          </span>
          <span className="nav-text">Restaurants</span>
        </NavLink>

        <NavLink to="/menu" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <span className="nav-icon">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
            </svg>
          </span>
          <span className="nav-text">Menu</span>
        </NavLink>

        <NavLink to="/orders" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <span className="nav-icon">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
            </svg>
          </span>
          <span className="nav-text">Orders</span>
        </NavLink>

        <NavLink to="/owner-analytics" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <span className="nav-icon">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
            </svg>
          </span>
          <span className="nav-text">Analytics</span>
        </NavLink>

        <NavLink to="/subscription" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <span className="nav-icon">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
            </svg>
          </span>
          <span className="nav-text">Subscription</span>
        </NavLink>

      </nav>

      {/* ── Bottom ── */}
      <div className="sidebar-bottom">

        {/* ── Settings — now a real NavLink ── */}
        <NavLink
          to="/settings"
          className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          title="Settings"
        >
          <span className="nav-icon">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
            </svg>
          </span>
          <span className="nav-text">Settings</span>
        </NavLink>

        {/* ── Sign Out ── */}
        <button className="sidebar-btn sidebar-logout" onClick={handleLogout} title="Sign Out">
          <span className="nav-icon">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
            </svg>
          </span>
          <span className="nav-text">Sign Out</span>
        </button>

      </div>

    </div>
  );
};

export default Sidebar;