import { makeRequest, logTest } from "./test-utils.js";

async function testSetup() {
  const result = await makeRequest("/setup", { method: "POST" });
  logTest("Setup FitRx", result);
}

testSetup();
