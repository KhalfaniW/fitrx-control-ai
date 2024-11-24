import { makeRequest, logTest } from "./test-utils.js";

async function testControls() {
  let result;

  result = await makeRequest("/increase", { method: "POST" });
  logTest("Increase", result);

  result = await makeRequest("/decrease", { method: "POST" });
  logTest("Decrease", result);

  result = await makeRequest("/end", { method: "POST" });
  logTest("End", result);
}

testControls();
