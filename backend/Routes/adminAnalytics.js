const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
let planColumnsCache = null;
let userColumnsCache = null;

const isValidDate = (value) => {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
};

const formatISODate = (value) => new Date(value).toISOString().slice(0, 10);

const getPlanColumns = async () => {
  if (planColumnsCache) return planColumnsCache;
  const result = await pool.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_plans'
    `
  );
  const cols = result.rows.map((r) => r.column_name);
  planColumnsCache = {
    nameCol: cols.includes("name") ? "name" : cols.includes("plan_name") ? "plan_name" : null,
    priceCol: cols.includes("price") ? "price" : cols.includes("price_per_month") ? "price_per_month" : null
  };
  return planColumnsCache;
};

const getUserColumns = async () => {
  if (userColumnsCache) return userColumnsCache;
  const result = await pool.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users'
    `
  );
  const cols = result.rows.map((r) => r.column_name);
  userColumnsCache = {
    subscriptionPlanCol: cols.includes("subscription_plan") ? "subscription_plan" : null
  };
  return userColumnsCache;
};

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
   GET REVENUE REPORT
   GET /api/admin/revenue-report?start=YYYY-MM-DD&end=YYYY-MM-DD
================================ */
router.get("/revenue-report", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Admin access required"
    });
  }

  try {
    const { nameCol, priceCol } = await getPlanColumns();
    const planNameExpr = nameCol ? `sp.${nameCol}` : "NULL";
    const planPriceExpr = priceCol ? `sp.${priceCol}` : "0";

    const today = new Date();
    const defaultEnd = formatISODate(today);
    const defaultStart = formatISODate(new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000));

    const startDate = isValidDate(req.query.start) ? req.query.start : defaultStart;
    const endDate = isValidDate(req.query.end) ? req.query.end : defaultEnd;

    const summary = await pool.query(
      `
      SELECT
        COALESCE(SUM(total_amount), 0) AS total_revenue,
        COUNT(*) AS total_orders
      FROM orders
      WHERE status = 'completed'
        AND COALESCE(completed_at, created_at) >= $1::date
        AND COALESCE(completed_at, created_at) < ($2::date + INTERVAL '1 day')
      `,
      [startDate, endDate]
    );

    const series = await pool.query(
      `
      SELECT
        gs::date AS day,
        COALESCE(SUM(o.total_amount), 0) AS revenue,
        COALESCE(COUNT(o.id), 0) AS orders
      FROM generate_series($1::date, $2::date, INTERVAL '1 day') gs
      LEFT JOIN orders o
        ON DATE_TRUNC('day', COALESCE(o.completed_at, o.created_at))::date = gs::date
       AND o.status = 'completed'
      GROUP BY gs
      ORDER BY gs
      `,
      [startDate, endDate]
    );

    const planRevenue = await pool.query(
      `
      SELECT
        COALESCE(${planNameExpr}, 'Unknown') AS plan,
        COALESCE(SUM(
          GREATEST(
            0,
            (LEAST(COALESCE(s.end_date::date, $2::date), $2::date) -
             GREATEST(COALESCE(s.start_date::date, $1::date), $1::date) + 1)
          ) * (COALESCE(${planPriceExpr}, 0) / 30.0)
        ), 0) AS revenue,
        COUNT(DISTINCT s.user_id) AS users
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.status = 'active'
        AND COALESCE(s.start_date::date, $1::date) <= $2::date
        AND COALESCE(s.end_date::date, $2::date) >= $1::date
      GROUP BY plan
      ORDER BY revenue DESC
      `,
      [startDate, endDate]
    );

    res.json({
      status: "success",
      data: {
        range: { start: startDate, end: endDate },
        summary: {
          total_revenue: parseFloat(summary.rows[0]?.total_revenue || 0),
          total_orders: parseInt(summary.rows[0]?.total_orders || 0)
        },
        series: series.rows.map((row) => ({
          date: row.day,
          revenue: parseFloat(row.revenue || 0),
          orders: parseInt(row.orders || 0)
        })),
        plan_revenue: planRevenue.rows.map((row) => ({
          plan: row.plan,
          revenue: parseFloat(row.revenue || 0),
          users: parseInt(row.users || 0)
        }))
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
   GET PLAN STATS
   GET /api/admin/plan-stats
================================ */
router.get("/plan-stats", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Admin access required"
    });
  }

  try {
    const { nameCol, priceCol } = await getPlanColumns();
    const planNameExpr = nameCol ? `sp.${nameCol}` : "NULL";
    const planPriceExpr = priceCol ? `sp.${priceCol}` : "0";
    const groupBy = ["sp.id", "sp.restaurant_limit", "sp.features"];
    if (nameCol) groupBy.push(`sp.${nameCol}`);
    if (priceCol) groupBy.push(`sp.${priceCol}`);

    const orderBy = priceCol ? `sp.${priceCol}` : "sp.id";

    const planStats = await pool.query(
      `
      SELECT
        sp.id,
        COALESCE(${planNameExpr}, 'Unknown') AS plan_name,
        COALESCE(${planPriceExpr}, 0) AS price,
        sp.restaurant_limit,
        sp.features,
        COUNT(s.user_id) FILTER (WHERE s.status = 'active') AS active_users,
        COALESCE(SUM(CASE WHEN s.status = 'active' THEN ${planPriceExpr} ELSE 0 END), 0) AS revenue
      FROM subscription_plans sp
      LEFT JOIN subscriptions s ON s.plan_id = sp.id
      GROUP BY ${groupBy.join(", ")}
      ORDER BY ${orderBy} ASC, sp.id ASC
      `
    );

    const rows = planStats.rows.map((row) => ({
      id: row.id,
      plan_name: row.plan_name,
      price: parseFloat(row.price || 0),
      restaurant_limit: row.restaurant_limit,
      features: row.features,
      active_users: parseInt(row.active_users || 0),
      revenue: parseFloat(row.revenue || 0)
    }));

    const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);

    res.json({
      status: "success",
      data: {
        total_revenue: totalRevenue,
        plans: rows
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
    const { nameCol } = await getPlanColumns();
    const { subscriptionPlanCol } = await getUserColumns();
    const planNameExpr = nameCol ? `sp.${nameCol}` : "NULL";
    const userPlanExpr = subscriptionPlanCol ? `u.${subscriptionPlanCol}` : "NULL";
    const users = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        COALESCE(
          ${planNameExpr},
          ${userPlanExpr},
          CASE WHEN u.role = 'admin' THEN 'Premium' END,
          'Unknown'
        ) AS plan
      FROM users u
      LEFT JOIN LATERAL (
        SELECT s.plan_id
        FROM subscriptions s
        WHERE s.user_id = u.id AND s.status = 'active'
        ORDER BY s.end_date DESC NULLS LAST
        LIMIT 1
      ) s ON true
      LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
      ORDER BY u.created_at DESC
      `
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
