import { useState, useEffect, useCallback } from "react";
import "./MenuManagement.css";

const API   = "http://localhost:5000";
const token = () => localStorage.getItem("token");
const authH = () => ({ Authorization: `Bearer ${token()}` });
const jsonH = () => ({ ...authH(), "Content-Type": "application/json" });

const BLANK = { name:"", description:"", price:"", category:"", is_available:true, is_veg:true };

export default function MenuManagement() {
  const [restaurants, setRestaurants] = useState([]);
  const [selRest,     setSelRest]     = useState(null);
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [search,      setSearch]      = useState("");
  const [catFilter,   setCatFilter]   = useState("All");
  const [availFilter, setAvailFilter] = useState("all");
  const [showForm,    setShowForm]    = useState(false);
  const [editItem,    setEditItem]    = useState(null);
  const [delConfirm,  setDelConfirm]  = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState(null);
  const [form,        setForm]        = useState(BLANK);
  const [sortCol,     setSortCol]     = useState("category");
  const [sortDir,     setSortDir]     = useState("asc");
  const [hoveredRow,  setHoveredRow]  = useState(null);

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── fetch restaurants ── */
  useEffect(() => {
    fetch(`${API}/api/restaurants`, { headers: authH() })
      .then(r => r.json())
      .then(d => {
        let list = [];
        if (Array.isArray(d))                                 list = d;
        else if (Array.isArray(d.restaurants))                list = d.restaurants;
        else if (Array.isArray(d.data))                       list = d.data;
        else if (d.data && Array.isArray(d.data.restaurants)) list = d.data.restaurants;
        setRestaurants(list);
        if (list.length > 0) setSelRest(list[0]);
      })
      .catch(console.error);
  }, []);

  /* ── fetch menu items ── */
  const fetchItems = useCallback(async (restId) => {
    if (!restId) return;
    setLoading(true);
    try {
      let res = await fetch(`${API}/api/restaurants/${restId}/menu`, { headers: authH() });
      if (!res.ok) res = await fetch(`${API}/api/restaurants/${restId}/menu-items`, { headers: authH() });
      const data = await res.json();
      const list = data.menu || data.data || data.menu_items || data.items || (Array.isArray(data) ? data : []);
      setItems(Array.isArray(list) ? list : []);
    } catch(e) { console.error(e); setItems([]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selRest) { fetchItems(selRest.id); setCatFilter("All"); }
  }, [selRest, fetchItems]);

  /* ── derived ── */
  const categories = ["All", ...new Set(items.map(i => i.category).filter(Boolean))];

  const filtered = items
    .filter(i => {
      const matchSearch = !search ||
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.category||"").toLowerCase().includes(search.toLowerCase());
      const matchCat   = catFilter === "All" || i.category === catFilter;
      const matchAvail = availFilter === "all" ||
        (availFilter === "available"   &&  i.is_available) ||
        (availFilter === "unavailable" && !i.is_available);
      return matchSearch && matchCat && matchAvail;
    })
    .sort((a, b) => {
      let av = a[sortCol] ?? ""; let bv = b[sortCol] ?? "";
      if (sortCol === "price") { av = parseFloat(av); bv = parseFloat(bv); }
      else { av = String(av).toLowerCase(); bv = String(bv).toLowerCase(); }
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

  const stats = {
    total:      items.length,
    available:  items.filter(i => i.is_available).length,
    unavailable:items.filter(i => !i.is_available).length,
    categories: new Set(items.map(i => i.category).filter(Boolean)).size,
    veg:        items.filter(i => i.is_veg).length,
  };

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  /* ── toggle availability ── */
  const toggleAvail = async (item) => {
    const updated = { ...item, is_available: !item.is_available };
    setItems(prev => prev.map(i => i.id === item.id ? updated : i));
    try {
      await fetch(`${API}/api/restaurants/${selRest.id}/menu/${item.id}`, {
        method: "PUT", headers: jsonH(),
        body: JSON.stringify({ is_available: updated.is_available }),
      });
    } catch {
      setItems(prev => prev.map(i => i.id === item.id ? item : i));
      showToast("Failed to update", "error");
    }
  };

  /* ── open forms ── */
  const openAdd  = ()     => { setForm(BLANK); setEditItem(null); setShowForm(true); };
  const openEdit = (item) => {
    setForm({
      name: item.name||"", description: item.description||"",
      price: item.price||"", category: item.category||"",
      is_available: item.is_available !== false,
      is_veg: item.is_veg !== false,
    });
    setEditItem(item); setShowForm(true);
  };

  /* ── save ── */
  const saveItem = async () => {
    if (!form.name.trim())           { showToast("Item name is required","error"); return; }
    if (!form.price || isNaN(form.price)) { showToast("Valid price required","error"); return; }
    if (!form.category.trim())       { showToast("Category is required","error"); return; }
    setSaving(true);
    try {
      const body = { ...form, price: parseFloat(form.price) };
      let res, data;
      if (editItem) {
        res  = await fetch(`${API}/api/restaurants/${selRest.id}/menu/${editItem.id}`, {
          method:"PUT", headers:jsonH(), body:JSON.stringify(body) });
        data = await res.json();
        if (data.status === "success") {
          setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, ...body } : i));
          showToast("Item updated");
        } else showToast(data.message||"Update failed","error");
      } else {
        res  = await fetch(`${API}/api/restaurants/${selRest.id}/menu`, {
          method:"POST", headers:jsonH(), body:JSON.stringify(body) });
        data = await res.json();
        if (data.status === "success") {
          setItems(prev => [data.data||{...body,id:Date.now()}, ...prev]);
          showToast("Item added");
        } else showToast(data.message||"Add failed","error");
      }
      setShowForm(false);
    } catch { showToast("Network error","error"); }
    setSaving(false);
  };

  /* ── delete ── */
  const deleteItem = async (item) => {
    try {
      await fetch(`${API}/api/restaurants/${selRest.id}/menu/${item.id}`, {
        method:"DELETE", headers:authH() });
      setItems(prev => prev.filter(i => i.id !== item.id));
      showToast("Item deleted");
      setDelConfirm(null);
    } catch { showToast("Delete failed","error"); }
  };

  return (
    <div className="mm-page">

      {/* ── Toast ── */}
      {toast && (
        <div className={`mm-toast mm-toast--${toast.type}`}>
          {toast.type === "success"
            ? <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" width="13" height="13"><path d="M3 8l3.5 3.5 6.5-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M8 5v4M8 11v1" strokeLinecap="round"/><circle cx="8" cy="8" r="6"/></svg>}
          {toast.msg}
        </div>
      )}

      {/* ═══ HEADER ═══ */}
      <div className="mm-header">
        <div className="mm-header-left">
          <div className="mm-header-icon">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
              <path d="M3 5h14M3 10h14M3 15h10" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className="mm-title">Menu Management</h1>
            <p className="mm-sub">
              {selRest ? (
                <><span className="mm-sub-rest">{selRest.restaurant_name || selRest.name}</span> · {items.length} items across {stats.categories} categories</>
              ) : "Manage your restaurant menu"}
            </p>
          </div>
        </div>
        <button className="mm-add-btn" onClick={openAdd} disabled={!selRest}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
            <path d="M7 1v12M1 7h12" strokeLinecap="round"/>
          </svg>
          Add Item
        </button>
      </div>

      {/* ═══ RESTAURANT TABS ═══ */}
      {restaurants.length > 0 && (
        <div className="mm-rest-bar">
          {restaurants.map(r => (
            <button
              key={r.id}
              className={`mm-rest-tab ${selRest?.id === r.id ? "mm-rest-tab--on" : ""}`}
              onClick={() => setSelRest(r)}
            >
              <span className="mm-rest-tab-dot" />
              {r.restaurant_name || r.name}
            </button>
          ))}
        </div>
      )}

      {selRest && (
        <>
          {/* ═══ STATS STRIP ═══ */}
          <div className="mm-stats-strip">
            <div className="mm-stat-item">
              <div className="mm-stat-icon" style={{background:"rgba(59,130,246,.1)",color:"#3B82F6"}}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="14" height="14"><path d="M2 3h12v10H2zM2 7h12" strokeLinecap="round"/></svg>
              </div>
              <div>
                <div className="mm-stat-val">{stats.total}</div>
                <div className="mm-stat-lbl">Total Items</div>
              </div>
            </div>
            <div className="mm-stat-div"/>
            <div className="mm-stat-item">
              <div className="mm-stat-icon" style={{background:"rgba(16,185,129,.1)",color:"#10B981"}}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="14" height="14"><path d="M2 8l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <div className="mm-stat-val" style={{color:"#10B981"}}>{stats.available}</div>
                <div className="mm-stat-lbl">Available</div>
              </div>
            </div>
            <div className="mm-stat-div"/>
            <div className="mm-stat-item">
              <div className="mm-stat-icon" style={{background:"rgba(239,68,68,.1)",color:"#EF4444"}}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="14" height="14"><path d="M8 5v4M8 11v1" strokeLinecap="round"/><circle cx="8" cy="8" r="6"/></svg>
              </div>
              <div>
                <div className="mm-stat-val" style={{color:"#EF4444"}}>{stats.unavailable}</div>
                <div className="mm-stat-lbl">Off Menu</div>
              </div>
            </div>
            <div className="mm-stat-div"/>
            <div className="mm-stat-item">
              <div className="mm-stat-icon" style={{background:"rgba(139,92,246,.1)",color:"#8B5CF6"}}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="14" height="14"><path d="M2 4h12v8H2zM5 4V2h6v2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <div className="mm-stat-val" style={{color:"#8B5CF6"}}>{stats.categories}</div>
                <div className="mm-stat-lbl">Categories</div>
              </div>
            </div>
            <div className="mm-stat-div"/>
            <div className="mm-stat-item">
              <div className="mm-stat-icon" style={{background:"rgba(34,197,94,.1)",color:"#22C55E"}}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="14" height="14"><circle cx="8" cy="8" r="5"/><path d="M8 5v3l2 1.5" strokeLinecap="round"/></svg>
              </div>
              <div>
                <div className="mm-stat-val" style={{color:"#22C55E"}}>{stats.veg}</div>
                <div className="mm-stat-lbl">Veg Items</div>
              </div>
            </div>
          </div>

          {/* ═══ TOOLBAR ═══ */}
          <div className="mm-toolbar">
            <div className="mm-toolbar-l">
              <div className="mm-search-box">
                <svg viewBox="0 0 16 16" fill="none" stroke="#3B4F6A" strokeWidth="1.8" width="13" height="13">
                  <circle cx="6.5" cy="6.5" r="4.5"/><path d="M13 13l-3-3" strokeLinecap="round"/>
                </svg>
                <input
                  placeholder="Search items or categories…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && <button className="mm-sx" onClick={() => setSearch("")}>✕</button>}
              </div>

              <div className="mm-cat-scroll">
                {categories.map(c => (
                  <button key={c}
                    className={`mm-cat-pill ${catFilter === c ? "mm-cat-pill--on" : ""}`}
                    onClick={() => setCatFilter(c)}>
                    {c}
                    {c !== "All" && (
                      <span>{items.filter(i => i.category === c).length}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mm-toolbar-r">
              <div className="mm-seg">
                {[["all","All"],["available","Live"],["unavailable","Off"]].map(([k,l]) => (
                  <button key={k}
                    className={`mm-seg-btn ${availFilter === k ? "mm-seg-btn--on" : ""}`}
                    onClick={() => setAvailFilter(k)}>
                    {l}
                    <em>{k==="all" ? filtered.length : items.filter(i =>
                      k==="available" ? i.is_available : !i.is_available).length}</em>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ TABLE ═══ */}
          <div className="mm-table-card">
            {loading ? (
              <div className="mm-loading">
                <div className="mm-ring"/>
                <p>Loading menu…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="mm-empty">
                <div className="mm-empty-icon">
                  <svg viewBox="0 0 48 48" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1.5" width="52" height="52">
                    <rect x="6" y="10" width="36" height="28" rx="3"/>
                    <path d="M14 18h20M14 24h14M14 30h8" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="mm-empty-title">No items found</p>
                <p className="mm-empty-sub">Try adjusting your filters or add a new item</p>
                <button className="mm-empty-btn" onClick={openAdd}>+ Add Item</button>
              </div>
            ) : (
              <table className="mm-table">
                <thead>
                  <tr>
                    <th className="mm-th--name" onClick={() => handleSort("name")}>
                      <div className="mm-th-inner">
                        Name
                        <SortChevron col="name" sortCol={sortCol} sortDir={sortDir}/>
                      </div>
                    </th>
                    <th onClick={() => handleSort("category")}>
                      <div className="mm-th-inner">
                        Category
                        <SortChevron col="category" sortCol={sortCol} sortDir={sortDir}/>
                      </div>
                    </th>
                    <th>Type</th>
                    <th onClick={() => handleSort("price")}>
                      <div className="mm-th-inner">
                        Price
                        <SortChevron col="price" sortCol={sortCol} sortDir={sortDir}/>
                      </div>
                    </th>
                    <th className="mm-th--desc">Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`mm-tr ${hoveredRow === item.id ? "mm-tr--hovered" : ""} ${!item.is_available ? "mm-tr--off" : ""}`}
                      onMouseEnter={() => setHoveredRow(item.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ animationDelay: `${Math.min(idx, 12) * 0.025}s` }}
                    >
                      {/* Name */}
                      <td>
                        <div className="mm-cell-name">
                          <span className="mm-name-text">{item.name}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span className="mm-tag mm-tag--cat">{item.category || "—"}</span>
                      </td>

                      {/* Type */}
                      <td>
                        <span className={`mm-tag mm-tag--type ${item.is_veg ? "veg" : "nveg"}`}>
                          <span className="mm-type-circle"/>
                          {item.is_veg ? "Veg" : "Non-Veg"}
                        </span>
                      </td>

                      {/* Price */}
                      <td>
                        <span className="mm-price">
                          <span className="mm-price-sym">₹</span>
                          {parseFloat(item.price || 0).toFixed(0)}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="mm-td--desc">
                        <span className="mm-desc-text">{item.description || <span className="mm-desc-empty">—</span>}</span>
                      </td>

                      {/* Status toggle */}
                      <td>
                        <button
                          className={`mm-toggle ${item.is_available ? "mm-toggle--on" : "mm-toggle--off"}`}
                          onClick={() => toggleAvail(item)}
                          title={item.is_available ? "Click to disable" : "Click to enable"}
                        >
                          <span className="mm-toggle-knob"/>
                          <span className="mm-toggle-label">
                            {item.is_available ? "Live" : "Off"}
                          </span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="mm-row-actions">
                          <button className="mm-btn-edit" onClick={() => openEdit(item)}>
                            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" width="12" height="12">
                              <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" strokeLinejoin="round"/>
                            </svg>
                            Edit
                          </button>
                          <button className="mm-btn-del" onClick={() => setDelConfirm(item)}>
                            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" width="12" height="12">
                              <path d="M2 3.5h10M5.5 3.5V2.5h3v1M3 3.5l.8 8.5h6.4L11 3.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Footer count */}
            {filtered.length > 0 && (
              <div className="mm-table-footer">
                Showing <strong>{filtered.length}</strong> of <strong>{items.length}</strong> items
                {(search || catFilter !== "All" || availFilter !== "all") && (
                  <button className="mm-clear-filters" onClick={() => { setSearch(""); setCatFilter("All"); setAvailFilter("all"); }}>
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══ ADD / EDIT MODAL ═══ */}
      {showForm && (
        <div className="mm-overlay" onClick={() => setShowForm(false)}>
          <div className="mm-modal" onClick={e => e.stopPropagation()}>

            <div className="mm-modal-hd">
              <div className="mm-modal-hd-icon">
                {editItem
                  ? <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><path d="M11 2l3 3-8 8H3V10l8-8z" strokeLinejoin="round"/></svg>
                  : <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><path d="M8 2v12M2 8h12" strokeLinecap="round"/></svg>}
              </div>
              <div>
                <h3>{editItem ? "Edit Item" : "Add New Item"}</h3>
                <p>{editItem ? `Editing "${editItem.name}"` : `Adding to ${selRest?.restaurant_name || selRest?.name}`}</p>
              </div>
              <button className="mm-modal-x" onClick={() => setShowForm(false)}>
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                  <path d="M1 1l12 12M13 1L1 13" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="mm-modal-body">
              <div className="mm-form-grid">
                <div className="mm-field mm-field--wide">
                  <label>Item Name <span>*</span></label>
                  <input className="mm-input" placeholder="e.g. Chicken Biryani"
                    value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}/>
                </div>
                <div className="mm-field">
                  <label>Category <span>*</span></label>
                  <input className="mm-input" placeholder="e.g. Biryani, Starters"
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    list="mm-cats-list"/>
                  <datalist id="mm-cats-list">
                    {categories.filter(c => c !== "All").map(c => <option key={c} value={c}/>)}
                    {["Starter","Main Course","Biryani","Breads","Beverages","Desserts","Sides","Special"].map(c => <option key={c} value={c}/>)}
                  </datalist>
                </div>
                <div className="mm-field">
                  <label>Price (₹) <span>*</span></label>
                  <div className="mm-price-field">
                    <span>₹</span>
                    <input className="mm-input" type="number" placeholder="0"
                      value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}/>
                  </div>
                </div>
              </div>

              <div className="mm-field">
                <label>Description</label>
                <textarea className="mm-input mm-textarea" rows={2}
                  placeholder="Brief description of the dish…"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}/>
              </div>

              <div className="mm-form-row">
                {/* Type selector */}
                <div className="mm-field">
                  <label>Food Type</label>
                  <div className="mm-type-sel">
                    <button
                      className={`mm-type-opt ${form.is_veg ? "mm-type-opt--veg" : ""}`}
                      onClick={() => setForm(p => ({ ...p, is_veg: true }))}>
                      <span className="mm-dot-v"/>Vegetarian
                    </button>
                    <button
                      className={`mm-type-opt ${!form.is_veg ? "mm-type-opt--nveg" : ""}`}
                      onClick={() => setForm(p => ({ ...p, is_veg: false }))}>
                      <span className="mm-dot-nv"/>Non-Vegetarian
                    </button>
                  </div>
                </div>

                {/* Availability */}
                <div className="mm-field">
                  <label>Availability</label>
                  <button
                    className={`mm-avail-toggle ${form.is_available ? "on" : "off"}`}
                    onClick={() => setForm(p => ({ ...p, is_available: !p.is_available }))}>
                    <span className="mm-avail-knob"/>
                    <div>
                      <div className="mm-avail-status">{form.is_available ? "Available" : "Unavailable"}</div>
                      <div className="mm-avail-hint">{form.is_available ? "Customers can order this" : "Hidden from customers"}</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="mm-modal-ft">
              <button className="mm-btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="mm-btn-save" onClick={saveItem} disabled={saving}>
                {saving
                  ? <><span className="mm-spin"/>Saving…</>
                  : editItem ? "Save Changes" : "Add to Menu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DELETE CONFIRM ═══ */}
      {delConfirm && (
        <div className="mm-overlay" onClick={() => setDelConfirm(null)}>
          <div className="mm-modal mm-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="mm-del-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" width="28" height="28">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 11v6M14 11v6" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="mm-del-title">Remove Item?</h3>
            <p className="mm-del-desc">
              <strong>"{delConfirm.name}"</strong> will be permanently removed from your menu. This cannot be undone.
            </p>
            <div className="mm-del-actions">
              <button className="mm-btn-cancel" onClick={() => setDelConfirm(null)}>Keep Item</button>
              <button className="mm-btn-delete" onClick={() => deleteItem(delConfirm)}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SortChevron({ col, sortCol, sortDir }) {
  const active = sortCol === col;
  return (
    <svg viewBox="0 0 10 12" fill="none" width="8" height="9" style={{marginLeft:4,opacity:active?1:.3}}>
      <path d="M5 1v10" stroke={active?"#3B82F6":"#4A6080"} strokeWidth="1.5" strokeLinecap="round"/>
      <path d={sortDir==="asc"&&active ? "M2 4l3-3 3 3" : "M2 8l3 3 3-3"} stroke={active?"#3B82F6":"#4A6080"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}