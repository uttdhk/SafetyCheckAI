module.exports = {
  apps: [
    {
      name: 'safety-inspection-frontend',
      script: 'serve',
      args: '-s build -l 3001',
      cwd: '/home/user/webapp/frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        REACT_APP_API_URL: 'http://localhost:3000/api',
        REACT_APP_TITLE: '산업안전 점검 시스템',
        GENERATE_SOURCEMAP: 'false'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        REACT_APP_API_URL: '/api',
        REACT_APP_TITLE: '산업안전 점검 시스템',
        GENERATE_SOURCEMAP: 'false'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      kill_timeout: 5000,
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ],

  deploy: {
    production: {
      user: 'user',
      host: 'localhost', 
      ref: 'origin/main',
      repo: 'https://github.com/uttdhk/SafetyCheckAI.git',
      path: '/home/user/webapp',
      'pre-deploy-local': '',
      'post-deploy': 'cd frontend && npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};