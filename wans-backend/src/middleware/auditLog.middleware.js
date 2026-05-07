const logger = require('../utils/logger');

/**
 * 🔒 SECURITY: Audit log middleware
 * Logs all security-sensitive operations for compliance and incident investigation
 */

/**
 * Log authentication attempts
 */
const logAuthAttempt = (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = function (data) {
    const success = data.success !== false && res.statusCode < 400;
    const event = success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILURE';
    
    logger.logAuth(event, req.body.email || req.body.phone || 'unknown', {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
    });
    
    return originalJson(data);
  };
  
  next();
};

/**
 * Log authorization failures
 */
const logAuthzFailure = (userId, resource, resourceId, action) => {
  return (req, res, next) => {
    logger.logAuthzFailure(
      userId || req.user?._id,
      resource,
      resourceId,
      action,
      req.ip || req.connection.remoteAddress
    );
    next();
  };
};

/**
 * Log financial transactions
 */
const logFinancialTransaction = (type) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function (data) {
      if (data.success !== false && res.statusCode < 400) {
        logger.logFinancial(type, req.user?._id, req.body.amount || 0, {
          orderId: req.body.orderId || data.orderId,
          ip: req.ip || req.connection.remoteAddress,
          method: req.method,
          path: req.path,
        });
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Log payment events
 */
const logPaymentEvent = (event) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function (data) {
      if (data.success !== false && res.statusCode < 400) {
        logger.logPayment(
          event,
          req.body.orderId || data.orderId,
          req.user?._id,
          req.body.amount || data.amount || 0,
          {
            razorpay_payment_id: req.body.razorpay_payment_id || data.paymentId,
            ip: req.ip || req.connection.remoteAddress,
          }
        );
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Log data access events
 */
const logDataAccess = (resource) => {
  return (req, res, next) => {
    const action = req.method === 'GET' ? 'READ' : 
                   req.method === 'POST' ? 'CREATE' :
                   req.method === 'PUT' || req.method === 'PATCH' ? 'UPDATE' :
                   req.method === 'DELETE' ? 'DELETE' : 'UNKNOWN';
    
    logger.logDataAccess(
      req.user?._id,
      resource,
      action,
      req.params.id || req.params.orderId || req.params.userId,
      req.ip || req.connection.remoteAddress
    );
    
    next();
  };
};

/**
 * Log security events
 */
const logSecurityEvent = (event, severity = 'MEDIUM') => {
  return (req, res, next) => {
    logger.logSecurity(event, severity, {
      userId: req.user?._id,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      method: req.method,
      path: req.path,
    });
    
    next();
  };
};

module.exports = {
  logAuthAttempt,
  logAuthzFailure,
  logFinancialTransaction,
  logPaymentEvent,
  logDataAccess,
  logSecurityEvent,
};
