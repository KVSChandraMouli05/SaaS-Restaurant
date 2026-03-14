/**
 * Subscription Management Routes
 * Subscription plan management and upgrades/downgrades
 */

const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { catchAsync } = require("../middleware/errorHandler");
const { success } = require("../utils/response");
const { NotFoundError, ValidationError } = require("../middleware/errors");

const router = express.Router();

/**
 * Get All Subscription Plans
 * GET /api/subscription/plans
 * Public: No authentication required
 */
router.get(
  "/plans",
  catchAsync(async (req, res) => {
    const result = await pool.query(
      "SELECT id, name, restaurant_limit, price, features FROM subscription_plans ORDER BY price"
    );

    return success(
      res,
      { plans: result.rows },
      "Subscription plans retrieved successfully"
    );
  })
);

/**
 * Get Current User's Subscription
 * GET /api/subscription/current
 * Protected: Requires authentication
 */
router.get(
  "/current",
  authMiddleware,
  catchAsync(async (req, res) => {
    const result = await pool.query(
      `
      SELECT
        sp.name,
        s.status,
        s.end_date,
        sp.restaurant_limit,
        sp.price,
        sp.features
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.user_id = $1 AND s.status = 'active'
      ORDER BY s.end_date DESC
      LIMIT 1
      `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError("Subscription");
    }

    return success(
      res,
      result.rows[0],
      "Current subscription retrieved successfully"
    );
  })
);

router.post("/upgrade", authMiddleware, async (req, res) => {
  try {
    const { plan_name } = req.body;
    const userId = req.user.id;

    if (!plan_name) {
      return res.status(400).json({
        status: "error",
        message: "plan_name is required",
      });
    }

    const planCheck = await pool.query(
      "SELECT id, name FROM subscription_plans WHERE LOWER(name) = LOWER($1)",
      [plan_name]
    );

    if (planCheck.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Plan not found",
      });
    }

    const selectedPlan = planCheck.rows[0];

    const cancelResult = await pool.query(
      `
      UPDATE subscriptions
      SET status = 'cancelled'
      WHERE user_id = $1 AND status = 'active'
      `,
      [userId]
    );

    console.log(
      `[UPGRADE] User ${userId}: Cancelled ${cancelResult.rowCount} old subscription(s)`
    );

    const newSub = await pool.query(
      `
      INSERT INTO subscriptions (user_id, plan_id, status, start_date, end_date)
      VALUES ($1, $2, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days')
      RETURNING *
      `,
      [userId, selectedPlan.id]
    );

    console.log(
      `[UPGRADE] User ${userId}: Created new subscription ID ${newSub.rows[0].id} (plan_id ${selectedPlan.id})`
    );

    return res.status(200).json({
      status: "success",
      message: `Upgraded to ${selectedPlan.name}`,
      subscription: newSub.rows[0],
    });
  } catch (err) {
    console.error("[UPGRADE ERROR]", err);
    return res.status(500).json({
      status: "error",
      message: "Server error during upgrade",
      error: err.message,
    });
  }
});

/**
 * Cancel Subscription
 * POST /api/subscription/cancel
 * Protected: Requires authentication
 */
router.post(
  "/cancel",
  authMiddleware,
  catchAsync(async (req, res) => {
    const restaurantCount = await pool.query(
      "SELECT COUNT(*) as count FROM restaurants WHERE user_id = $1",
      [req.user.id]
    );

    const currentCount = parseInt(restaurantCount.rows[0].count);

    if (currentCount > 1) {
      throw new ValidationError(
        `Cannot cancel subscription: You have ${currentCount} restaurants. Free plan allows 1 restaurant. Please delete restaurants first.`
      );
    }

    const result = await pool.query(
      `
      UPDATE subscriptions
      SET status = 'cancelled'
      WHERE user_id = $1 AND status = 'active'
      RETURNING id, status
      `,
      [req.user.id]
    );

    return success(res, result.rows[0], "Subscription cancelled.");
  })
);

module.exports = router;
