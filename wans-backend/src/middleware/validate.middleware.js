const { z } = require('zod');

/**
 * Validation middleware factory
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
const validate = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate request body, params, and query
      const validated = await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      // Replace request data with validated data
      req.body = validated.body || req.body;
      req.params = validated.params || req.params;
      req.query = validated.query || req.query;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Zod v4 uses error.issues (v3 used error.errors)
        const issueList = error.issues ?? error.errors ?? [];
        const errors = issueList.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
        });
      }
      
      // Unexpected error
      return res.status(500).json({
        success: false,
        error: 'Validation error',
        message: error.message,
      });
    }
  };
};

module.exports = validate;
