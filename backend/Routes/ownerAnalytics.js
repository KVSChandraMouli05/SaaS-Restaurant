const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/user/all-revenue", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const restaurants = (await pool.query("SELECT id, restaurant_name FROM restaurants WHERE user_id = $1", [userId])).rows;
    if (restaurants.length === 0) {
      return res.json({ status: "success", data: { total_restaurants: 0, total_revenue: 0, total_orders: 0, today_revenue: 0, today_orders: 0, avg_order_value: 0, restaurants: [], revenue_by_day: [], orders_by_day: [] } });
    }
    const todayR = (await pool.query("SELECT COUNT(*) as today_orders, COALESCE(SUM(total_amount),0) as today_revenue FROM orders o JOIN restaurants r ON o.restaurant_id=r.id WHERE r.user_id=$1 AND DATE(o.created_at)=CURRENT_DATE", [userId])).rows[0];
    const totalR = (await pool.query("SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount),0) as total_revenue FROM orders o JOIN restaurants r ON o.restaurant_id=r.id WHERE r.user_id=$1", [userId])).rows[0];
    const dayR = (await pool.query("SELECT TO_CHAR(DATE(o.created_at),'DD Mon') as label, COALESCE(SUM(o.total_amount),0) as revenue, COUNT(*) as orders FROM orders o JOIN restaurants r ON o.restaurant_id=r.id WHERE r.user_id=$1 AND o.created_at>=NOW()-INTERVAL '30 days' GROUP BY DATE(o.created_at) ORDER BY DATE(o.created_at) ASC", [userId])).rows;
    const restR = (await pool.query("SELECT r.id, r.restaurant_name, COUNT(o.id) as total_orders, COALESCE(SUM(o.total_amount),0) as total_revenue, COUNT(CASE WHEN o.status='completed' THEN 1 END) as completed_orders FROM restaurants r LEFT JOIN orders o ON r.id=o.restaurant_id WHERE r.user_id=$1 GROUP BY r.id,r.restaurant_name ORDER BY total_revenue DESC NULLS LAST", [userId])).rows;
    const totalOrders = parseInt(totalR.total_orders) || 0;
    const totalRevenue = parseFloat(totalR.total_revenue) || 0;
    const revenueByDay = dayR.map(r => ({ label: r.label, revenue: parseFloat(r.revenue) || 0, value: parseFloat(r.revenue) || 0, orders: parseInt(r.orders) || 0 }));
    res.json({
      status: "success",
      data: {
        total_restaurants: restaurants.length,
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        today_revenue: parseFloat(todayR.today_revenue) || 0,
        today_orders: parseInt(todayR.today_orders) || 0,
        avg_order_value: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
        restaurants: restR.map(r => ({ id: r.id, name: r.restaurant_name, total_orders: parseInt(r.total_orders) || 0, total_revenue: parseFloat(r.total_revenue) || 0, completed_orders: parseInt(r.completed_orders) || 0 })),
        revenue_by_day: revenueByDay,
        orders_by_day: revenueByDay.map(d => ({ ...d, value: d.orders }))
      }
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ status: "error", message: "Failed to fetch analytics" });
  }
});

router.get("/user/subscription-stats", authMiddleware, async (req, res) => {
  res.json({ status: "success", data: {} });
});

router.get("/:id/revenue", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT COALESCE(SUM(total_amount),0) AS total_revenue FROM orders WHERE restaurant_id=$1 AND status='completed'", [id]);
    res.json({ status: "success", data: { restaurant_id: id, total_revenue: result.rows[0].total_revenue } });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Failed to fetch revenue" });
  }
});

module.exports = router;