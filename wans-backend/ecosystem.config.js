// PM2 ecosystem configuration for production deployment
// Install PM2: npm install -g pm2
// Start: pm2 start ecosystem.config.js
// Monitor: pm2 monit
// Logs: pm2 logs wans-api

module.exports = {
  apps: [{
    name: 'wans-api',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
  }]
};
