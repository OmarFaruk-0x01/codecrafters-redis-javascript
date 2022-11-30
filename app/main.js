const net = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this block to pass the first stage
const server = net.createServer((connection) => {
  // Handle connection
  connection.on("error", (err) => {
    console.log("Error: ", err);
  });
  connection.addListener("data", (data) => {
    if (data.toString("utf8").toLowerCase().includes("ping")) {
      connection.write(Buffer.from("+PONG\r\n", "utf-8"), (err) => {
          
      });
    }
  });
});
//
server.listen(6379, "127.0.0.1");
