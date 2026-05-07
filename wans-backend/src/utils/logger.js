const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'wans-api' },
  transports: [
    // Error logs - only errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),

    // 🔒 SECURITY: Security events log - authentication, authorization, financial transactions
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'warn',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),

    // 🔒 SECURITY: Audit log - all financial transactions
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 30, // Keep 30 days for compliance
    }),

    // Combined logs - all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// 🔒 SECURITY: Helper functions for structured logging

/**
 * Log authentication events
 */
logger.logAuth = (event, userId, details = {}) => {
  logger.warn('AUTH_EVENT', {
    event,
    userId,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

/**
 * Log authorization failures
 */
logger.logAuthzFailure = (userId, resource, resourceId, action, ip) => {
  logger.warn('AUTHORIZATION_FAILURE', {
    userId,
    resource,
    resourceId,
    action,
    ip,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log financial transactions
 */
logger.logFinancial = (type, userId, amount, details = {}) => {
  logger.info('FINANCIAL_TRANSACTION', {
    type,
    userId,
    amount,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

/**
 * Log payment events
 */
logger.logPayment = (event, orderId, userId, amount, details = {}) => {
  logger.info('PAYMENT_EVENT', {
    event,
    orderId,
    userId,
    amount,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

/**
 * Log commission distribution
 */
logger.logCommission = (orderId, totalAmount, recipientCount, details = {}) => {
  logger.info('COMMISSION_DISTRIBUTION', {
    orderId,
    totalAmount,
    recipientCount,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

/**
 * Log payout batch creation
 */
logger.logPayout = (batchId, type, totalAmount, employeeCount, details = {}) => {
  logger.info('PAYOUT_BATCH', {
    batchId,
    type,
    totalAmount,
    employeeCount,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

/**
 * Log security events (failed login, suspicious activity, etc.)
 */
logger.logSecurity = (event, severity, details = {}) => {
  logger.warn('SECURITY_EVENT', {
    event,
    severity,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

/**
 * Log data access events
 */
logger.logDataAccess = (userId, resource, action, resourceId, ip) => {
  logger.info('DATA_ACCESS', {
    userId,
    resource,
    action,
    resourceId,
    ip,
    timestamp: new Date().toISOString(),
  });
};

module.exports = logger;
