const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/* ===============================
   GET PLATFORM STATS
   GET /api/admin/platform-stats
================================ */
router.get("/platform-stats", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Admin access required"
    });
  }

  try {
    const users = await pool.query("SELECT COUNT(*) FROM users");
    const restaurants = await pool.query("SELECT COUNT(*) FROM restaurants");
    const revenue = await pool.query(`
      SELECT COALESCE(SUM(total_amount),0) AS total_revenue
      FROM orders
      WHERE status = 'completed'
    `);

    res.json({
      status: "success",
      data: {
        total_users: parseInt(users.rows[0].count),
        total_restaurants: parseInt(restaurants.rows[0].count),
        total_platform_revenue: parseFloat(revenue.rows[0].total_revenue)
      }
    });

  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message
    });
  }
});


/* ===============================
   GET ALL USERS
   GET /api/admin/users
================================ */
router.get("/users", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Admin access required"
    });
  }

  try {
    const users = await pool.query(
      "SELECT id, name, email, role FROM users ORDER BY created_at DESC"
    );

    res.json({
      status: "success",
      data: users.rows
    });

  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message
    });
  }
});

module.exports = router;