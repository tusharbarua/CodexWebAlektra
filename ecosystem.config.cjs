module.exports = {
  apps: [
    {
      name: "alektra-renewable",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production"
      },
      max_memory_restart: "512M",
      out_file: "./logs/pm2-out.log",
      error_file: "./logs/pm2-error.log",
      time: true
    }
  ]
};
