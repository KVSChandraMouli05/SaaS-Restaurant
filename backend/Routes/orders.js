const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT o.*, r.restaurant_name FROM orders o JOIN restaurants r ON o.restaurant_id = r.id WHERE r.user_id = $1 ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json({ status: "success", data: result.rows });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Failed to fetch orders" });
  }
});

router.get("/:restaurantId/orders", async (req, res) => {
  const { restaurantId } = req.params;
  try {
    const ownerCheck = await db.query("SELECT id FROM restaurants WHERE id = $1 AND user_id = $2", [restaurantId, req.user.id]);
    if (ownerCheck.rows.length === 0) return res.status(403).json({ status: "error", message: "Access denied" });
    const result = await db.query(
      `SELECT o.*, r.restaurant_name FROM orders o JOIN restaurants r ON o.restaurant_id = r.id WHERE o.restaurant_id = $1 ORDER BY o.created_at DESC`,
      [restaurantId]
    );
    res.json({ status: "success", data: result.rows });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Failed to fetch orders" });
  }
});

router.put("/:restaurantId/orders/:orderId", async (req, res) => {
  const { restaurantId, orderId } = req.params;
  const { status } = req.body;
  const allowed = ["pending", "processing", "completed", "cancelled"];
  if (!allowed.includes(status)) return res.status(400).json({ status: "error", message: "Invalid status" });
  try {
    const ownerCheck = await db.query("SELECT id FROM restaurants WHERE id = $1 AND user_id = $2", [restaurantId, req.user.id]);
    if (ownerCheck.rows.length === 0) return res.status(403).json({ status: "error", message: "Access denied" });
    const result = await db.query("UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 AND restaurant_id = $3 RETURNING *", [status, orderId, restaurantId]);
    if (result.rows.length === 0) return res.status(404).json({ status: "error", message: "Order not found" });
    res.json({ status: "success", data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Failed to update order" });
  }
});

router.delete("/:restaurantId/orders/:orderId", async (req, res) => {
  const { restaurantId, orderId } = req.params;
  try {
    const ownerCheck = await db.query("SELECT id FROM restaurants WHERE id = $1 AND user_id = $2", [restaurantId, req.user.id]);
    if (ownerCheck.rows.length === 0) return res.status(403).json({ status: "error", message: "Access denied" });
    await db.query("DELETE FROM orders WHERE id = $1 AND restaurant_id = $2", [orderId, restaurantId]);
    res.json({ status: "success", message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Failed to delete order" });
  }
});

module.exports = router;
1