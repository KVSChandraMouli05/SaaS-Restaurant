if (process.env.NODE_ENV !== 'production') {
	require("dotenv").config();
}
console.log("RUNNING SERVER FROM:", __filename);
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const authRoutes = require("./Routes/auth");
const restaurantRoutes = require("./Routes/restaurant");
const ordersRoutes = require("./Routes/orders");
const menuRoutes = require("./Routes/menuRoutes");
const ownerAnalyticsRoutes = require("./Routes/ownerAnalytics");
const subscriptionRoutes = require("./Routes/subscription");
const publicMenuRoutes = require("./Routes/publicMenuRoutes");
let orderPublicRoutes;
try { orderPublicRoutes = require("./Routes/orderRoutes"); } catch { console.warn("orderRoutes not found"); }
let adminAnalyticsRoutes;
try { adminAnalyticsRoutes = require("./Routes/adminAnalytics"); } catch { console.warn("adminAnalytics not found"); }
const { errorHandler } = require("./middleware/errorHandler");
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", async (req, res) => { try { const r = await pool.query("SELECT NOW()"); res.json({ status: "success", message: "Backend running", time: r.rows[0].now }); } catch(e) { res.status(500).json({ status: "error", message: e.message }); } });
app.use("/api/auth", authRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/analytics", ownerAnalyticsRoutes);
app.use("/api/public", publicMenuRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/restaurants", ordersRoutes);
app.use("/api/restaurants", menuRoutes);
if (orderPublicRoutes) app.use("/api/order", orderPublicRoutes);
if (adminAnalyticsRoutes) app.use("/api/admin", adminAnalyticsRoutes);
app.use((req, res) => { res.status(404).json({ status: "error", message: "Route not found: " + req.method + " " + req.originalUrl }); });
app.use(errorHandler);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { console.log("MouliServe running on :" + PORT); });
