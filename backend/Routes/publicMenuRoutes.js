const express = require("express");
const router  = express.Router();
const db      = require("../db");

/* ─────────────────────────────────────────────
   GET /api/public/menu/:restaurantId
   Public — no auth required
───────────────────────────────────────────── */
router.get("/menu/:restaurantId", async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const restResult = await db.query(
      "SELECT id, restaurant_name, cuisine_type, description FROM restaurants WHERE id = $1 AND is_active = true",
      [restaurantId]
    );

    if (restResult.rows.length === 0) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const menuResult = await db.query(
      "SELECT * FROM menu_items WHERE restaurant_id = $1 AND is_available = true ORDER BY category, name",
      [restaurantId]
    );

    res.json({
      restaurant: restResult.rows[0],
      menu: menuResult.rows,
    });
  } catch (err) {
    console.error("GET public menu error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ─────────────────────────────────────────────
   POST /api/public/orders/:restaurantId
   Public — no auth required
───────────────────────────────────────────── */
router.post("/orders/:restaurantId", async (req, res) => {
  const { restaurantId } = req.params;
  const { customer_name, customer_phone, special_instructions, order_items, total_amount } = req.body;

  if (!customer_name || !order_items || !total_amount) {
    return res.status(400).json({
      status: "error",
      message: "customer_name, order_items, and total_amount are required",
    });
  }

  try {
    const restCheck = await db.query(
      "SELECT id FROM restaurants WHERE id = $1 AND is_active = true",
      [restaurantId]
    );
    if (restCheck.rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Restaurant not found" });
    }

    const result = await db.query(
      `INSERT INTO orders
        (restaurant_id, customer_name, customer_phone, order_items, total_amount, special_instructions, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
       RETURNING *`,
      [
        restaurantId,
        customer_name.trim(),
        customer_phone || null,
        JSON.stringify(order_items),
        total_amount,
        special_instructions || null,
      ]
    );

    res.status(201).json({ status: "success", data: result.rows[0] });
  } catch (err) {
    console.error("POST public order error:", err);
    res.status(500).json({ status: "error", message: "Failed to place order" });
  }
});

module.exports = router;