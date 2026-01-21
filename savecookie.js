import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const cookiesPath = path.join(process.cwd(), "src", "cookies.json");

(async () => {
  const browser = await chromium.launch({
    headless: false, // 👈 IMPORTANT (browser dikhega)
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // LinkedIn login page
  await page.goto("https://www.linkedin.com/login");

  console.log("🔐 Login manually, then press ENTER in terminal");

  // ⏸️ Wait until you login manually
  await new Promise(resolve => process.stdin.once("data", resolve));

  // Save cookies
  await context.storageState({ path: cookiesPath });

  console.log("✅ cookies.json saved at:", cookiesPath);

  await browser.close();
})();
