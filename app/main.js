const net = require("net");

const DB = {};
const ExpireDB = {};

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Custom Redis Server Stating...");

function set({ key, data, callback, expiry = false }) {
  DB[key] = data;
  if (expiry) {
    ExpireDB[key] = {
      createdAt: Date.now(),
      expiry: 0 + +expiry,
    };
  }
  callback();
}

function get(key, callback) {
  if (Object.keys(DB).includes(key)) {
    if (Object.keys(ExpireDB).includes(key)) {
      const time = Date.now() - ExpireDB[key].createdAt;
      if (time > ExpireDB[key].expiry) {
        delete DB[key];
        delete ExpireDB[key];
        return callback({ data: null, error: "timeover" });
      }
    }
    return callback({ data: DB[key], error: null });
  }
  return callback({ data: null, error: "empty" });
}

function extractArgs(array, index) {
  return array
    ?.at(index)
    ?.replace(/['"]/g, "")
    ?.slice(1, array?.at(index).length);
}

const server = net.createServer((connection) => {
  connection.on("error", (err) => {
    console.log("Error: ", err);
  });
  connection.addListener("data", (data) => {
    const dataArray = data.toString().replace(/\r\n/g, "").split("$");
    const commandArrayLength = 0 + +dataArray[0].trim().replace("*", "");
    const command = dataArray[1].trim().slice(1, dataArray[1].length);
    const key = extractArgs(dataArray, 2);

    switch (command.toLowerCase()) {
      case "ping":
        connection.write(Buffer.from("+PONG\r\n", "utf-8"), (err) => {});
        break;
      case "echo":
        if (commandArrayLength !== 2) {
          connection.write(
            Buffer.from(
              `+(error) ERR wrong number of arguments for 'echo' command\r\n`,
              "utf-8"
            )
          );
        } else {
          const value = extractArgs(dataArray, 2);
          connection.write(Buffer.from(`+${value}\r\n`, "utf-8"));
          break;
        }
      case "get":
        if (commandArrayLength !== 2) {
          connection.write(
            Buffer.from(
              `+(error) ERR wrong number of arguments for 'get' command\r\n`,
              "utf-8"
            )
          );
        } else {
          get(key, ({ data, error }) => {
            if (Boolean(error)) {
              connection.write(Buffer.from(`$-1\r\n`, "utf-8"));
              return;
            }
            connection.write(Buffer.from(`+${data}\r\n`, "utf-8"));
          });
          break;
        }
      case "set":
        const value = extractArgs(dataArray, 3);

        if (commandArrayLength === 3) {
          try {
            set({
              key,
              data: value,
              callback: () => {
                connection.write(Buffer.from(`+OK\r\n`, "utf-8"));
                console.log(DB);
              },
            });
          } catch (err) {
            connection.write(Buffer.from(`$-1\r\n`, "utf-8"));
          }
        } else if (commandArrayLength === 5) {
          const subCommand = extractArgs(dataArray, 4);
          console.log(subCommand);
          switch (subCommand.toLowerCase()) {
            case "px": {
              const expiryMilliseconds = extractArgs(dataArray, 5);
              set({
                key,
                data: value,
                expiry: expiryMilliseconds,
                callback: () => {
                  console.log("DB: ", DB);
                  console.log("Expire DB: ", ExpireDB);
                  connection.write(Buffer.from(`+OK\r\n`, "utf-8"));
                },
              });
            }
          }
        } else {
          connection.write(
            Buffer.from(
              `+(error) ERR wrong number of arguments for 'set' command\r\n`,
              "utf-8"
            )
          );
        }
        break;
      default:
        connection.write(
          Buffer.from(
            `+(error) Unknown command try:\nSET <key> <value> [PX <expiry>],\nGET <key>,\nECHO <message>,\nPING\r\n`,
            "utf-8"
          )
        );
    }
  });
});

//
server.listen(6379, "127.0.0.1");
