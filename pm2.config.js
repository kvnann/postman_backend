module.exports = {
    apps: [
      {
        name: 'postman',
        script: 'index.js', 
        exec_mode: 'cluster',
        instances: 'max', 
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        log_date_format: 'YYYY-MM-DD HH:mm:ss',
        env: {
            NODE_ENV: 'production'
        },
      },
    ],
  };