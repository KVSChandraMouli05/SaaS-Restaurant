import { useEffect, useState, useRef, useCallback } from "react";
import "./CustomerMenu.css";

const BASE = "https://backend-1wnt.onrender.com";

export default function CustomerMenu() {
  const restaurantId = window.location.pathname.split("/menu/")[1]?.split("/")[0];

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems,  setMenuItems]  = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab,  setActiveTab]  = useState("All");
  const [cart,       setCart]       = useState({});
  const [cartOpen,   setCartOpen]   = useState(false);
  const [orderDone,  setOrderDone]  = useState(false);
  const [finalTotal, setFinalTotal] = useState(0);
  const [info,       setInfo]       = useState({ name:"", phone:"", email:"" });
  const [note,       setNote]       = useState("");
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(true);
  const sidebarRef = useRef(null);

  useEffect(() => { fetchMenu(); }, []);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/api/public/menu/${restaurantId}`);
      const data = await res.json();
      const rest  = data.restaurant ?? data.data?.restaurant ?? null;
      const items = data.menu ?? data.data?.menu ?? data.menuItems ??
                    data.data?.menuItems ?? data.items ?? data.data?.items ??
                    (Array.isArray(data.data) ? data.data : []);
      setRestaurant(rest);
      const arr = Array.isArray(items) ? items : [];
      setMenuItems(arr);
      setCategories(["All", ...new Set(arr.map(i => i.category).filter(Boolean))]);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const addItem = useCallback(item =>
    setCart(c => ({ ...c, [item.id]: (c[item.id]||0)+1 })), []);
  const decItem = useCallback(item =>
    setCart(c => {
      const n = {...c};
      if ((n[item.id]||0) > 1) n[item.id]--;
      else delete n[item.id];
      return n;
    }), []);

  const cartItems = menuItems.filter(i => cart[i.id] > 0);
  const cartTotal = cartItems.reduce((s,i) => s + parseFloat(i.price)*cart[i.id], 0);
  const cartCount = Object.values(cart).reduce((s,n) => s+n, 0);

  const placeOrder = async () => {
    if (!info.name.trim() || !info.phone.trim()) { alert("Please enter name and phone."); return; }
    try {
      const res = await fetch(`${BASE}/api/public/orders/${restaurantId}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          customer_name: info.name, customer_phone: info.phone, customer_email: info.email,
          order_items: cartItems.map(i=>({ id:i.id, name:i.name, price:parseFloat(i.price), quantity:cart[i.id] })),
          total_amount: cartTotal, special_instructions: note,
        }),
      });
      const d = await res.json();
      if (d.status==="success") { setFinalTotal(cartTotal); setCart({}); setCartOpen(false); setOrderDone(true); }
      else alert(d.message||"Order failed.");
    } catch { alert("Network error. Try again."); }
  };

  const filtered = menuItems.filter(i => {
    const catOk = activeTab==="All" || i.category===activeTab;
    const srOk  = !search || i.name.toLowerCase().includes(search.toLowerCase());
    return catOk && srOk;
  });

  const groups = filtered.reduce((acc, item) => {
    const c = item.category || "Other";
    (acc[c] = acc[c]||[]).push(item);
    return acc;
  }, {});

  const rName = restaurant?.restaurant_name ?? restaurant?.name ?? "Restaurant";
  const rCuisine = restaurant?.cuisine_type ?? "Multi-cuisine";

  const scrollToCategory = (cat) => {
    setActiveTab(cat);
    if (cat !== "All") {
      setTimeout(() => {
        document.getElementById(`sec-${cat}`)?.scrollIntoView({ behavior:"smooth", block:"start" });
      }, 50);
    }
  };

  // ── SUCCESS ──
  if (orderDone) return (
    <div className="cm-success-wrap">
      <div className="cm-success-card">
        <div className="cm-success-anim">
          <div className="cm-success-ring r1"/><div className="cm-success-ring r2"/>
          <svg viewBox="0 0 44 44" fill="none" width="44" height="44" className="cm-check">
            <path d="M10 22l9 9 15-15" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2>Order Confirmed!</h2>
        <p>Thank you <strong>{info.name}</strong>! Your order from <strong>{rName}</strong> is being prepared.</p>
        <div className="cm-success-amt">₹{finalTotal.toLocaleString("en-IN")}</div>
        <div className="cm-success-meta">
          <span>🕐 20–30 min delivery</span>
          <span>📞 We'll call if needed</span>
        </div>
        <button onClick={() => { setOrderDone(false); setInfo({name:"",phone:"",email:""}); }}>
          Order More Items
        </button>
      </div>
    </div>
  );

  // ── LOADING ──
  if (loading) return (
    <div className="cm-loading-wrap">
      <div className="cm-loading-logo">🍽️</div>
      <div className="cm-loading-bar"><div className="cm-loading-fill"/></div>
      <p>Loading menu…</p>
    </div>
  );

  return (
    <div className="cm-root">

      {/* ══════ FULL-WIDTH TOP BANNER ══════ */}
      <div className="cm-banner">
        <div className="cm-banner-bg"/>
        <div className="cm-banner-content">
          {/* LEFT: restaurant info */}
          <div className="cm-banner-info">
            <div className="cm-banner-logo">{rName[0]?.toUpperCase()}</div>
            <div>
              <div className="cm-banner-tag">RESTAURANT MENU</div>
              <h1 className="cm-banner-name">{rName}</h1>
              <p className="cm-banner-cuisine">{rCuisine} · Fresh Ingredients · Made to Order</p>
              <div className="cm-banner-chips">
                <span className="cm-bchip bchip-green">
                  <span className="cm-live-dot"/>Open Now
                </span>
                <span className="cm-bchip">
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="11" height="11">
                    <circle cx="7" cy="7" r="5.5"/><path d="M7 4.5V7l1.5 1.5" strokeLinecap="round"/>
                  </svg>
                  20–30 min
                </span>
                <span className="cm-bchip">
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="11" height="11">
                    <path d="M1 11l2-5h8l2 5H1z"/><path d="M4 6V4a3 3 0 016 0v2"/>
                  </svg>
                  {menuItems.length} dishes
                </span>
                <span className="cm-bchip bchip-orange">⚡ Free Delivery</span>
              </div>
            </div>
          </div>
          {/* RIGHT: stats */}
          <div className="cm-banner-stats">
            <div className="cm-stat-box">
              <strong>4.5 ★</strong><span>Rating</span>
            </div>
            <div className="cm-stat-sep"/>
            <div className="cm-stat-box">
              <strong>{menuItems.length}+</strong><span>Dishes</span>
            </div>
            <div className="cm-stat-sep"/>
            <div className="cm-stat-box">
              <strong>Free</strong><span>Delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ STICKY SEARCH + TABS ══════ */}
      <div className="cm-nav-sticky">
        <div className="cm-nav-inner">
          <div className="cm-search-box">
            <svg viewBox="0 0 18 18" fill="none" stroke="#9CA3AF" strokeWidth="1.7" width="14" height="14">
              <circle cx="7.5" cy="7.5" r="5.5"/><path d="M14 14l-3-3" strokeLinecap="round"/>
            </svg>
            <input placeholder="Search dishes, categories…" value={search} onChange={e=>setSearch(e.target.value)}/>
            {search && <button onClick={()=>setSearch("")} className="cm-sx">✕</button>}
          </div>
          <div className="cm-tabs-row">
            {categories.map(c => (
              <button key={c} className={`cm-tab ${activeTab===c?"cm-tab-on":""}`} onClick={()=>scrollToCategory(c)}>
                {c}
                {c!=="All" && <span>{menuItems.filter(i=>i.category===c).length}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════ MAIN LAYOUT: LEFT SIDEBAR + CONTENT + RIGHT CART ══════ */}
      <div className="cm-layout">

        {/* LEFT SIDEBAR — Category nav */}
        <aside className="cm-sidebar" ref={sidebarRef}>
          <div className="cm-sidebar-sticky">
            <p className="cm-sidebar-title">CATEGORIES</p>
            {categories.map(c => (
              <button
                key={c}
                className={`cm-side-item ${activeTab===c?"cm-side-item-on":""}`}
                onClick={()=>scrollToCategory(c)}>
                <span className="cm-side-dot"/>
                <span className="cm-side-label">{c}</span>
                <span className="cm-side-n">{c==="All" ? menuItems.length : menuItems.filter(i=>i.category===c).length}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* CENTER — Menu items */}
        <main className="cm-main">
          {Object.keys(groups).length === 0 ? (
            <div className="cm-empty">
              <svg viewBox="0 0 64 64" fill="none" stroke="#D1D5DB" strokeWidth="1.5" width="56" height="56">
                <circle cx="32" cy="32" r="26"/>
                <path d="M22 32h20M32 22v20" strokeLinecap="round" opacity=".5"/>
              </svg>
              <p>{search ? `No results for "${search}"` : "No items available"}</p>
            </div>
          ) : (
            Object.entries(groups).map(([cat, items]) => (
              <section key={cat} id={`sec-${cat}`} className="cm-section">
                <div className="cm-sec-hd">
                  <h2>{cat}</h2>
                  <span>{items.length} items</span>
                </div>
                <div className="cm-cards-grid">
                  {items.map((item, i) => (
                    <DishCard
                      key={item.id} item={item}
                      qty={cart[item.id]||0}
                      onAdd={()=>addItem(item)}
                      onDec={()=>decItem(item)}
                      idx={i}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
          <div style={{height:40}}/>
        </main>

        {/* RIGHT SIDEBAR — Cart (desktop) */}
        <aside className="cm-cart-sidebar">
          <div className="cm-cart-sticky">
            <div className="cm-cart-hd">
              <h3>Your Order</h3>
              {cartCount > 0 && <span className="cm-cart-badge">{cartCount}</span>}
            </div>

            {cartCount === 0 ? (
              <div className="cm-cart-empty">
                <svg viewBox="0 0 48 48" fill="none" stroke="#D1D5DB" strokeWidth="1.5" width="44" height="44">
                  <circle cx="24" cy="24" r="20"/>
                  <path d="M16 24h16M24 16v16" strokeLinecap="round" opacity=".4"/>
                </svg>
                <p>Your cart is empty</p>
                <span>Add items from the menu to get started</span>
              </div>
            ) : (
              <>
                <div className="cm-cart-items">
                  {cartItems.map(item => (
                    <div key={item.id} className="cm-ci">
                      <div className="cm-ci-left">
                        <span className={`cm-ci-dot ${item.is_veg?"veg":"nveg"}`}/>
                        <div>
                          <div className="cm-ci-name">{item.name}</div>
                          <div className="cm-ci-price">₹{parseFloat(item.price).toFixed(0)}</div>
                        </div>
                      </div>
                      <div className="cm-ci-right">
                        <div className="cm-ci-ctrl">
                          <button onClick={()=>decItem(item)}>−</button>
                          <span>{cart[item.id]}</span>
                          <button onClick={()=>addItem(item)}>+</button>
                        </div>
                        <span className="cm-ci-total">
                          ₹{(parseFloat(item.price)*cart[item.id]).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cm-cart-bill">
                  <div className="cm-bill-row"><span>Item total</span><span>₹{cartTotal.toLocaleString("en-IN")}</span></div>
                  <div className="cm-bill-row"><span>Delivery fee</span><span className="green">FREE</span></div>
                  <div className="cm-bill-sep"/>
                  <div className="cm-bill-row total"><span>To pay</span><span>₹{cartTotal.toLocaleString("en-IN")}</span></div>
                </div>

                <button className="cm-checkout-btn" onClick={()=>setCartOpen(true)}>
                  Proceed to Checkout
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" width="12" height="12">
                    <path d="M2 7h10M7 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* ══════ MOBILE FAB ══════ */}
      {cartCount > 0 && !cartOpen && (
        <button className="cm-fab" onClick={()=>setCartOpen(true)}>
          <div className="cm-fab-l">
            <span className="cm-fab-badge">{cartCount}</span>
            <span>View Order</span>
          </div>
          <div className="cm-fab-r">
            <strong>₹{cartTotal.toLocaleString("en-IN")}</strong>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" width="12" height="12">
              <path d="M2 7h10M7 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>
      )}

      {/* ══════ CHECKOUT MODAL ══════ */}
      {cartOpen && (
        <div className="cm-modal-overlay" onClick={()=>setCartOpen(false)}>
          <div className="cm-modal" onClick={e=>e.stopPropagation()}>
            <div className="cm-modal-hd">
              <div>
                <h3>Complete Your Order</h3>
                <p>{rName} · {cartCount} items · ₹{cartTotal.toLocaleString("en-IN")}</p>
              </div>
              <button className="cm-modal-close" onClick={()=>setCartOpen(false)}>✕</button>
            </div>

            <div className="cm-modal-body">
              {/* Order summary */}
              <div className="cm-modal-section">
                <p className="cm-modal-label">ORDER SUMMARY</p>
                {cartItems.map(item => (
                  <div key={item.id} className="cm-modal-item">
                    <span className={`cm-dot2 ${item.is_veg?"veg":"nveg"}`}/>
                    <span className="cm-mi-name">{item.name} × {cart[item.id]}</span>
                    <span className="cm-mi-amt">₹{(parseFloat(item.price)*cart[item.id]).toLocaleString("en-IN")}</span>
                  </div>
                ))}
                <div className="cm-modal-total">
                  <span>Total</span>
                  <span>₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Customer details */}
              <div className="cm-modal-section">
                <p className="cm-modal-label">YOUR DETAILS</p>
                <div className="cm-modal-2col">
                  <div className="cm-field-wrap">
                    <label>Full Name *</label>
                    <input className="cm-field" placeholder="Enter your name" value={info.name}
                      onChange={e=>setInfo(p=>({...p,name:e.target.value}))}/>
                  </div>
                  <div className="cm-field-wrap">
                    <label>Phone Number *</label>
                    <input className="cm-field" placeholder="10-digit number" value={info.phone}
                      onChange={e=>setInfo(p=>({...p,phone:e.target.value}))}/>
                  </div>
                </div>
                <div className="cm-field-wrap">
                  <label>Email Address</label>
                  <input className="cm-field" placeholder="optional" value={info.email}
                    onChange={e=>setInfo(p=>({...p,email:e.target.value}))}/>
                </div>
                <div className="cm-field-wrap">
                  <label>Special Instructions</label>
                  <textarea className="cm-field cm-field-ta" placeholder="Allergies, preferences, notes…"
                    value={note} onChange={e=>setNote(e.target.value)} rows={2}/>
                </div>
              </div>
            </div>

            <div className="cm-modal-ft">
              <div className="cm-modal-ft-total">
                <span>Total Amount</span>
                <strong>₹{cartTotal.toLocaleString("en-IN")}</strong>
              </div>
              <button className="cm-place-btn" onClick={placeOrder}>
                Place Order
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" width="13" height="13">
                  <path d="M2 7h10M7 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════ DISH CARD ══════ */
function DishCard({ item, qty, onAdd, onDec, idx }) {
  const [vis, setVis] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold: 0.05 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const price = parseFloat(item.price);
  const isVeg = item.is_veg;

  return (
    <div ref={ref}
      className={`cm-card ${vis?"vis":""} ${qty>0?"selected":""}`}
      style={{ transitionDelay:`${Math.min(idx,6)*0.04}s` }}>

      <div className="cm-card-body">
        <div className="cm-card-meta">
          <span className={`cm-vegbadge ${isVeg?"veg":"nveg"}`}>
            <span/>{isVeg ? "VEG" : "NON-VEG"}
          </span>
          {qty > 0 && <span className="cm-in-cart-badge">{qty} in cart</span>}
        </div>
        <h3 className="cm-card-name">{item.name}</h3>
        {item.description && <p className="cm-card-desc">{item.description}</p>}
        <div className="cm-card-foot">
          <div className="cm-card-price">
            <span>₹</span><strong>{price%1===0?price.toFixed(0):price.toFixed(2)}</strong>
          </div>
          {qty===0 ? (
            <button className="cm-btn-add" onClick={onAdd}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" width="12" height="12">
                <path d="M7 2v10M2 7h10" strokeLinecap="round"/>
              </svg>
              Add
            </button>
          ) : (
            <div className="cm-qty-ctrl">
              <button onClick={onDec}>−</button>
              <span>{qty}</span>
              <button onClick={onAdd}>+</button>
            </div>
          )}
        </div>
      </div>
      {qty > 0 && <div className="cm-card-selected-line"/>}
    </div>
  );
}