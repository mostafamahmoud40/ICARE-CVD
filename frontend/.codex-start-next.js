process.env.__NEXT_DEV_SERVER = "1";
process.env.__NEXT_DISABLE_MEMORY_WATCHER = "1";

const { startServer } = require("./node_modules/next/dist/server/lib/start-server");

startServer({
  dir: process.cwd(),
  port: 3000,
  allowRetry: true,
  isDev: true,
  hostname: "127.0.0.1",
  serverFastRefresh: true,
})
  .then(() => {
    console.log("ICARE-CVD frontend ready");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

setInterval(() => {}, 1000);
