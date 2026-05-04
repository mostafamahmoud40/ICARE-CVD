const http = require("http");

http
  .createServer((request, response) => {
    response.end("ok");
  })
  .listen(3005, "127.0.0.1", () => {
    console.log("test server ready");
  });
