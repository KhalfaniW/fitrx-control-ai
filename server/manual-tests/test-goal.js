import { makeRequest, logTest } from "./test-utils.js";

async function testGoal() {
  const result = await makeRequest("/goal");
  logTest("Get Goal", result);
}

testGoal();
