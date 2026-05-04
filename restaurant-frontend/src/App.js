import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login          from "./pages/Login";
import Dashboard      from "./pages/Dashboard";
import Restaurants    from "./pages/Restaurants";
import Orders         from "./pages/Orders";
import OwnerAnalytics from "./pages/OwnerAnalytics";
import Subscription   from "./pages/Subscription";
import AdminDashboard from "./pages/Admindashboard";
import MenuManagement from "./pages/MenuManagement";
import CustomerMenu   from "./pages/CustomerMenu";
import Settings       from "./pages/Settings";   // ← NEW
import MainLayout     from "./MainLayout";

function App() {
  const [token,           setToken]           = useState(null);
  const [userRole,        setUserRole]        = useState(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [checking,        setChecking]        = useState(true);

  const isSubscriptionActive = (sub) => {
    if (!sub || sub.status !== "active") return false;
    if (!sub.end_date) return false;

    const end = new Date(sub.end_date);
    if (Number.isNaN(end.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return end >= today;
  };

  /* ================= INITIAL AUTH CHECK ================= */
  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (!storedToken) {
      setChecking(false);
      return;
    }

    try {
      const payload = JSON.parse(atob(storedToken.split(".")[1]));
      const role = payload.role || "user";

      setToken(storedToken);
      setUserRole(role);

      if (role === "admin") {
        setHasSubscription(true);
        setChecking(false);
      } else {
        validateSubscription(storedToken);
      }

    } catch (err) {
      console.error("Invalid token:", err);
      performLogout();
    }
  }, []);

  /* ================= GLOBAL LOGOUT ================= */
  const performLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUserRole(null);
    setHasSubscription(false);
    setChecking(false);
  };

  /* ================= SUBSCRIPTION VALIDATION ================= */
  const validateSubscription = async (tkn) => {
    try {
      const res = await fetch("http://localhost:5000/api/subscription/current", {
        headers: { Authorization: `Bearer ${tkn}` },
      });

      if (res.status === 401) {
        performLogout();
        return;
      }

      if (!res.ok) {
        setHasSubscription(false);
        return;
      }

      const data = await res.json();

      if (data.status === "success" && isSubscriptionActive(data.data)) {
        setHasSubscription(true);
      } else {
        setHasSubscription(false);
      }

    } catch (err) {
      console.error("Subscription check failed:", err);
      setHasSubscription(false);
    } finally {
      setChecking(false);
    }
  };

  /* ================= LOADING SCREEN ================= */
  if (checking) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#090D17",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "18px",
        fontFamily: "Segoe UI, sans-serif",
      }}>
        <div style={{ fontSize: "52px" }}>🍽️</div>
        <div style={{
          width: 44,
          height: 44,
          border: "3.5px solid #131D2E",
          borderTopColor: "#3B82F6",
          borderRadius: "50%",
          animation: "spin 0.75s linear infinite",
        }}></div>
        <p style={{ color: "#777", fontSize: "14px" }}>
          Loading your account...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── Reusable protected route wrapper ── */
  const ProtectedOwner = ({ children }) => {
    if (!token) return <Navigate to="/login" replace />;
    if (userRole === "admin") return <Navigate to="/admin-dashboard" replace />;
    if (!hasSubscription) return <Navigate to="/subscription" replace />;
    return (
      <MainLayout onLogout={performLogout} subscriptionLocked={false}>
        {children}
      </MainLayout>
    );
  };

  return (
    <Router>
      <Routes>

        {/* ═══════════ PUBLIC — NO AUTH NEEDED ═══════════ */}
        <Route path="/menu/:restaurantId" element={<CustomerMenu />} />

        {/* ═══════════ LOGIN ═══════════ */}
        <Route
          path="/login"
          element={
            !token ? (
              <Login />
            ) : userRole === "admin" ? (
              <Navigate to="/admin-dashboard" replace />
            ) : hasSubscription ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/subscription" replace />
            )
          }
        />

        {/* ═══════════ SUBSCRIPTION ═══════════ */}
        <Route
          path="/subscription"
          element={
            token ? (
              userRole === "admin" ? (
                <Navigate to="/admin-dashboard" replace />
              ) : (
                <MainLayout onLogout={performLogout} subscriptionLocked={!hasSubscription}>
                  <Subscription subscriptionLocked={!hasSubscription} />
                </MainLayout>
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ═══════════ DASHBOARD ═══════════ */}
        <Route
          path="/dashboard"
          element={
            <ProtectedOwner><Dashboard /></ProtectedOwner>
          }
        />

        {/* ═══════════ RESTAURANTS ═══════════ */}
        <Route
          path="/restaurants"
          element={
            <ProtectedOwner><Restaurants /></ProtectedOwner>
          }
        />

        {/* ═══════════ ORDERS ═══════════ */}
        <Route
          path="/orders"
          element={
            <ProtectedOwner><Orders /></ProtectedOwner>
          }
        />

        {/* ═══════════ OWNER ANALYTICS ═══════════ */}
        <Route
          path="/owner-analytics"
          element={
            <ProtectedOwner><OwnerAnalytics /></ProtectedOwner>
          }
        />

        {/* ═══════════ MENU MANAGEMENT ═══════════ */}
        <Route
          path="/menu"
          element={
            <ProtectedOwner><MenuManagement /></ProtectedOwner>
          }
        />

        {/* ═══════════ SETTINGS (NEW) ═══════════ */}
        <Route
          path="/settings"
          element={
            <ProtectedOwner><Settings /></ProtectedOwner>
          }
        />

        {/* ═══════════ ADMIN DASHBOARD ═══════════ */}
        <Route
          path="/admin-dashboard"
          element={
            token ? (
              userRole === "admin" ? (
                <AdminDashboard onLogout={performLogout} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ═══════════ REDIRECTS ═══════════ */}
        <Route path="/analytics" element={<Navigate to="/owner-analytics" replace />} />

        {/* ═══════════ DEFAULT ═══════════ */}
        <Route
          path="*"
          element={
            !token ? (
              <Navigate to="/login" replace />
            ) : userRole === "admin" ? (
              <Navigate to="/admin-dashboard" replace />
            ) : hasSubscription ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/subscription" replace />
            )
          }
        />

      </Routes>
    </Router>
  );
}

export default App;