import screenshot from "screenshot-desktop";

export async function captureScreen() {
  try {
    const img = await screenshot({ format: "png" });
    const base64Image = img.toString("base64");
    return { image: base64Image, mimeType: "image/png" };
  } catch (err) {
    console.error("Error capturing screenshot:", err);
    throw err;
  }
}
