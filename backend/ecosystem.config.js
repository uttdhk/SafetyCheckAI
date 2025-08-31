module.exports = {
  apps: [
    {
      name: 'safety-inspection-backend',
      script: './server.js',
      cwd: '/home/user/webapp/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        DB_USER: 'safety_admin',
        DB_PASSWORD: 'safety123!@#',
        DB_CONNECTION_STRING: 'localhost:1521/XE',
        OPENAI_API_KEY: '',
        JWT_SECRET: 'safety-inspection-secret-key-2024',
        MAX_FILE_SIZE: '10485760',
        UPLOAD_PATH: './uploads'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_USER: 'safety_admin',
        DB_PASSWORD: 'safety123!@#',
        DB_CONNECTION_STRING: 'localhost:1521/XE',
        OPENAI_API_KEY: '',
        JWT_SECRET: 'safety-inspection-secret-key-2024',
        MAX_FILE_SIZE: '10485760',
        UPLOAD_PATH: './uploads'
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
      'post-deploy': 'cd backend && npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};