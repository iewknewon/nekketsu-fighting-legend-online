module.exports = {
  apps: [
    {
      name: "nekketsu-online",
      cwd: __dirname + "/..",
      script: "online-server/server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      env_file: ".env.production",
    },
  ],
};
