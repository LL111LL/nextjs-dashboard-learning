import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:3000",
    browserName: "chromium",
  },
  webServer: {
  command: "npm run start -- --port 3000",
  url: "http://localhost:3000/api/health",
  timeout: 60_000,
},
});