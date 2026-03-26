module.exports = {
  apps: [
    {
      name: "starquest-api",
      script: "./server.js",
      cwd: "/var/www/starquest/server",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
