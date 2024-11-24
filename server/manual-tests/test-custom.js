import { makeRequest, logTest } from "./test-utils.js";

async function testCustom() {
    const codeFunction = async () => {
        vibrate(100);
        flash(`p=${local("%priority")}`);
        // performTask('Setup Fitrx',200)      
        wait(200);
        vibrate(1000);

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
