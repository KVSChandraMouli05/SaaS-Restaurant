import React, { useState, useEffect } from "react";
import Sidebar from "./layout/Sidebar";
import Topbar from "./layout/Topbar";
import "./MainLayout.css";

function MainLayout({ children, onLogout, subscriptionLocked = false }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // Auto-close sidebar on mobile, open on desktop
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="main-layout">

      {/* ── Sidebar ── */}
      <Sidebar isOpen={sidebarOpen} onLogout={onLogout} subscriptionLocked={subscriptionLocked} />

      {/* ── Mobile overlay ── */}
      {sidebarOpen && isMobile && (
        <div className="mobile-overlay" onClick={toggleSidebar} />
      )}

      {/* ── Main content area ── */}
      <div className={`main-content ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>

        {/* Topbar */}
        <Topbar onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

        {/* Page content */}
        <div className="page-content">
          {children}
        </div>

      </div>
    </div>
  );
}

export default MainLayout;