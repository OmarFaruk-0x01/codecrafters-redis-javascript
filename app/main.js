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
    const dataArray = data.toString().replace(/\r\n/g, "").split("$");
    const commandArrayLength = 0 + +dataArray[0].trim().replace("*", "");
    const command = dataArray[1].trim().slice(1, dataArray[1].length);
    console.log(dataArray, commandArrayLength, command);
    switch (command) {
      case "ping":
        connection.write(Buffer.from("+PONG\r\n", "utf-8"), (err) => {});
        break;
      case "echo":
        if (commandArrayLength > 2) {
          connection.write(
            Buffer.from(
              `+(error) ERR wrong number of arguments for 'echo' command\r\n`,
              "utf-8"
            )
          );
        } else {
          connection.write(
            Buffer.from(
              `+"${dataArray?.at(2)?.slice(1, dataArray?.at(2).length)}"\r\n`,
              "utf-8"
            )
          );
          break;
        }
    }
  });
});
//
server.listen(6379, "127.0.0.1");
