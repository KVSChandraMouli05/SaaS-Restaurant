import { useState, useEffect, useCallback } from "react";
import "./MenuManagement.css";

const API = "http://localhost:5000";

const CATEGORIES = [
  "Starter", "Main Course", "Breads", "Rice & Biryani",
  "Beverages", "Desserts", "Soups", "Salads", "Sides", "Special"
];

const EMPTY_FORM = {
  name: "", description: "", price: "", category: "Main Course", is_available: true
};

const MenuManagement = () => {
  const [restaurants, setRestaurants]   = useState([]);
  const [selectedRest, setSelectedRest] = useState(null);
  const [menuItems, setMenuItems]       = useState([]);
  const [loading, setLoading]           = useState(false);
  const [restLoading, setRestLoading]   = useState(true);
  const [error, setError]               = useState("");
  const [search, setSearch]             = useState("");
  const [filterCat, setFilterCat]       = useState("All");

  /* modal state */
  const [showModal, setShowModal]       = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [formError, setFormError]       = useState("");
  const [saving, setSaving]             = useState(false);

  /* delete confirm */
  const [deleteId, setDeleteId]         = useState(null);
  const [deleting, setDeleting]         = useState(false);

  /* toggle loading per item */
  const [togglingId, setTogglingId]     = useState(null);

  /* ── always get fresh token ── */
  const getHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`
  });

  /* ── fetch restaurants ── */
  useEffect(() => {
    const fetchRestaurants = async () => {
      setRestLoading(true);
      try {
        const res = await fetch(`${API}/api/restaurants`, { headers: getHeaders() });
        const data = await res.json();
        console.log("Restaurants API response:", data);

        let list = [];
        if (Array.isArray(data))                         list = data;
        else if (Array.isArray(data.restaurants))        list = data.restaurants;
        else if (Array.isArray(data.data))               list = data.data;
        else if (data.data && Array.isArray(data.data.restaurants)) list = data.data.restaurants;

        setRestaurants(list);
        if (list.length > 0) setSelectedRest(list[0]);
      } catch (err) {
        console.error("Fetch restaurants error:", err);
        setError("Failed to load restaurants");
      } finally {
        setRestLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  /* ── fetch menu when restaurant changes ── */
  const fetchMenu = useCallback(async (restId) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/restaurants/${restId}/menu`, { headers: getHeaders() });
      const data = await res.json();
      setMenuItems(data.menu || data.items || (Array.isArray(data) ? data : []));
    } catch {
      setError("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRest) fetchMenu(selectedRest.id);
  }, [selectedRest]);

  /* ── open add modal ── */
  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  };

  /* ── open edit modal ── */
  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description || "",
      price: item.price,
      category: item.category || "Main Course",
      is_available: item.is_available,
    });
    setFormError("");
    setShowModal(true);
  };

  /* ── save (add or edit) ── */
  const handleSave = async () => {
    if (!form.name.trim())     return setFormError("Item name is required");
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0)
      return setFormError("Enter a valid price");

    setSaving(true);
    setFormError("");
    try {
      const url = editItem
        ? `${API}/api/restaurants/${selectedRest.id}/menu/${editItem.id}`
        : `${API}/api/restaurants/${selectedRest.id}/menu`;
      const method = editItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
      });
      const data = await res.json();
      if (!res.ok) return setFormError(data.error || "Failed to save");

      if (editItem) {
        setMenuItems(prev => prev.map(i => i.id === editItem.id ? data.item : i));
      } else {
        setMenuItems(prev => [...prev, data.item]);
      }
      setShowModal(false);
    } catch {
      setFormError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ── toggle availability ── */
  const handleToggle = async (item) => {
    setTogglingId(item.id);
    try {
      const res = await fetch(
        `${API}/api/restaurants/${selectedRest.id}/menu/${item.id}/toggle`,
        { method: "PATCH", headers: getHeaders() }
      );
      const data = await res.json();
      if (res.ok) setMenuItems(prev => prev.map(i => i.id === item.id ? data.item : i));
    } catch {}
    finally { setTogglingId(null); }
  };

  /* ── delete ── */
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(
        `${API}/api/restaurants/${selectedRest.id}/menu/${deleteId}`,
        { method: "DELETE", headers: getHeaders() }
      );
      if (res.ok) setMenuItems(prev => prev.filter(i => i.id !== deleteId));
      setDeleteId(null);
    } catch {}
    finally { setDeleting(false); }
  };

  /* ── filtered items ── */
  const categories = ["All", ...new Set(menuItems.map(i => i.category).filter(Boolean))];
  const filtered = menuItems.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "All" || item.category === filterCat;
    return matchSearch && matchCat;
  });

  /* ── grouped by category ── */
  const grouped = filtered.reduce((acc, item) => {
    const cat = item.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="menu-page">

      {/* ── Background orbs ── */}
      <div className="menu-orb menu-orb-1"></div>
      <div className="menu-orb menu-orb-2"></div>

      {/* ── Page Header ── */}
      <div className="menu-header">
        <div className="menu-header-left">
          <h1 className="menu-title">Menu Management</h1>
          <p className="menu-subtitle">Add and manage food items for your restaurants</p>
        </div>
        <button className="menu-add-btn" onClick={openAdd} disabled={!selectedRest}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
          </svg>
          Add Item
        </button>
      </div>

      {/* ── Restaurant Selector ── */}
      <div className="menu-rest-selector">
        {restLoading ? (
          <div className="menu-rest-loading">Loading restaurants…</div>
        ) : restaurants.length === 0 ? (
          <div className="menu-rest-empty">No restaurants found. Create one first.</div>
        ) : (
          <div className="menu-rest-dropdown-wrap">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" className="menu-rest-dropdown-icon">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm0 4h2v2H7V9zm0 4h2v2H7v-2zm4-8h2v2h-2V5zm0 4h2v2h-2V9zm0 4h2v2h-2v-2z" clipRule="evenodd"/>
            </svg>
            <select
              className="menu-rest-dropdown"
              value={selectedRest?.id || ""}
              onChange={e => {
                const rest = restaurants.find(r => r.id === parseInt(e.target.value));
                if (rest) setSelectedRest(rest);
              }}
            >
              {restaurants.map(r => (
                <option key={r.id} value={r.id}>{r.restaurant_name}</option>
              ))}
            </select>
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" className="menu-rest-chevron">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </div>
        )}
      </div>

      {/* ── Stats bar ── */}
      {selectedRest && !loading && (
        <div className="menu-stats">
          <div className="menu-stat">
            <span className="menu-stat-num">{menuItems.length}</span>
            <span className="menu-stat-label">Total Items</span>
          </div>
          <div className="menu-stat-divider"></div>
          <div className="menu-stat">
            <span className="menu-stat-num" style={{ color: "#10B981" }}>
              {menuItems.filter(i => i.is_available).length}
            </span>
            <span className="menu-stat-label">Available</span>
          </div>
          <div className="menu-stat-divider"></div>
          <div className="menu-stat">
            <span className="menu-stat-num" style={{ color: "#F59E0B" }}>
              {menuItems.filter(i => !i.is_available).length}
            </span>
            <span className="menu-stat-label">Unavailable</span>
          </div>
          <div className="menu-stat-divider"></div>
          <div className="menu-stat">
            <span className="menu-stat-num" style={{ color: "#8B5CF6" }}>
              {new Set(menuItems.map(i => i.category)).size}
            </span>
            <span className="menu-stat-label">Categories</span>
          </div>
        </div>
      )}

      {/* ── Search + Filter ── */}
      {selectedRest && menuItems.length > 0 && (
        <div className="menu-controls">
          <div className="menu-search">
            <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15" className="menu-search-icon">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
            <input
              className="menu-search-input"
              placeholder="Search items…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="menu-cat-filters">
            {categories.map(cat => (
              <button
                key={cat}
                className={`menu-cat-btn ${filterCat === cat ? "menu-cat-btn--active" : ""}`}
                onClick={() => setFilterCat(cat)}
              >{cat}</button>
            ))}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="menu-error">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {error}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="menu-loading">
          <div className="menu-spinner"></div>
          <p>Loading menu…</p>
        </div>
      ) : !selectedRest ? null : menuItems.length === 0 ? (
        <div className="menu-empty">
          <div className="menu-empty-icon">🍽️</div>
          <h3>No menu items yet</h3>
          <p>Start building your menu by adding your first item</p>
          <button className="menu-add-btn" onClick={openAdd}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            Add First Item
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="menu-empty">
          <div className="menu-empty-icon">🔍</div>
          <h3>No items match your search</h3>
          <p>Try a different search term or category</p>
          <button className="menu-cat-btn menu-cat-btn--active"
            onClick={() => { setSearch(""); setFilterCat("All"); }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="menu-groups">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="menu-group">
              <div className="menu-group-header">
                <span className="menu-group-title">{cat}</span>
                <span className="menu-group-count">{items.length} item{items.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="menu-grid">
                {items.map(item => (
                  <div key={item.id} className={`menu-card ${!item.is_available ? "menu-card--unavailable" : ""}`}>
                    <div className="menu-card-top">
                      <div className="menu-card-info">
                        <h3 className="menu-card-name">{item.name}</h3>
                        {item.description && (
                          <p className="menu-card-desc">{item.description}</p>
                        )}
                      </div>
                      <div className="menu-card-price">
                        ₹{parseFloat(item.price).toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div className="menu-card-bottom">
                      <button
                        className={`menu-toggle ${item.is_available ? "menu-toggle--on" : "menu-toggle--off"}`}
                        onClick={() => handleToggle(item)}
                        disabled={togglingId === item.id}
                        title={item.is_available ? "Mark unavailable" : "Mark available"}
                      >
                        {togglingId === item.id ? (
                          <span className="menu-toggle-spinner"></span>
                        ) : (
                          <span className="menu-toggle-knob"></span>
                        )}
                      </button>
                      <span className={`menu-avail-label ${item.is_available ? "menu-avail-label--on" : "menu-avail-label--off"}`}>
                        {item.is_available ? "Available" : "Unavailable"}
                      </span>

                      <div className="menu-card-actions">
                        <button className="menu-action-btn menu-action-btn--edit" onClick={() => openEdit(item)}>
                          <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                          </svg>
                          Edit
                        </button>
                        <button className="menu-action-btn menu-action-btn--delete" onClick={() => setDeleteId(item.id)}>
                          <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="menu-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="menu-modal" onClick={e => e.stopPropagation()}>
            <div className="menu-modal-header">
              <h2 className="menu-modal-title">
                {editItem ? "Edit Item" : "Add Menu Item"}
              </h2>
              <button className="menu-modal-close" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>

            <div className="menu-modal-body">
              <div className="menu-field">
                <label className="menu-label">Item Name <span className="menu-required">*</span></label>
                <input
                  className="menu-input"
                  placeholder="e.g. Butter Chicken"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="menu-field">
                <label className="menu-label">Description <span className="menu-optional">(optional)</span></label>
                <textarea
                  className="menu-input menu-textarea"
                  placeholder="Brief description of the dish…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="menu-field-row">
                <div className="menu-field">
                  <label className="menu-label">Price (₹) <span className="menu-required">*</span></label>
                  <div className="menu-price-wrap">
                    <span className="menu-price-symbol">₹</span>
                    <input
                      className="menu-input menu-input--price"
                      type="number"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="menu-field">
                  <label className="menu-label">Category</label>
                  <select
                    className="menu-input menu-select"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="menu-field menu-field--inline">
                <label className="menu-label">Available right now</label>
                <button
                  type="button"
                  className={`menu-toggle menu-toggle--large ${form.is_available ? "menu-toggle--on" : "menu-toggle--off"}`}
                  onClick={() => setForm(f => ({ ...f, is_available: !f.is_available }))}
                >
                  <span className="menu-toggle-knob"></span>
                </button>
                <span className={`menu-avail-label ${form.is_available ? "menu-avail-label--on" : "menu-avail-label--off"}`}>
                  {form.is_available ? "Available" : "Unavailable"}
                </span>
              </div>

              {formError && <p className="menu-form-error">{formError}</p>}
            </div>

            <div className="menu-modal-footer">
              <button className="menu-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="menu-save-btn" onClick={handleSave} disabled={saving}>
                {saving
                  ? <><span className="menu-btn-spinner"></span> Saving…</>
                  : editItem ? "Save Changes" : "Add Item"
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteId && (
        <div className="menu-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="menu-modal menu-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="menu-delete-icon">🗑️</div>
            <h3 className="menu-delete-title">Delete Item?</h3>
            <p className="menu-delete-desc">This action cannot be undone.</p>
            <div className="menu-modal-footer">
              <button className="menu-cancel-btn" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="menu-delete-btn" onClick={handleDelete} disabled={deleting}>
                {deleting
                  ? <><span className="menu-btn-spinner"></span> Deleting…</>
                  : "Yes, Delete"
                }
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MenuManagement;