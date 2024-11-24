import { makeRequest, logTest } from "./test-utils.js";

async function testImageUpload() {
  // Sample base64 image - replace with actual image
  const sampleImage = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";

  const result = await makeRequest("/upload-image", {
    method: "POST",
    body: JSON.stringify({
      image: sampleImage,
      mimeType: "image/jpeg",
    }),
  });
  logTest("Upload Image", result);
}

testImageUpload();
