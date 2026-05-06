/**
 * Authentication Routes
 * Register, Login, Profile, Change Password
 *  Auth system completed.
 */

const express = require("express");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const pool    = require("../db");
const config  = require("../config");

// Middleware
const validate   = require("../middleware/validate");
const { catchAsync }                                              = require("../middleware/errorHandler");
const { ConflictError, ValidationError, AuthenticationError, NotFoundError } = require("../middleware/errors");

// Response utilities
const { created, success } = require("../utils/response");

const router = express.Router();

/* ──────────────────────────────────────────
   Inline auth middleware
   (reuses your existing JWT_SECRET pattern)
────────────────────────────────────────── */
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ status: "error", message: "No token provided" });
  }
  try {
    const payload = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ status: "error", message: "Invalid or expired token" });
  }
}

/* ══════════════════════════════════════════
   POST /api/auth/register
   Creates user + auto-assigns 7-day Trial
══════════════════════════════════════════ */
router.post("/register", validate("register"), catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check email uniqueness
  const userExists = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );
  if (userExists.rows.length > 0) {
    throw new ConflictError(`User with email '${email}' already exists`);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user
  const userResult = await pool.query(
    `INSERT INTO users (name, email, password)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, email, hashedPassword]
  );
  const user = userResult.rows[0];

  // Get Trial plan id dynamically
  const trialPlan = await pool.query(
    "SELECT id FROM subscription_plans WHERE plan_name = 'Trial' LIMIT 1"
  );
  const trialPlanId = trialPlan.rows.length > 0 ? trialPlan.rows[0].id : 8;

  // Create 7-day Trial subscription
  await pool.query(
    `INSERT INTO subscriptions (user_id, plan_id, status, start_date, end_date)
     VALUES ($1, $2, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days')`,
    [user.id, trialPlanId]
  );

  return created(res, {
    id:         user.id,
    name:       user.name,
    email:      user.email,
    created_at: user.created_at,
  }, "User registered successfully");
}));


/* ══════════════════════════════════════════
   POST /api/auth/login
══════════════════════════════════════════ */
router.post("/login", catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const userResult = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  if (userResult.rows.length === 0) {
    return res.status(401).json({ status: "error", message: "Invalid credentials" });
  }

  const user    = userResult.rows[0];
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({ status: "error", message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return res.json({ status: "success", token });
}));


/* ══════════════════════════════════════════
   GET /api/auth/me
   Returns the logged-in user's profile
══════════════════════════════════════════ */
router.get("/me", requireAuth, catchAsync(async (req, res) => {
  // Safe-add phone & bio columns if they don't exist yet
  await pool.query(`
    DO $$ BEGIN
      BEGIN ALTER TABLE users ADD COLUMN phone TEXT;
        EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE users ADD COLUMN bio TEXT;
        EXCEPTION WHEN duplicate_column THEN NULL; END;
    END $$;
  `).catch(() => {});

  const result = await pool.query(
    `SELECT id, name, email, phone, bio, role, created_at
     FROM users WHERE id = $1`,
    [req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ status: "error", message: "User not found" });
  }

  return success(res, result.rows[0]);
}));


/* ══════════════════════════════════════════
   PUT /api/auth/profile
   Update name, email, phone, bio
══════════════════════════════════════════ */
router.put("/profile", requireAuth, catchAsync(async (req, res) => {
  const { name, email, phone, bio } = req.body;

  if (!name || !name.trim()) {
    throw new ValidationError("Name is required");
  }

  // Check email not taken by another user
  if (email && email.trim()) {
    const taken = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [email.trim(), req.user.id]
    );
    if (taken.rows.length > 0) {
      throw new ConflictError("Email is already used by another account");
    }
  }

  // Safe-add columns if they don't exist
  await pool.query(`
    DO $$ BEGIN
      BEGIN ALTER TABLE users ADD COLUMN phone TEXT;
        EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE users ADD COLUMN bio TEXT;
        EXCEPTION WHEN duplicate_column THEN NULL; END;
    END $$;
  `).catch(() => {});

  const result = await pool.query(
    `UPDATE users
     SET name  = $1,
         email = COALESCE(NULLIF($2, ''), email),
         phone = $3,
         bio   = $4
     WHERE id = $5
     RETURNING id, name, email, phone, bio, role, created_at`,
    [
      name.trim(),
      email?.trim() || "",
      phone || null,
      bio   || null,
      req.user.id,
    ]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ status: "error", message: "User not found" });
  }

  return success(res, result.rows[0], "Profile updated successfully");
}));


/* ══════════════════════════════════════════
   PUT /api/auth/change-password
   Verifies current password then updates
══════════════════════════════════════════ */
router.put("/change-password", requireAuth, catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ValidationError("Both current and new password are required");
  }
  if (newPassword.length < 8) {
    throw new ValidationError("New password must be at least 8 characters");
  }

  const result = await pool.query(
    "SELECT password FROM users WHERE id = $1",
    [req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ status: "error", message: "User not found" });
  }

  const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password);
  if (!isMatch) {
    throw new AuthenticationError("Current password is incorrect");
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await pool.query(
    "UPDATE users SET password = $1 WHERE id = $2",
    [hashed, req.user.id]
  );

  return success(res, null, "Password changed successfully");
}));


module.exports = router;