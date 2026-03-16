module.exports = {
  apps: [
    {
      name: "starquest-api",
      script: "server.js",
      cwd: "/var/www/starquest/server", // 백엔드 실행 폴더
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      }
    }
  ]
};
