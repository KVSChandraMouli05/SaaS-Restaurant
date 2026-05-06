import { useEffect, useState } from "react";
import "./Restaurants.css";

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [search, setSearch]           = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({ restaurant_name: "", location: "", phone: "", email: "" });

  useEffect(() => {
    fetchRestaurants();
    fetchSubscription();
  }, []);

  /* ── FETCH ── */
  const fetchRestaurants = async () => {
    try {
      const res  = await fetch("https://backend-1wnt.onrender.com/api/restaurants", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "success") {
        let list = [];
        if (Array.isArray(data.data)) list = data.data;
        else if (Array.isArray(data.data?.restaurants)) list = data.data.restaurants;
        else if (Array.isArray(data.restaurants)) list = data.restaurants;
        setRestaurants(list);
      }
    } catch (err) {
      console.error("Failed to fetch restaurants:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const res  = await fetch("https://backend-1wnt.onrender.com/api/subscription/current", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "success") setSubscription(data.data);
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
    }
  };

  /* ── ADD ── */
  const handleAdd = async (e) => {
    e.preventDefault();
    if (subscription && restaurants.length >= subscription.restaurant_limit) {
      alert(`You've reached your limit of ${subscription.restaurant_limit} restaurant(s). Upgrade your plan!`);
      return;
    }
    setSubmitting(true);
    try {
      const res  = await fetch("https://backend-1wnt.onrender.com/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.status === "success") { fetchRestaurants(); closeModal(); }
      else alert(data.message);
    } catch (err) {
      alert("Failed to add restaurant");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── UPDATE ── */
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res  = await fetch(`https://backend-1wnt.onrender.com/api/restaurants/${editingRestaurant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.status === "success") { fetchRestaurants(); closeModal(); }
      else alert(data.message);
    } catch (err) {
      alert("Failed to update restaurant");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── DELETE ── */
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res  = await fetch(`https://backend-1wnt.onrender.com/api/restaurants/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "success") fetchRestaurants();
      else alert(data.message);
    } catch (err) {
      alert("Failed to delete restaurant");
    }
  };

  /* ── MODAL ── */
  const openAddModal = () => {
    setFormData({ restaurant_name: "", location: "", phone: "", email: "" });
    setEditingRestaurant(null);
    setShowAddModal(true);
  };

  const openEditModal = (r) => {
    setFormData({ restaurant_name: r.restaurant_name || r.name, location: r.location || "", phone: r.phone || "", email: r.email || "" });
    setEditingRestaurant(r);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingRestaurant(null);
    setFormData({ restaurant_name: "", location: "", phone: "", email: "" });
  };

  const canAddMore   = subscription ? restaurants.length < subscription.restaurant_limit : true;
  const limitReached = subscription && restaurants.length >= subscription.restaurant_limit;

  // Filtered list
  const filtered = restaurants.filter(r =>
    ( r.restaurant_name || r.name )?.toLowerCase().includes(search.toLowerCase()) ||
    r.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rest-page">

      {/* ── Page Header ── */}
      <div className="rest-header">
        <div className="rest-header-left">
          <h1 className="rest-title">Restaurants</h1>
          <p className="rest-subtitle">
            Manage your restaurant network
            {subscription && (
              <span className="rest-limit-badge">
                {restaurants.length}/{subscription.restaurant_limit} used
              </span>
            )}
          </p>
        </div>
        <button
          className={`rest-add-btn ${!canAddMore ? "rest-add-btn--disabled" : ""}`}
          onClick={openAddModal}
          disabled={!canAddMore}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
          </svg>
          Add Restaurant
        </button>
      </div>

      {/* ── Search bar ── */}
      {restaurants.length > 0 && (
        <div className="rest-search-wrap">
          <div className="rest-search">
            <svg viewBox="0 0 20 20" fill="currentColor" className="rest-search-icon">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
            <input
              className="rest-search-input"
              placeholder="Search restaurants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="rest-search-clear" onClick={() => setSearch("")}>×</button>
            )}
          </div>
          <span className="rest-count">{filtered.length} restaurant{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      )}

      {/* ── Content ── */}
      <main className="rest-main">
        {loading ? (
          <div className="rest-loading">
            <div className="rest-spinner"></div>
            <p>Loading restaurants...</p>
          </div>

        ) : restaurants.length === 0 ? (
          <div className="rest-empty">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <h2>No Restaurants Yet</h2>
            <p>Add your first restaurant to get started managing your network.</p>
            <button className="rest-empty-btn" onClick={openAddModal}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
              </svg>
              Add Your First Restaurant
            </button>
          </div>

        ) : filtered.length === 0 ? (
          <div className="rest-empty">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <h2>No Results</h2>
            <p>No restaurants match "<strong>{search}</strong>"</p>
            <button className="rest-empty-btn" onClick={() => setSearch("")}>Clear Search</button>
          </div>

        ) : (
          <div className="rest-grid">
            {filtered.map((r, i) => (
              <RestaurantCard
                key={r.id}
                restaurant={r}
                index={i}
                onEdit={() => openEditModal(r)}
                onDelete={() => handleDelete(r.id, r.restaurant_name || r.name)}
              />
            ))}
          </div>
        )}

        {/* Limit Warning */}
        {limitReached && (
          <div className="rest-limit-warning">
            <div className="warning-icon">
              <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <strong>Restaurant Limit Reached</strong>
              <p>
                You've used all {subscription.restaurant_limit} restaurant slots.{" "}
                <button className="warning-upgrade-link" onClick={() => window.location.href = "/subscription"}>
                  Upgrade your plan
                </button>{" "}
                to add more.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ── Add/Edit Modal ── */}
      {showAddModal && (
        <div className="rest-modal-overlay" onClick={closeModal}>
          <div className="rest-modal" onClick={(e) => e.stopPropagation()}>

            <div className="rest-modal-header">
              <div>
                <h2>{editingRestaurant ? "Edit Restaurant" : "Add New Restaurant"}</h2>
                <p>{editingRestaurant ? `Editing ${editingRestaurant.name}` : "Fill in the details below"}</p>
              </div>
              <button className="rest-modal-close" onClick={closeModal} title="Close">
                <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>

            <form onSubmit={editingRestaurant ? handleUpdate : handleAdd} className="rest-form">

              <div className="rest-form-group">
                <label className="rest-form-label">
                  Restaurant Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="rest-form-input"
                  placeholder="e.g., The Grand Kitchen"
                  value={formData.restaurant_name}
                  onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="rest-form-group">
                <label className="rest-form-label">Location</label>
                <input
                  type="text"
                  className="rest-form-input"
                  placeholder="City, State (e.g. Vijayawada, Andhra Pradesh)"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="rest-form-row">
                <div className="rest-form-group">
                  <label className="rest-form-label">Phone</label>
                  <input
                    type="tel"
                    className="rest-form-input"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="rest-form-group">
                  <label className="rest-form-label">Email</label>
                  <input
                    type="email"
                    className="rest-form-input"
                    placeholder="restaurant@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="rest-form-actions">
                <button type="button" className="rest-cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="rest-submit-btn" disabled={submitting}>
                  {submitting ? (
                    <span className="btn-spinner"></span>
                  ) : (
                    editingRestaurant ? "Update Restaurant" : "Add Restaurant"
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

/* ── Restaurant Card Component ── */
function RestaurantCard({ restaurant: r, index, onEdit, onDelete }) {
  return (
    <div className="rest-card" style={{ animationDelay: `${index * 0.06}s` }}>

      <div className="rest-card-top">
        <div className="rest-card-icon">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm0 4h2v2H7V9zm0 4h2v2H7v-2zm4-8h2v2h-2V5zm0 4h2v2h-2V9zm0 4h2v2h-2v-2z" clipRule="evenodd"/>
          </svg>
        </div>
        <span className={`rest-status ${r.status === "inactive" ? "rest-status--inactive" : ""}`}>
          {r.status === "inactive" ? "Inactive" : "Active"}
        </span>
      </div>

      <h3 className="rest-card-name">{r.restaurant_name || r.name}</h3>

      <div className="rest-card-details">
        {r.location && (
          <div className="rest-detail">
            <svg viewBox="0 0 20 20" fill="currentColor" className="detail-icon">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
            </svg>
            <span>{r.location}</span>
          </div>
        )}
        {r.phone && (
          <div className="rest-detail">
            <svg viewBox="0 0 20 20" fill="currentColor" className="detail-icon">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
            </svg>
            <span>{r.phone}</span>
          </div>
        )}
        {r.email && (
          <div className="rest-detail">
            <svg viewBox="0 0 20 20" fill="currentColor" className="detail-icon">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
            </svg>
            <span>{r.email}</span>
          </div>
        )}
      </div>

      <div className="rest-card-footer">
        <span className="rest-date">
          {r.created_at
            ? `Added ${new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
            : ""}
        </span>
        <div className="rest-card-actions">
          <button className="rest-edit-btn" onClick={onEdit} title="Edit">
            <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
            </svg>
            Edit
          </button>
          <button className="rest-delete-btn" onClick={onDelete} title="Delete">
            <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            Delete
          </button>
        </div>
      </div>

    </div>
  );
}