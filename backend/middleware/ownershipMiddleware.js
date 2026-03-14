const pool = require("../db");
const { AuthorizationError, NotFoundError, DatabaseError } = require("./errors");

/**
 * Middleware to verify if user owns the restaurant
 * Usage: router.delete("/:id", authMiddleware, verifyRestaurantOwnership, deleteRestaurant)
 */
const verifyRestaurantOwnership = async (req, res, next) => {
  try {
    const restaurantId = req.params.id;
    const userId = req.user.id;

    if (!restaurantId || !userId) {
      throw new AuthorizationError('Missing restaurant ID or user information');
    }

    // Query: Get restaurant and check if user_id matches
    const result = await pool.query(
      "SELECT id, user_id FROM restaurants WHERE id = $1",
      [restaurantId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Restaurant');
    }

    const restaurantOwnerId = result.rows[0].user_id;

    // Verify ownership
    if (restaurantOwnerId !== userId) {
      throw new AuthorizationError('You do not have permission to access this restaurant');
    }

    // Attach restaurant info for next middleware/route
    req.restaurantId = restaurantId;
    req.restaurantOwnerId = restaurantOwnerId;

    next();

  } catch (err) {
    // Re-throw if already an AppError
    if (err.statusCode) {
      return next(err);
    }

    // Convert unexpected errors
    console.error("Ownership verification error:", err);
    return next(new DatabaseError('Error verifying restaurant ownership', err));
  }
};

/**
 * Middleware to verify if user owns an order
 * Must verify: user owns restaurant -> restaurant owns order
 */
const verifyOrderOwnership = async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId;
    const orderId = req.params.orderId;
    const userId = req.user.id;

    if (!restaurantId || !orderId || !userId) {
      throw new AuthorizationError('Missing required parameters');
    }

    // Step 1: Verify user owns the restaurant
    const restaurantResult = await pool.query(
      "SELECT id, user_id FROM restaurants WHERE id = $1",
      [restaurantId]
    );

    if (restaurantResult.rows.length === 0) {
      throw new NotFoundError('Restaurant');
    }

    if (restaurantResult.rows[0].user_id !== userId) {
      throw new AuthorizationError('You do not have permission to access this restaurant');
    }

    // Step 2: Verify order belongs to that restaurant
    const orderResult = await pool.query(
      "SELECT id, restaurant_id FROM orders WHERE id = $1 AND restaurant_id = $2",
      [orderId, restaurantId]
    );

    if (orderResult.rows.length === 0) {
      throw new NotFoundError('Order');
    }

    // Attach info for next middleware/route
    req.restaurantId = restaurantId;
    req.orderId = orderId;

    next();

  } catch (err) {
    // Re-throw if already an AppError
    if (err.statusCode) {
      return next(err);
    }

    console.error("Order ownership verification error:", err);
    return next(new DatabaseError('Error verifying order ownership', err));
  }
};

/**
 * Middleware to verify subscription plan limits
 * Ensures user hasn't exceeded restaurant count for their plan
 */
const verifySubscriptionLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      throw new AuthorizationError('User information missing');
    }

    // Get user's active subscription and plan limits
    const subResult = await pool.query(
      `
      SELECT sp.name, sp.restaurant_limit
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.user_id = $1 AND s.status = 'active' AND s.end_date >= CURRENT_DATE
      ORDER BY s.end_date DESC
      LIMIT 1
      `,
      [userId]
    );

    if (subResult.rows.length === 0) {
      throw new AuthorizationError('No active subscription found');
    }

    const sub = subResult.rows[0];

    // Count user's current restaurants
    const countResult = await pool.query(
      "SELECT COUNT(*) as count FROM restaurants WHERE user_id = $1",
      [userId]
    );

    const currentCount = parseInt(countResult.rows[0].count);

    // Check limit
    if (currentCount >= sub.restaurant_limit) {
      const err = new AuthorizationError(
        `Subscription limit exceeded. Your ${sub.name} plan allows ${sub.restaurant_limit} restaurant(s). Current: ${currentCount}`
      );
      err.statusCode = 403;
      throw err;
    }

    // Attach info for logging
    req.planInfo = {
      plan: sub.name,
      limit: sub.restaurant_limit,
      current: currentCount
    };

    next();

  } catch (err) {
    // Re-throw if already an AppError
    if (err.statusCode) {
      return next(err);
    }

    console.error("Subscription verification error:", err);
    return next(new DatabaseError('Error verifying subscription limits', err));
  }
};

module.exports = {
  verifyRestaurantOwnership,
  verifyOrderOwnership,
  verifySubscriptionLimit
};
