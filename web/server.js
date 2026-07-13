// Custom server required by cPanel's Node.js App (Phusion Passenger).
// Passenger spawns this file directly and expects it to listen on process.env.PORT.
const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, () => {
    console.log(`> MyTuto server listening on port ${port}`);
  });
});
