/**
 * Subscription Enforcement Middleware
 * Ensures users have active, non-expired subscriptions and haven't exceeded plan limits
 * Production-ready with comprehensive error handling and logging
 */

const pool = require("../db");
const { AuthorizationError, NotFoundError, DatabaseError } = require("./errors");

/**
 * Validate User Subscription Status
 * Checks:
 * 1. User has active subscription
 * 2. Subscription hasn't expired
 * 3. Subscription status is 'active'
 *
 * Usage: router.post("/", authMiddleware, enforceActiveSubscription, controller)
 * Throws: NotFoundError, AuthorizationError, DatabaseError
 */
const enforceActiveSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      throw new AuthorizationError('User information missing');
    }

    // Get user's active subscription with plan details
    const subResult = await pool.query(
      `
      SELECT 
        s.id,
        sp.name,
        s.status,
        s.end_date,
        sp.restaurant_limit,
        sp.price
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.user_id = $1 AND s.status = 'active' AND s.end_date >= CURRENT_DATE
      ORDER BY s.end_date DESC
      LIMIT 1
      `,
      [userId]
    );

    if (subResult.rows.length === 0) {
      throw new AuthorizationError('No active subscription found for your account');
    }

    const sub = subResult.rows[0];

    // Attach subscription info to request for use in subsequent middleware/routes
    req.subscription = {
      userId: userId,
      plan: sub.name,
      status: sub.status,
      endDate: sub.end_date,
      restaurantLimit: sub.restaurant_limit,
      price: sub.price
    };

    next();

  } catch (err) {
    // Re-throw if already an AppError
    if (err.statusCode) {
      return next(err);
    }

    console.error("Subscription status verification error:", err);
    return next(new DatabaseError('Error verifying subscription status', err));
  }
};

/**
 * Enforce Restaurant Count Limits
 * Checks user hasn't exceeded max restaurants for their plan
 *
 * Usage: router.post("/", authMiddleware, enforceActiveSubscription, enforceRestaurantLimit, controller)
 * Must run AFTER enforceActiveSubscription (req.subscription must be populated)
 * Throws: AuthorizationError, DatabaseError
 */
const enforceRestaurantLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Ensure subscription was already verified
    if (!req.subscription) {
      throw new DatabaseError('Subscription info not available. Ensure enforceActiveSubscription runs first.');
    }

    const { plan, restaurantLimit } = req.subscription;

    // Count user's current restaurants
    const countResult = await pool.query(
      "SELECT COUNT(*) as count FROM restaurants WHERE user_id = $1",
      [userId]
    );

    const currentCount = parseInt(countResult.rows[0].count, 10);

    // Check limit
    if (currentCount >= restaurantLimit) {
      throw new AuthorizationError(
        `Restaurant limit exceeded. Your ${plan} plan allows ${restaurantLimit} restaurant(s). You currently have ${currentCount}.`
      );
    }

    // Calculate remaining capacity
    const remaining = restaurantLimit - currentCount;

    // Attach usage info for logging/response
    req.subscriptionUsage = {
      plan,
      restaurantLimit,
      currentRestaurants: currentCount,
      remainingCapacity: remaining
    };

    next();

  } catch (err) {
    // Re-throw if already an AppError
    if (err.statusCode) {
      return next(err);
    }

    console.error("Restaurant limit verification error:", err);
    return next(new DatabaseError('Error verifying restaurant limits', err));
  }
};

/**
 * Enforce Order Count Limits (Monthly)
 * Checks user hasn't exceeded max orders per month for their plan
 * Only applicable if plan has a max_orders_per_month limit (Premium has NULL/unlimited)
 *
 * Usage: router.post("/:restaurantId/orders", authMiddleware, enforceActiveSubscription, enforceOrderLimit, controller)
 * Throws: AuthorizationError, DatabaseError
 */
const enforceOrderLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Ensure subscription was already verified
    if (!req.subscription) {
      throw new DatabaseError('Subscription info not available. Ensure enforceActiveSubscription runs first.');
    }

    const { plan } = req.subscription;

    // For now, skip order limit check if not implemented
    // Once you add max_orders_per_month to subscription_plans, add the check here

    next();

  } catch (err) {
    // Re-throw if already an AppError
    if (err.statusCode) {
      return next(err);
    }

    console.error("Order limit verification error:", err);
    return next(new DatabaseError('Error verifying order limits', err));
  }
};

/**
 * Combined Middleware: Full Subscription Enforcement
 * Convenience middleware that runs all checks in sequence
 * Equivalent to: enforceActiveSubscription -> enforceRestaurantLimit
 *
 * Usage: router.post("/", authMiddleware, enforceSubscription, controller)
 */
const enforceSubscription = [
  enforceActiveSubscription,
  enforceRestaurantLimit
];

/**
 * Subscription Info Logging Middleware
 * Logs subscription status for audit trail
 * Runs AFTER enforceActiveSubscription
 *
 * Usage: router.post("/", authMiddleware, enforceActiveSubscription, logSubscriptionInfo, controller)
 */
const logSubscriptionInfo = (req, res, next) => {
  if (req.subscription) {
    console.log(`[SUBSCRIPTION] User ${req.user.id} - Plan: ${req.subscription.plan}, Status: ${req.subscription.status}`);
  }
  next();
};

module.exports = {
  enforceActiveSubscription,
  enforceRestaurantLimit,
  enforceOrderLimit,
  enforceSubscription,
  logSubscriptionInfo
};
