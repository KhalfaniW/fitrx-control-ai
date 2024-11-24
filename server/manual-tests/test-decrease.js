import { makeRequest, logTest } from "./test-utils.js";

async function testDecrease() {
  const result = await makeRequest("/decrease", { method: "POST" });
  logTest("Decrease", result);
}

testDecrease();
