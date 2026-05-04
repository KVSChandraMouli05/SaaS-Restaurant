import { useState, useEffect, useCallback } from "react";
import "./Orders.css";

const API   = "http://localhost:5000";
const token = () => localStorage.getItem("token");
const authH = () => ({ Authorization: `Bearer ${token()}` });

/* ── helpers ── */
const fmt = (d) => new Date(d).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", hour12:true });
const toLocalDateStr = (d) => {
  const dt = new Date(d);
  const y  = dt.getFullYear();
  const m  = String(dt.getMonth()+1).padStart(2,"0");
  const dy = String(dt.getDate()).padStart(2,"0");
  return `${y}-${m}-${dy}`;
};
const todayStr = () => toLocalDateStr(new Date());
const monthName = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_META = {
  pending:    { label:"Pending",    color:"#F59E0B", bg:"rgba(245,158,11,.12)",  border:"rgba(245,158,11,.25)"  },
  confirmed:  { label:"Preparing", color:"#3B82F6", bg:"rgba(59,130,246,.12)",  border:"rgba(59,130,246,.25)"  },
  processing: { label:"Preparing", color:"#3B82F6", bg:"rgba(59,130,246,.12)",  border:"rgba(59,130,246,.25)"  },
  completed:  { label:"Completed", color:"#10B981", bg:"rgba(16,185,129,.12)",  border:"rgba(16,185,129,.25)"  },
  cancelled:  { label:"Cancelled", color:"#EF4444", bg:"rgba(239,68,68,.12)",   border:"rgba(239,68,68,.25)"   },
};

const normalizeStatus = (value) => {
  const raw = String(value || "").toLowerCase().trim();
  if (raw === "confirmed") return "processing";
  return raw;
};

export default function Orders() {
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selectedDate,setSelectedDate]= useState(todayStr());
  const [calOpen,     setCalOpen]     = useState(false);
  const [calYear,     setCalYear]     = useState(new Date().getFullYear());
  const [calMonth,    setCalMonth]    = useState(new Date().getMonth());
  const [selected,    setSelected]    = useState(null); // order detail
  const [statusFilter,setStatusFilter]= useState("all");
  const [updating,    setUpdating]    = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/orders`, { headers: authH() });
      const data = await res.json();
      if (data.status === "success") {
        const rows = Array.isArray(data.data) ? data.data : [];
        setOrders(rows.map((o) => ({ ...o, status: normalizeStatus(o.status) })));
      } else {
        setOrders([]);
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  /* ── parse order_items (JSONB stored as string or array) ── */
  const parseItems = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(raw); } catch { return []; }
  };

  /* ── filter by selected date + status ── */
  const dayOrders = orders.filter(o => {
    const dateMatch   = toLocalDateStr(o.created_at) === selectedDate;
    const statusMatch = statusFilter === "all" || o.status === statusFilter;
    return dateMatch && statusMatch;
  });

  /* ── dates that have orders (for calendar dots) ── */
  const activeDates = new Set(orders.map(o => toLocalDateStr(o.created_at)));

  /* ── order totals for selected date ── */
  const dayTotal    = dayOrders.reduce((s,o) => s + parseFloat(o.total_amount||0), 0);
  const pendingCnt  = dayOrders.filter(o => o.status === "pending").length;
  const completeCnt = dayOrders.filter(o => o.status === "completed").length;

  /* ── update status ── */
  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const targetOrder = orders.find((o) => String(o.id) === String(orderId));
      const candidates = [`${API}/api/orders/${orderId}/status`];

      // Backward compatibility with legacy backend route shape.
      const restaurantId = targetOrder?.restaurant_id || selected?.restaurant_id;
      if (restaurantId) {
        candidates.push(
          `${API}/api/orders/${restaurantId}/orders/${orderId}`,
          `${API}/api/restaurants/${restaurantId}/orders/${orderId}`
        );
      }

      const statusCandidates = (() => {
        if (newStatus === "processing") return ["processing", "confirmed"];
        if (newStatus === "confirmed") return ["confirmed", "processing"];
        return [newStatus];
      })();

      let payload = null;
      let lastError = null;

      for (const url of candidates) {
        for (const statusValue of statusCandidates) {
          const res = await fetch(url, {
            method: "PUT",
            headers: { ...authH(), "Content-Type": "application/json" },
            body: JSON.stringify({ status: statusValue }),
          });

          const body = await res.json().catch(() => null);
          if (res.ok && body?.status === "success" && body?.data) {
            payload = body;
            lastError = null;
            break;
          }

          lastError = new Error(body?.message || `Failed request: ${url}`);
        }

        if (payload?.data) break;
      }

      if (!payload?.data) {
        throw lastError || new Error("Failed to update order status");
      }

      const nextStatus = normalizeStatus(payload.data.status || newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...payload.data, status: nextStatus } : o)));
      if (selected?.id === orderId) {
        setSelected((prev) => ({ ...prev, ...payload.data, status: nextStatus }));
      }
    } catch (e) {
      console.error(e);
      alert(e?.message || "Unable to update order status right now.");
    }
    setUpdating(null);
  };

  /* ── calendar helpers ── */
  const daysInMonth = (y,m) => new Date(y, m+1, 0).getDate();
  const firstDay    = (y,m) => new Date(y, m, 1).getDay();

  const calDays = () => {
    const total = daysInMonth(calYear, calMonth);
    const start = firstDay(calYear, calMonth);
    const days  = [];
    for (let i=0; i<start; i++) days.push(null);
    for (let d=1; d<=total; d++) days.push(d);
    return days;
  };

  const selectCalDay = (d) => {
    if (!d) return;
    const m  = String(calMonth+1).padStart(2,"0");
    const dy = String(d).padStart(2,"0");
    setSelectedDate(`${calYear}-${m}-${dy}`);
    setCalOpen(false);
  };

  const displayDate = () => {
    const [y,m,d] = selectedDate.split("-");
    const dt = new Date(+y, +m-1, +d);
    const isToday = selectedDate === todayStr();
    return isToday
      ? `Today, ${dt.getDate()} ${monthName[dt.getMonth()]} ${dt.getFullYear()}`
      : `${dt.getDate()} ${monthName[dt.getMonth()]} ${dt.getFullYear()}`;
  };

  return (
    <div className="ord-page">

      {/* ═══ HEADER ═══ */}
      <div className="ord-header">
        <div>
          <h1 className="ord-title">Orders</h1>
          <p className="ord-subtitle">Live order management · Updated in real time</p>
        </div>
        <button className="ord-refresh-btn" onClick={fetchOrders} disabled={loading}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
            width="14" height="14" className={loading ? "ord-spin" : ""}>
            <path d="M13.5 2.5A6.5 6.5 0 102 9" strokeLinecap="round"/>
            <path d="M1 5.5L2 9l3.5-1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* ═══ DATE BAR ═══ */}
      <div className="ord-datebar">
        <div className="ord-datebar-left">

          {/* Calendar toggle */}
          <div className="ord-cal-wrap">
            <button className="ord-date-btn" onClick={() => setCalOpen(p=>!p)}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"
                width="14" height="14">
                <rect x="1" y="2" width="14" height="13" rx="2"/>
                <path d="M1 6h14M5 1v2M11 1v2" strokeLinecap="round"/>
              </svg>
              <span>{displayDate()}</span>
              <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.8"
                width="10" height="6">
                <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Today shortcut */}
            {selectedDate !== todayStr() && (
              <button className="ord-today-btn" onClick={() => setSelectedDate(todayStr())}>
                Today
              </button>
            )}

            {/* Calendar dropdown */}
            {calOpen && (
              <div className="ord-calendar">
                <div className="ord-cal-head">
                  <button onClick={() => {
                    if (calMonth===0) { setCalMonth(11); setCalYear(y=>y-1); }
                    else setCalMonth(m=>m-1);
                  }}>‹</button>
                  <span>{monthName[calMonth]} {calYear}</span>
                  <button onClick={() => {
                    if (calMonth===11) { setCalMonth(0); setCalYear(y=>y+1); }
                    else setCalMonth(m=>m+1);
                  }}>›</button>
                </div>
                <div className="ord-cal-weekdays">
                  {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
                <div className="ord-cal-grid">
                  {calDays().map((d, i) => {
                    if (!d) return <span key={`e-${i}`} />;
                    const m    = String(calMonth+1).padStart(2,"0");
                    const dy   = String(d).padStart(2,"0");
                    const ds   = `${calYear}-${m}-${dy}`;
                    const isSelected = ds === selectedDate;
                    const isToday    = ds === todayStr();
                    const hasOrders  = activeDates.has(ds);
                    return (
                      <button
                        key={d}
                        className={`ord-cal-day ${isSelected?"sel":""} ${isToday?"today":""}`}
                        onClick={() => selectCalDay(d)}
                      >
                        {d}
                        {hasOrders && <span className="ord-cal-dot" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Status filter pills */}
          <div className="ord-filters">
            {["all","pending","processing","completed","cancelled"].map(s => (
              <button
                key={s}
                className={`ord-filter-pill ${statusFilter===s?"on":""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === "all" ? "All" : STATUS_META[s]?.label}
                <span>{s==="all" ? dayOrders.length : dayOrders.filter(o=>o.status===s).length}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Day summary */}
        <div className="ord-day-summary">
          <div className="ord-sum-item">
            <span className="ord-sum-val">{dayOrders.length}</span>
            <span className="ord-sum-lbl">Orders</span>
          </div>
          <div className="ord-sum-sep"/>
          <div className="ord-sum-item">
            <span className="ord-sum-val ord-sum-green">₹{dayTotal.toLocaleString("en-IN")}</span>
            <span className="ord-sum-lbl">Revenue</span>
          </div>
          <div className="ord-sum-sep"/>
          <div className="ord-sum-item">
            <span className="ord-sum-val ord-sum-amber">{pendingCnt}</span>
            <span className="ord-sum-lbl">Pending</span>
          </div>
          <div className="ord-sum-sep"/>
          <div className="ord-sum-item">
            <span className="ord-sum-val ord-sum-teal">{completeCnt}</span>
            <span className="ord-sum-lbl">Done</span>
          </div>
        </div>
      </div>

      {/* ═══ MAIN: TABLE + DETAIL PANEL ═══ */}
      <div className={`ord-body ${selected ? "ord-body-split" : ""}`}>

        {/* ── Orders table ── */}
        <div className="ord-table-wrap">
          {loading ? (
            <div className="ord-loading">
              <div className="ord-spinner"/><p>Loading orders…</p>
            </div>
          ) : dayOrders.length === 0 ? (
            <div className="ord-empty">
              <svg viewBox="0 0 64 64" fill="none" stroke="rgba(255,255,255,.1)"
                strokeWidth="1.5" width="52" height="52">
                <rect x="8" y="12" width="48" height="40" rx="4"/>
                <path d="M20 24h24M20 32h18M20 40h12" strokeLinecap="round"/>
              </svg>
              <p>No orders for {displayDate()}</p>
              <span>Orders placed today will appear here automatically</span>
            </div>
          ) : (
            <table className="ord-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Restaurant</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {dayOrders.map(order => {
                  const items   = parseItems(order.order_items || order.items);
                  const isOpen  = selected?.id === order.id;
                  const meta    = STATUS_META[order.status] || STATUS_META.pending;
                  return (
                    <tr
                      key={order.id}
                      className={`ord-row ${isOpen?"ord-row-active":""}`}
                      onClick={() => setSelected(isOpen ? null : order)}
                    >
                      <td>
                        <span className="ord-id">#{order.id}</span>
                      </td>
                      <td>
                        <span className="ord-restaurant">{order.restaurant_name}</span>
                      </td>
                      <td>
                        <div className="ord-customer">
                          <div className="ord-cust-avatar">
                            {(order.customer_name||"?")[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="ord-cust-name">{order.customer_name}</div>
                            {order.customer_phone && (
                              <div className="ord-cust-phone">{order.customer_phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {items.length === 0 ? (
                          <span className="ord-no-items">—</span>
                        ) : (
                          <div className="ord-items-preview">
                            {items.slice(0,2).map((it,i) => (
                              <span key={i} className="ord-item-tag">
                                {it.name}
                                {it.quantity > 1 && <em>×{it.quantity}</em>}
                              </span>
                            ))}
                            {items.length > 2 && (
                              <span className="ord-item-more">+{items.length-2}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="ord-amount">
                          ₹{parseFloat(order.total_amount||0).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td>
                        <span className="ord-time">{fmt(order.created_at)}</span>
                      </td>
                      <td>
                        <span className="ord-status-badge" style={{
                          color: meta.color, background: meta.bg, border:`1px solid ${meta.border}`
                        }}>
                          {meta.label}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <StatusActions
                          status={order.status}
                          orderId={order.id}
                          onUpdate={updateStatus}
                          loading={updating===order.id}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Order detail panel ── */}
        {selected && (
          <OrderDetail
            order={selected}
            parseItems={parseItems}
            onClose={() => setSelected(null)}
            onUpdate={updateStatus}
            updating={updating===selected.id}
          />
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   STATUS ACTION BUTTONS
════════════════════════════════════════ */
function StatusActions({ status, orderId, onUpdate, loading }) {
  const next = {
    pending:    { label:"Accept",   next:"processing", cls:"btn-blue"  },
    confirmed:  { label:"Complete", next:"completed",  cls:"btn-green" },
    processing: { label:"Complete", next:"completed",  cls:"btn-green" },
    completed:  null,
    cancelled:  null,
  }[status];

  return (
    <div className="ord-actions">
      {next && (
        <button
          className={`ord-action-btn ${next.cls}`}
          onClick={() => onUpdate(orderId, next.next)}
          disabled={loading}
        >
          {loading ? <span className="ord-btn-spin"/> : next.label}
        </button>
      )}
      {status === "pending" && (
        <button
          className="ord-action-btn btn-red"
          onClick={() => onUpdate(orderId, "cancelled")}
          disabled={loading}
        >
          Reject
        </button>
      )}
      {(status === "completed" || status === "cancelled") && (
        <span className="ord-done-label">
          {status === "completed" ? "✓ Done" : "✗ Cancelled"}
        </span>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   ORDER DETAIL PANEL
════════════════════════════════════════ */
function OrderDetail({ order, parseItems, onClose, onUpdate, updating }) {
  const items = parseItems(order.order_items || order.items);
  const meta  = STATUS_META[order.status] || STATUS_META.pending;
  const total = parseFloat(order.total_amount || 0);

  return (
    <div className="ord-detail">
      {/* Header */}
      <div className="ord-detail-hd">
        <div>
          <div className="ord-detail-id">Order #{order.id}</div>
          <div className="ord-detail-time">
            {new Date(order.created_at).toLocaleString("en-IN",{
              day:"numeric", month:"short", year:"numeric",
              hour:"2-digit", minute:"2-digit", hour12:true
            })}
          </div>
        </div>
        <div className="ord-detail-hd-right">
          <span className="ord-status-badge" style={{
            color: meta.color, background: meta.bg, border:`1px solid ${meta.border}`
          }}>
            {meta.label}
          </span>
          <button className="ord-detail-close" onClick={onClose}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"
              width="12" height="12">
              <path d="M1 1l12 12M13 1L1 13" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="ord-detail-body">

        {/* Restaurant */}
        <div className="ord-detail-section">
          <p className="ord-detail-label">RESTAURANT</p>
          <p className="ord-detail-val">{order.restaurant_name}</p>
        </div>

        {/* Customer */}
        <div className="ord-detail-section">
          <p className="ord-detail-label">CUSTOMER</p>
          <div className="ord-detail-cust">
            <div className="ord-detail-avatar">
              {(order.customer_name||"?")[0].toUpperCase()}
            </div>
            <div>
              <p className="ord-detail-val">{order.customer_name}</p>
              {order.customer_phone && (
                <p className="ord-detail-sub">{order.customer_phone}</p>
              )}
              {order.customer_email && (
                <p className="ord-detail-sub">{order.customer_email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="ord-detail-section">
          <p className="ord-detail-label">ORDER ITEMS ({items.length})</p>
          {items.length === 0 ? (
            <p className="ord-detail-sub">No item details available</p>
          ) : (
            <div className="ord-detail-items">
              {items.map((it, i) => (
                <div key={i} className="ord-detail-item">
                  <div className="ord-di-left">
                    <span className="ord-di-qty">×{it.quantity||1}</span>
                    <span className="ord-di-name">{it.name}</span>
                  </div>
                  <span className="ord-di-price">
                    ₹{(parseFloat(it.price||0) * (it.quantity||1)).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
              <div className="ord-detail-total">
                <span>Total</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}
        </div>

        {/* Special instructions */}
        {order.special_instructions && (
          <div className="ord-detail-section">
            <p className="ord-detail-label">SPECIAL INSTRUCTIONS</p>
            <p className="ord-detail-note">{order.special_instructions}</p>
          </div>
        )}

        {/* Actions */}
        {(order.status === "pending" || order.status === "processing") && (
          <div className="ord-detail-section">
            <p className="ord-detail-label">UPDATE STATUS</p>
            <div className="ord-detail-actions">
              {order.status === "pending" && (
                <>
                  <button
                    className="ord-detail-btn btn-blue"
                    onClick={() => onUpdate(order.id, "processing")}
                    disabled={updating}
                  >
                    {updating ? <span className="ord-btn-spin"/> : "✓ Accept Order"}
                  </button>
                  <button
                    className="ord-detail-btn btn-red"
                    onClick={() => onUpdate(order.id, "cancelled")}
                    disabled={updating}
                  >
                    ✗ Reject
                  </button>
                </>
              )}
              {order.status === "processing" && (
                <button
                  className="ord-detail-btn btn-green"
                  onClick={() => onUpdate(order.id, "completed")}
                  disabled={updating}
                >
                  {updating ? <span className="ord-btn-spin"/> : "✓ Mark Completed"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}