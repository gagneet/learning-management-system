/**
 * PM2 Ecosystem Configuration for LMS Application
 *
 * This configuration follows the healthapp pattern with cluster mode
 * for optimal performance and reliability.
 *
 * Start: pm2 start ecosystem.config.js --env production
 * Stop: pm2 stop lms-nextjs
 * Restart: pm2 restart lms-nextjs
 * Logs: pm2 logs lms-nextjs
 * Monitoring: pm2 monit
 */

module.exports = {
  apps: [
    {
      name: 'lms-nextjs',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        NEXT_TELEMETRY_DISABLED: 1,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 10000,
      kill_timeout: 5000,
      wait_ready: true,
      // Graceful shutdown
      shutdown_with_message: true,
      // Health check (optional - requires PM2 Plus or custom implementation)
      // health_check: {
      //   enabled: true,
      //   endpoint: '/api/health',
      //   interval: 30000, // 30 seconds
      //   timeout: 5000
      // }
    }
  ],

  /**
   * Deployment Configuration (Optional)
   *
   * This can be used for automated deployments with PM2 deploy.
   * Uncomment and configure if needed.
   */
  // deploy: {
  //   production: {
  //     user: 'gagneet',
  //     host: 'lms.gagneet.com',
  //     ref: 'origin/master',
  //     repo: 'git@github.com:username/lms.git',
  //     path: '/home/gagneet/lms',
  //     'post-deploy': './scripts/build-and-deploy.sh'
  //   }
  // }
};
