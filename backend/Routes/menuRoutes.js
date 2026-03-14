const express = require("express");
const router = express.Router();
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

/* ─────────────────────────────────────────
   HELPER — verify restaurant belongs to user
───────────────────────────────────────── */
const verifyOwner = async (restaurantId, userId) => {
  const result = await pool.query(
    "SELECT id FROM restaurants WHERE id = $1 AND user_id = $2",
    [restaurantId, userId]
  );
  return result.rows.length > 0;
};

/* ─────────────────────────────────────────
   GET /api/restaurants/:id/menu
───────────────────────────────────────── */
router.get("/:id/menu", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const owned = await verifyOwner(id, req.user.id);
    if (!owned) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query(
      "SELECT * FROM menu_items WHERE restaurant_id = $1 ORDER BY category, name",
      [id]
    );
    res.json({ menu: result.rows });
  } catch (err) {
    console.error("GET menu error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ─────────────────────────────────────────
   POST /api/restaurants/:id/menu
───────────────────────────────────────── */
router.post("/:id/menu", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, is_available } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: "Name and price are required" });
    }

    const owned = await verifyOwner(id, req.user.id);
    if (!owned) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query(
      `INSERT INTO menu_items (restaurant_id, name, description, price, category, is_available)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, name.trim(), description?.trim() || null, parseFloat(price),
       category?.trim() || "Main Course", is_available !== undefined ? is_available : true]
    );
    res.status(201).json({ item: result.rows[0] });
  } catch (err) {
    console.error("POST menu error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ─────────────────────────────────────────
   PUT /api/restaurants/:id/menu/:itemId
───────────────────────────────────────── */
router.put("/:id/menu/:itemId", authenticateToken, async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { name, description, price, category, is_available } = req.body;

    const owned = await verifyOwner(id, req.user.id);
    if (!owned) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query(
      `UPDATE menu_items
       SET name=$1, description=$2, price=$3, category=$4, is_available=$5, updated_at=NOW()
       WHERE id=$6 AND restaurant_id=$7 RETURNING *`,
      [name.trim(), description?.trim() || null, parseFloat(price),
       category?.trim() || "Main Course", is_available, itemId, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Item not found" });

    res.json({ item: result.rows[0] });
  } catch (err) {
    console.error("PUT menu error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ─────────────────────────────────────────
   PATCH /api/restaurants/:id/menu/:itemId/toggle
───────────────────────────────────────── */
router.patch("/:id/menu/:itemId/toggle", authenticateToken, async (req, res) => {
  try {
    const { id, itemId } = req.params;

    const owned = await verifyOwner(id, req.user.id);
    if (!owned) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query(
      `UPDATE menu_items SET is_available = NOT is_available, updated_at=NOW()
       WHERE id=$1 AND restaurant_id=$2 RETURNING *`,
      [itemId, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Item not found" });

    res.json({ item: result.rows[0] });
  } catch (err) {
    console.error("PATCH toggle error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ─────────────────────────────────────────
   DELETE /api/restaurants/:id/menu/:itemId
───────────────────────────────────────── */
router.delete("/:id/menu/:itemId", authenticateToken, async (req, res) => {
  try {
    const { id, itemId } = req.params;

    const owned = await verifyOwner(id, req.user.id);
    if (!owned) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query(
      "DELETE FROM menu_items WHERE id=$1 AND restaurant_id=$2 RETURNING id",
      [itemId, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Item not found" });

    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error("DELETE menu error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;