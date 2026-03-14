const jwt = require("jsonwebtoken");
const config = require("../config");
const { AuthenticationError } = require("./errors");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AuthenticationError('Authorization header missing');
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new AuthenticationError('Token not provided');
    }

    const decoded = jwt.verify(token, config.jwt.secret);

    req.user = decoded; // attach user info to request

    next();

  } catch (err) {
    // JWT validation errors
    if (err.name === 'JsonWebTokenError') {
      return next(new AuthenticationError('Invalid token'));
    }
    if (err.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Token has expired'));
    }
    
    // Already an AuthenticationError
    if (err.statusCode) {
      return next(err);
    }

    return next(new AuthenticationError(err.message));
  }
};

module.exports = authMiddleware;
