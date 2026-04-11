module.exports = {
  apps: [
    {
      name: "ehu-surveillance",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/opt/ehu-surveillance",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "/var/log/ehu/error.log",
      out_file: "/var/log/ehu/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
}
