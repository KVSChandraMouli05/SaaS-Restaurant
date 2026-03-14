import { useEffect, useState } from "react";
import "./Orders.css";

const STATUS_CONFIG = {
  pending:    { label: "Pending",    color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.25)"  },
  processing: { label: "Processing", color: "#3B82F6", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.25)"  },
  completed:  { label: "Completed",  color: "#10B981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.25)"  },
  cancelled:  { label: "Cancelled",  color: "#EF4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.25)"   },
};

const STATUS_TABS = ["all", "pending", "processing", "completed", "cancelled"];

export default function Orders() {
  const [orders, setOrders]                         = useState([]);
  const [restaurants, setRestaurants]               = useState([]);
  const [loading, setLoading]                       = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState("all");
  const [selectedStatus, setSelectedStatus]         = useState("all");
  const [updatingId, setUpdatingId]                 = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => { fetchRestaurants(); }, []);
  useEffect(() => { if (restaurants.length > 0) fetchOrders(); }, [selectedRestaurant, selectedStatus, restaurants]);

  /* ── FETCH RESTAURANTS ── */
  const fetchRestaurants = async () => {
    try {
      const res  = await fetch("http://localhost:5000/api/restaurants", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "success") {
        let list = [];
        if (Array.isArray(data.data)) list = data.data;
        else if (Array.isArray(data.data?.restaurants)) list = data.data.restaurants;
        else if (Array.isArray(data.restaurants)) list = data.restaurants;
        setRestaurants(list);
        fetchOrders(list); // pass list directly so fetchOrders doesn't wait for state
      }
    } catch (err) { console.error("Failed to fetch restaurants:", err); }
  };

  /* ── FETCH ORDERS (per restaurant, then merge) ── */
  const fetchOrders = async (restaurantList) => {
    setLoading(true);
    try {
      // Use passed list or current state
      const list = restaurantList || restaurants;

      if (list.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // If a specific restaurant is selected, only fetch that one
      const targets = selectedRestaurant !== "all"
        ? list.filter(r => String(r.id) === String(selectedRestaurant))
        : list;

      // Fetch orders for each restaurant in parallel
      const results = await Promise.all(
        targets.map(async (r) => {
          try {
            const params = new URLSearchParams();
            if (selectedStatus !== "all") params.append("status", selectedStatus);
            const url = `http://localhost:5000/api/restaurants/${r.id}/orders${params.toString() ? `?${params}` : ""}`;
            const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.status === "success") {
              let orders = [];
              if (Array.isArray(data.data)) orders = data.data;
              else if (Array.isArray(data.data?.orders)) orders = data.data.orders;
              else if (Array.isArray(data.orders)) orders = data.orders;
              // Attach restaurant_name if not already present
              return orders.map(o => ({ ...o, restaurant_name: o.restaurant_name || r.restaurant_name || r.name }));
            }
            return [];
          } catch {
            return [];
          }
        })
      );

      // Flatten and sort by date descending
      const allOrders = results.flat().sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      );

      setOrders(allOrders);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ── UPDATE STATUS ── */
  const updateOrderStatus = async (orderId, restaurantId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res  = await fetch(`http://localhost:5000/api/restaurants/${restaurantId}/orders/${orderId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.status === "success") fetchOrders();
      else alert(data.message);
    } catch (err) { alert("Failed to update order"); }
    finally { setUpdatingId(null); }
  };

  /* ── STATS ── */
  const stats = {
    total:      orders.length,
    pending:    orders.filter(o => o.status?.toLowerCase() === "pending").length,
    processing: orders.filter(o => o.status?.toLowerCase() === "processing").length,
    completed:  orders.filter(o => o.status?.toLowerCase() === "completed").length,
    cancelled:  orders.filter(o => o.status?.toLowerCase() === "cancelled").length,
    revenue:    orders
      .filter(o => o.status?.toLowerCase() === "completed")
      .reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0),
  };

  const getStatus = (s) => STATUS_CONFIG[s?.toLowerCase()] || STATUS_CONFIG.pending;

  return (
    <div className="orders-page">

      {/* ── Header ── */}
      <div className="orders-header">
        <div>
          <h1 className="orders-title">Orders</h1>
          <p className="orders-subtitle">Manage and track all your orders</p>
        </div>
        <button className="orders-refresh-btn" onClick={fetchOrders} title="Refresh">
          <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="orders-stats">
        {[
          { label: "Total Orders",        value: stats.total,      color: "#fff"    },
          { label: "Pending",             value: stats.pending,    color: "#F59E0B" },
          { label: "Processing",          value: stats.processing, color: "#3B82F6" },
          { label: "Revenue (Completed)", value: `₹${stats.revenue.toLocaleString("en-IN")}`, color: "#10B981" },
        ].map((s, i) => (
          <div key={i} className="ostat-card" style={{ animationDelay: `${i * 0.07}s` }}>
            <p className="ostat-label">{s.label}</p>
            <p className="ostat-value" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="orders-filters">
        <div className="status-tabs">
          {STATUS_TABS.map(s => {
            const count =
              s === "all"        ? stats.total      :
              s === "pending"    ? stats.pending     :
              s === "processing" ? stats.processing  :
              s === "completed"  ? stats.completed   : stats.cancelled;
            return (
              <button
                key={s}
                className={`status-tab ${selectedStatus === s ? "status-tab--active" : ""}`}
                onClick={() => setSelectedStatus(s)}
              >
                {s === "all" ? "All" : STATUS_CONFIG[s].label}
                <span className="tab-count">{count}</span>
              </button>
            );
          })}
        </div>

        <select
          className="orders-select"
          value={selectedRestaurant}
          onChange={(e) => setSelectedRestaurant(e.target.value)}
        >
          <option value="all">All Restaurants</option>
          {restaurants.map(r => (
            <option key={r.id} value={r.id}>{r.restaurant_name || r.name}</option>
          ))}
        </select>
      </div>

      {/* ── Main Content ── */}
      <main className="orders-main">
        {loading ? (
          <div className="orders-loading">
            <div className="orders-spinner"></div>
            <p>Loading orders...</p>
          </div>

        ) : orders.length === 0 ? (
          <div className="orders-empty">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
            <h2>No Orders Found</h2>
            <p>
              {selectedStatus !== "all" || selectedRestaurant !== "all"
                ? "Try adjusting your filters."
                : "Orders will appear here once customers start placing them."}
            </p>
            {(selectedStatus !== "all" || selectedRestaurant !== "all") && (
              <button
                className="clear-filters-btn"
                onClick={() => { setSelectedStatus("all"); setSelectedRestaurant("all"); }}
              >
                Clear Filters
              </button>
            )}
          </div>

        ) : (
          <>
            <p className="orders-meta">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
            <div className="orders-table-wrap">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Restaurant</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, i) => {
                    const st         = getStatus(order.status);
                    const isUpdating = updatingId === order.id;
                    const status     = order.status?.toLowerCase();
                    return (
                      <tr key={order.id} className="order-row" style={{ animationDelay: `${i * 0.025}s` }}>

                        <td><span className="cell-id">#{order.id}</span></td>

                        <td>
                          <span className="cell-restaurant">
                            <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm0 4h2v2H7V9zm0 4h2v2H7v-2zm4-8h2v2h-2V5zm0 4h2v2h-2V9zm0 4h2v2h-2v-2z" clipRule="evenodd"/>
                            </svg>
                            {order.restaurant_name || "—"}
                          </span>
                        </td>

                        <td className="cell-muted">{order.customer_name || "—"}</td>
                        <td className="cell-muted">{order.items || order.item_count || "—"}</td>

                        <td>
                          <span className="cell-amount">
                            ₹{parseFloat(order.total_amount || 0).toLocaleString("en-IN")}
                          </span>
                        </td>

                        <td className="cell-muted">
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                            : "—"}
                        </td>

                        <td>
                          <span className="cell-status" style={{ background: st.bg, color: st.color, borderColor: st.border }}>
                            {st.label}
                          </span>
                        </td>

                        <td>
                          {isUpdating ? (
                            <span className="mini-spinner"></span>
                          ) : status === "pending" ? (
                            <div className="cell-actions">
                              <button className="tbl-btn tbl-btn--accept"   onClick={() => updateOrderStatus(order.id, order.restaurant_id, "processing")}>Accept</button>
                              <button className="tbl-btn tbl-btn--cancel"   onClick={() => updateOrderStatus(order.id, order.restaurant_id, "cancelled")}>Cancel</button>
                            </div>
                          ) : status === "processing" ? (
                            <button className="tbl-btn tbl-btn--complete" onClick={() => updateOrderStatus(order.id, order.restaurant_id, "completed")}>Complete</button>
                          ) : (
                            <span className="cell-done" style={{ color: status === "completed" ? "#10B981" : "#555" }}>
                              {status === "completed" ? "✓ Done" : "✕ Cancelled"}
                            </span>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

    </div>
  );
}