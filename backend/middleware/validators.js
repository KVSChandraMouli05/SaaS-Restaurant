const Joi = require('joi');

const validators = {

  // ========== AUTH VALIDATORS ==========
  
  register: {
    body: Joi.object({
      name: Joi.string().min(2).max(100).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).max(255).required()
    }).unknown(false)
  },

  login: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    }).unknown(false)
  },

  // ========== RESTAURANT VALIDATORS ==========

  createRestaurant: {
    body: Joi.object({
      restaurant_name: Joi.string().min(2).max(255).required(),
      location: Joi.string().min(2).max(255).required(),
      description: Joi.string().max(1000).allow('').optional(),
      phone: Joi.string().max(20).allow('').optional(),
      email: Joi.string().email().allow('').optional(),
      cuisine_type: Joi.string().max(100).allow('').optional()
    }).unknown(false)
  },

  updateRestaurant: {
    body: Joi.object({
      restaurant_name: Joi.string().min(2).max(255).optional(),
      location: Joi.string().min(2).max(255).optional(),
      description: Joi.string().max(1000).allow('').optional(),
      phone: Joi.string().max(20).allow('').optional(),
      email: Joi.string().email().allow('').optional(),
      cuisine_type: Joi.string().max(100).allow('').optional(),
      is_active: Joi.boolean().optional()
    }).unknown(false)
  },

  restaurantId: {
    params: Joi.object({
      id: Joi.number().integer().required()
    }).unknown(false)
  },

  // ========== ORDER VALIDATORS ==========

  createOrder: {
    body: Joi.object({
      customer_name: Joi.string()
        .min(2)
        .max(100)
        .required(),

      customer_email: Joi.string()
        .email()
        .allow('')
        .optional(),

      customer_phone: Joi.string()
        .max(20)
        .allow('')
        .optional(),

      // ❌ total_amount REMOVED

      order_items: Joi.array()
        .items(
          Joi.object({
            item: Joi.string().required(),
            qty: Joi.number().integer().positive().required(),
            price: Joi.number().positive().required()
          })
        )
        .min(1)
        .required(),

      special_instructions: Joi.string()
        .max(500)
        .allow('')
        .optional()
    }).unknown(false)
  },

  updateOrderStatus: {
    body: Joi.object({
      status: Joi.string()
        .valid('pending', 'confirmed', 'completed', 'cancelled')
        .optional(),
      special_instructions: Joi.string()
        .max(500)
        .allow('')
        .optional()
    }).unknown(false)
  },

  orderId: {
    params: Joi.object({
      restaurantId: Joi.number().integer().positive().required(),
      orderId: Joi.number().integer().positive().required()
    })
  },

  upgradeSubscription: {
    body: Joi.object({
      plan_name: Joi.string()
        .valid('Free', 'Pro', 'Premium')
        .required()
    }).unknown(false)
  },

  pagination: {
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(100).default(50),
      offset: Joi.number().integer().min(0).default(0),
      status: Joi.string()
        .valid('pending', 'confirmed', 'completed', 'cancelled')
        .optional()
    }).unknown(true)
  },

  analyticsQuery: {
    query: Joi.object({
      startDate: Joi.date().optional(),
      endDate: Joi.date().optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      offset: Joi.number().integer().min(0).optional()
    }).unknown(false)
  }
};

module.exports = validators;
