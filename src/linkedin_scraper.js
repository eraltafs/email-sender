// linkedin_scraper.js
import fs from "fs";
import path from "path";
import { chromium } from "playwright";
const cookiesFilePath = path.join(process.cwd(), "src", "cookies.json");


const SEARCH_URL =
    "https://www.linkedin.com/search/results/content/?datePosted=%22past-24h%22&keywords=hiring%20%22nodejs%20developer%22&sortBy=%22date_posted%22";

export async function scrapePosts(maxScroll = 6) {
    console.log("🚀 Launching browser...");
    const startTime = Date.now()
    const browser = await chromium.launch({ headless: true });

    if (!fs.existsSync(cookiesFilePath)) {
        console.log("❌ cookies.json missing — pehle manually login karo aur cookies save karo.");
        process.exit(1);
    }

    const context = await browser.newContext({
        storageState: cookiesFilePath,
    });

    const page = await context.newPage();
    await page.goto(SEARCH_URL, { timeout: 60000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: "debug.png", fullPage: true });


    // ----- Scroll to load more posts -----
    for (let i = 0; i < maxScroll; i++) {
        await page.mouse.wheel(0, 3000);
        await page.waitForTimeout(2000);
    }

    const fullText = await page.evaluate(() => document.body.innerText);
    const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = fullText.match(EMAIL_REGEX) || [];
    const cleanedEmails = emails
        .map(e =>
            e
                .toLowerCase()
                .replace(/^[^a-z0-9]+/i, "") // 👈 remove -, •, 👉, etc from start
                .replace(/[^a-z0-9]+$/i, "") // 👈 remove trailing junk
        );

    const uniqueEmails = new Set(cleanedEmails);
    await browser.close();
    const ms = Date.now() - startTime;
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    console.log(`browser closed in ${min}m ${sec % 60}s`);

    return new Set(uniqueEmails);

}


