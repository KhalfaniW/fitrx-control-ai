import express from "express";
import { makeRequest, logTest } from "./test-utils.js";
import os from "os";
import dotenv from "dotenv";

dotenv.config();

// Create Express server
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3330;

// Add POST endpoint
app.post("/data", (req, res) => {
  console.log("Received request:", req.body);
  res.json({ status: "success", message: "Custom code executed" });
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
    vibrate(1000);

    flash(`p=${local("%priority")}`);
    performTask("AutoInputQuery");
    wait(1000);
    try {
      const response = await fetch(params.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add necessary headers here
        },
        body: JSON.stringify({ key: local("%priority") }), // Add necessary body content here
      });
      // Handle response
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const params = { url: `http://${localIp}:${PORT}/data` };
  const codeString = `(${codeFunction.toString()})(${JSON.stringify(params)})`;

  // console.log("sent", codeString);
  await new Promise((resolve) =>
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
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
