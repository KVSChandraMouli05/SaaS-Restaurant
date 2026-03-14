/**
 * Restaurant Management Routes
 * CRUD operations for restaurants with ownership verification
 */

const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { catchAsync } = require("../middleware/errorHandler");
const { verifyRestaurantOwnership } = require("../middleware/ownershipMiddleware");
const enforceSubscriptionForRestaurantCreation = require("../middleware/subscriptionEnforcementMiddleware");
const { created, success, paginated } = require("../utils/response");
const { NotFoundError, DatabaseError } = require("../middleware/errors");

const router = express.Router();

/**
 * Create Restaurant
 * POST /api/restaurants
 * Protected: Requires authentication + active subscription + restaurant limit check
 */
router.post(
  "/",
  authMiddleware,
  validate("createRestaurant"),
  catchAsync(async (req, res) => {
    const { restaurant_name, location, description, phone, email, cuisine_type } = req.body;
    const userId = req.user.id;

    // 1️⃣ Get active subscription + plan limit
    const subscriptionResult = await pool.query(
      `
      SELECT s.id, s.status, s.end_date, sp.restaurant_limit
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.user_id = $1
      AND s.status = 'active'
      ORDER BY s.id DESC
      LIMIT 1
      `,
      [userId]
    );

    if (subscriptionResult.rows.length === 0) {
      return res.status(403).json({
        status: "error",
        message: "No active subscription found",
        statusCode: 403
      });
    }

    const subscription = subscriptionResult.rows[0];

    // 2️⃣ Check expiry
    const today = new Date();
    const expiryDate = new Date(subscription.end_date);

    if (expiryDate < today) {
      return res.status(403).json({
        status: "error",
        message: `Subscription expired on ${subscription.end_date}`,
        statusCode: 403
      });
    }

    const restaurantLimit = subscription.restaurant_limit;

    // 3️⃣ Count existing restaurants
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM restaurants WHERE user_id = $1",
      [userId]
    );

    const currentCount = parseInt(countResult.rows[0].count);

    // 4️⃣ Enforce limit
    if (currentCount >= restaurantLimit) {
      return res.status(403).json({
        status: "error",
        message: `Restaurant limit exceeded. Plan allows ${restaurantLimit}.`,
        statusCode: 403
      });
    }

    // 5️⃣ Insert restaurant
    const result = await pool.query(
      `
      INSERT INTO restaurants 
      (user_id, restaurant_name, location, description, phone, email, cuisine_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        userId,
        restaurant_name,
        location,
        description || null,
        phone || null,
        email || null,
        cuisine_type || null
      ]
    );

    return res.status(201).json({
      status: "success",
      message: "Restaurant created successfully",
      restaurant: result.rows[0]
    });
  })
);

/**
 * Get All My Restaurants
 * GET /api/restaurants
 * Protected: Requires authentication
 */
router.get(
  "/",
  authMiddleware,
  catchAsync(async (req, res) => {
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT * FROM restaurants WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    return success(res, {
      count: result.rows.length,
      restaurants: result.rows
    }, "Restaurants retrieved successfully");
  })
);

/**
 * Get Single Restaurant
 * GET /api/restaurants/:id
 * Protected: Requires authentication + ownership verification
 */
router.get(
  "/:id",
  authMiddleware,
  validate("restaurantId"),
  verifyRestaurantOwnership,
  catchAsync(async (req, res) => {
    const result = await pool.query(
      "SELECT * FROM restaurants WHERE id = $1",
      [req.restaurantId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Restaurant');
    }

    return success(res, result.rows[0]);
  })
);

/**
 * Update Restaurant
 * PUT /api/restaurants/:id
 * Protected: Requires authentication + ownership verification
 */
router.put(
  "/:id",
  authMiddleware,
  validate("restaurantId"),
  validate("updateRestaurant"),
  verifyRestaurantOwnership,
  catchAsync(async (req, res) => {
    const { restaurant_name, location, description, phone, email, cuisine_type, is_active } = req.body;

    const result = await pool.query(
      `
      UPDATE restaurants
      SET 
        restaurant_name = COALESCE($1, restaurant_name),
        location = COALESCE($2, location),
        description = COALESCE($3, description),
        phone = COALESCE($4, phone),
        email = COALESCE($5, email),
        cuisine_type = COALESCE($6, cuisine_type),
        is_active = COALESCE($7, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
      `,
      [restaurant_name, location, description, phone, email, cuisine_type, is_active, req.restaurantId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Restaurant');
    }

    return success(res, result.rows[0], "Restaurant updated successfully");
  })
);

/**
 * Delete Restaurant
 * DELETE /api/restaurants/:id
 * Protected: Requires authentication + ownership verification
 * Cascade: Deletes all associated orders
 */
router.delete(
  "/:id",
  authMiddleware,
  validate("restaurantId"),
  verifyRestaurantOwnership,
  catchAsync(async (req, res) => {
    // Delete all associated orders first (explicit cascade)
    await pool.query(
      "DELETE FROM orders WHERE restaurant_id = $1",
      [req.restaurantId]
    );

    // Delete restaurant
    const result = await pool.query(
      "DELETE FROM restaurants WHERE id = $1 RETURNING id",
      [req.restaurantId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Restaurant');
    }

    return success(res, { id: result.rows[0].id }, "Restaurant deleted successfully");
  })
);

module.exports = router;

