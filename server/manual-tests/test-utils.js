import dotenv from "dotenv";

dotenv.config();

export const API_URL = process.env.API_URL || "http://localhost:3500";

export async function makeRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  return await response.text();
}

export function logTest(name, result) {
  console.log(`Test: ${name}`);
  console.log(`Result: ${result}\n`);
}
