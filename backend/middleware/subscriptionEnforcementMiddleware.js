const pool = require("../db");
const { AuthorizationError, DatabaseError } = require("./errors");

/**
 * Middleware: enforceSubscriptionForRestaurantCreation
 * - Fetches the user's active subscription
 * - Validates existence, status == 'active', and not expired
 * - Loads plan limits (prefers `restaurant_limit` or `max_restaurants`)
 * - Counts current restaurants and blocks creation if limit reached
 *
 * Attaches `req.subscription` with { plan, end_date, restaurant_limit, currentRestaurants }
 */
const enforceSubscriptionForRestaurantCreation = async (req, res, next) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return next(new AuthorizationError('Authentication required'));

    // Get most recent active subscription for the user
    const subQuery = `
      SELECT sp.name, s.status, s.end_date, sp.restaurant_limit
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.user_id = $1 AND s.status = 'active'
      ORDER BY s.end_date DESC
      LIMIT 1
    `;

    const subRes = await pool.query(subQuery, [userId]);
    if (subRes.rows.length === 0) {
      return next(new AuthorizationError('No subscription found for this account'));
    }

    const sub = subRes.rows[0];

    // Check status
    if (sub.status !== 'active') {
      return next(new AuthorizationError(`Subscription is not active (status: ${sub.status})`));
    }

    // Check expiry
    const now = new Date();
    const endDate = sub.end_date ? new Date(sub.end_date) : null;
    if (endDate && endDate < now) {
      return next(new AuthorizationError(`Subscription expired on ${endDate.toISOString().split('T')[0]}. Please renew to continue.`));
    }

    // Determine plan restaurant limit
    const restaurantLimit = sub.restaurant_limit;

    // Count current restaurants
    const countRes = await pool.query("SELECT COUNT(*) AS count FROM restaurants WHERE user_id = $1", [userId]);
    const currentCount = parseInt(countRes.rows[0].count, 10) || 0;

    // If limit exists and exceeded -> block
    if (restaurantLimit != null && currentCount >= restaurantLimit) {
      return next(new AuthorizationError(`Restaurant limit exceeded. Your plan allows ${restaurantLimit} restaurant(s). You currently have ${currentCount}.`));
    }

    // Attach for downstream handlers
    req.subscription = {
      plan: sub.name,
      status: sub.status,
      end_date: endDate,
      restaurant_limit: restaurantLimit,
      currentRestaurants: currentCount
    };

    return next();
  } catch (err) {
    console.error('Subscription enforcement error', err);
    return next(new DatabaseError('Failed to verify subscription', err));
  }
};

module.exports = enforceSubscriptionForRestaurantCreation;
