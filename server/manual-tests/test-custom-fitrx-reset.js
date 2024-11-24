import { makeRequest, logTest } from "./test-utils.js";

async function testCustom() {
  const codeFunction = async () => {
    performTask("Acupuncture", 200);
    await new Promise((resolve) => setTimeout(resolve, 200));
    performTask("Knead", 200);
    await new Promise((resolve) => setTimeout(resolve, 200));
    performTask("Acupuncture", 200);
  };

  const result = await makeRequest("/custom", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: `(${codeFunction.toString()})()`,
    }),
  });
  logTest("Custom Code", result);
}

testCustom();
