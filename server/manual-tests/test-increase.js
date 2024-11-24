import { makeRequest, logTest } from "./test-utils.js";

async function testIncrease() {
  const result = await makeRequest("/increase", { method: "POST" });
  logTest("Increase", result);
}

testIncrease();
