/**
 * Request Validation Middleware
 * Validates request body, params, and query using Joi schemas
 */

const validators = require('./validators');

/**
 * Validation middleware factory
 * Usage: app.post('/route', validate('createRestaurant'), controllerHandler)
 */
const validate = (validatorName) => {
  return (req, res, next) => {
    try {
      const validator = validators[validatorName];

      if (!validator) {
        return res.status(500).json({
          status: 'error',
          message: `Validator not found: ${validatorName}`
        });
      }

      // Validate body
      if (validator.body) {
        const { error, value } = validator.body.validate(req.body, {
          abortEarly: false,
          stripUnknown: true
        });

        if (error) {
          const messages = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }));

          return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: messages
          });
        }

        req.body = value;
      }

      // Validate params
      if (validator.params) {
        const { error, value } = validator.params.validate(req.params, {
          abortEarly: false
        });

        if (error) {
          const messages = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }));

          return res.status(400).json({
            status: 'error',
            message: 'Invalid URL parameters',
            errors: messages
          });
        }

        req.params = value;
      }

      // Validate query
      if (validator.query) {
        const { error, value } = validator.query.validate(req.query, {
          abortEarly: false
        });

        if (error) {
          const messages = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }));

          return res.status(400).json({
            status: 'error',
            message: 'Invalid query parameters',
            errors: messages
          });
        }

        req.query = value;
      }

      next();

    } catch (err) {
      console.error('Validation middleware error:', err);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error during validation'
      });
    }
  };
};

module.exports = validate;
