-- ============================================
-- PRODUCTION-READY RESTAURANT SAAS SCHEMA
-- ============================================

-- 1️⃣ USERS TABLE (with subscription tracking)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  subscription_plan VARCHAR(50) DEFAULT 'Free', -- Free, Pro, Premium
  subscription_status VARCHAR(50) DEFAULT 'active', -- active, cancelled, suspended
  subscription_end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2️⃣ RESTAURANTS TABLE (linked to users with ownership)
CREATE TABLE restaurants (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  description TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  cuisine_type VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3️⃣ ORDERS TABLE (new - linked to restaurants)
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(100),
  customer_phone VARCHAR(20),
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  order_items JSONB, -- Store items as JSON [{item: 'Biryani', qty: 2, price: 300}]
  special_instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4️⃣ SUBSCRIPTION_PLANS TABLE (for plan limits)
CREATE TABLE subscription_plans (
  id SERIAL PRIMARY KEY,
  plan_name VARCHAR(50) UNIQUE NOT NULL, -- Free, Pro, Premium
  max_restaurants INTEGER NOT NULL,
  max_orders_per_month INTEGER,
  features JSONB, -- Store features as JSON
  price_per_month DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5️⃣ AUDIT_LOG TABLE (for production security)
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action_type VARCHAR(100), -- CREATE, UPDATE, DELETE, ACCESS
  resource_type VARCHAR(100), -- restaurant, order, user
  resource_id INTEGER,
  changes JSONB, -- Track what changed
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_restaurants_user_id ON restaurants(user_id);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

-- ============================================
-- INSERT DEFAULT SUBSCRIPTION PLANS
-- ============================================
INSERT INTO subscription_plans (plan_name, max_restaurants, max_orders_per_month, price_per_month, features) VALUES
  ('Free', 1, 100, 0, '{"features": ["1 Restaurant", "100 orders/month", "Basic analytics"]}'),
  ('Pro', 3, 1000, 29.99, '{"features": ["3 Restaurants", "1000 orders/month", "Advanced analytics", "Email support"]}'),
  ('Premium', 999, 999999, 99.99, '{"features": ["Unlimited Restaurants", "Unlimited orders", "Advanced analytics", "API Access", "Priority support"]}');
