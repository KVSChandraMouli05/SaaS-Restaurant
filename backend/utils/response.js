/**
 * Response Utility
 * Standardized response format for all endpoints
 */

/**
 * Success Response Builder
 */
const success = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data
  });
};

/**
 * Created Response (201)
 */
const created = (res, data, message = 'Resource created successfully') => {
  return res.status(201).json({
    status: 'success',
    message,
    data
  });
};

/**
 * Paginated Response
 */
const paginated = (res, items, totalCount, limit, offset, message = 'Success') => {
  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return res.status(200).json({
    status: 'success',
    message,
    data: {
      items,
      pagination: {
        total: totalCount,
        count: items.length,
        perPage: limit,
        currentPage,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
      }
    }
  });
};

/**
 * No Content Response (204)
 */
const noContent = (res) => {
  return res.status(204).send();
};

/**
 * Redirect Response (301/302/307)
 */
const redirect = (res, url, permanent = false) => {
  const statusCode = permanent ? 301 : 302;
  return res.redirect(statusCode, url);
};

module.exports = {
  success,
  created,
  paginated,
  noContent,
  redirect
};
