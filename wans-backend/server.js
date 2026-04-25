const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./src/config/db');
const app       = require('./src/app');

const PORT = process.env.PORT || 5000;
const ENV  = process.env.NODE_ENV || 'development';

const start = async () => {
  try {
    await connectDB();
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 WANS API running on port ${PORT} [${ENV}]`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in production, just log the error
  if (ENV === 'development') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Exit gracefully
  process.exit(1);
});

// Handle SIGTERM (graceful shutdown)
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

start();