const pool = require("../db");

/**
 * Middleware to log all sensitive actions for audit trail
 * Tracks: CREATE, UPDATE, DELETE operations
 */
const auditLog = async (req, res, next) => {
  // Store original res.json
  const originalJson = res.json;

  res.json = function (data) {
    // Log after response (check status code)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      logAuditAsync(req, res.statusCode, data);
    }
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Asynchronous audit logging (non-blocking)
 */
const logAuditAsync = async (req, res_status, responseData) => {
  try {
    const userId = req.user?.id || null;
    const actionType = req.method === "POST" ? "CREATE" : 
                       req.method === "PUT" ? "UPDATE" : 
                       req.method === "DELETE" ? "DELETE" : "ACCESS";
    
    const resourceType = req.baseUrl.includes("restaurants") ? "restaurant" :
                         req.baseUrl.includes("orders") ? "order" : "unknown";
    
    const resourceId = req.params.id ? parseInt(req.params.id) : null;

    // Insert audit log (fire and forget - don't await)
    pool.query(
      `
      INSERT INTO audit_logs (user_id, action_type, resource_type, resource_id, ip_address)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        userId,
        actionType,
        resourceType,
        resourceId,
        req.ip || req.connection.remoteAddress
      ]
    ).catch(err => console.error("Audit log error:", err));

  } catch (err) {
    console.error("Audit logging error:", err);
  }
};

module.exports = auditLog;
