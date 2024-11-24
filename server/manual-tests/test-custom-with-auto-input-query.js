import express from "express";
import { makeRequest, logTest } from "./test-utils.js";
import os from "os";
import dotenv from "dotenv";
const fs = require("fs");

dotenv.config();

// Create Express server
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3330;

// Add POST endpoint
app.post("/data", (req, res) => {
  try {
    fs.writeFileSync("received-data.txt", req.body.data);
    fs.writeFileSync(
      "received-data.json",
      JSON.stringify(req.body.data, null, 2),
    );

    res.json({
      status: "success",
      message: "Custom code executed and data saved",
    });
  } catch (err) {
    console.log(err);
    res.json({
      status: "fail",
      message: "Custom code executed and data saved",
    });
  } finally {
    setTimeout(() => {
      process.exit();
    }, 100);
  }
});

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const alias of iface) {
      if (alias.family === "IPv4" && alias.address.startsWith("192.168.")) {
        return alias.address;
      }
    }
  }
  throw new Error("No suitable local IP address found");
}

async function testCustom() {
  const localIp = getLocalIpAddress();

  const codeFunction = async (params) => {
    // vibrate(100);
    // wait(500);
    log(Object.keys(JSON.parse(global("%AllVars"))));
    performTask("AutoInputQuery", 125);
    // performTask("AutoInputQuery", local("%priority") + 10);
      await new Promise((resolve) => setTimeout(resolve, 4000));

    // return;
    try {
      const response = await fetch(params.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add necessary headers here
        },
        body: JSON.stringify({ data: JSON.parse(global("%AllVars")) }), // Add necessary body content here
      });
      // Handle response
    } catch (error) {
      console.error("e", error);
    }
  };
  const params = { url: `http://${localIp}:${PORT}/data` };
  const codeString = `(${codeFunction.toString()})(${JSON.stringify(params)})`;

  // console.log("sent", codeString);
  await new Promise((resolve) =>
    app.listen(PORT, () => {
        console.log(`Server running on port ${getLocalIpAddress()}:${PORT}`);
      resolve();
    }),
  );

  const result = await makeRequest("/custom", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: codeString,
    }),
  });
}

testCustom();
