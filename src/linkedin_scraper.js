// linkedin_scraper.js
import fs from "fs";
import path from "path";
import { chromium } from "playwright";
const cookiesFilePath = path.join(process.cwd(), "src", "cookies.json");


const SEARCH_URL =
    "https://www.linkedin.com/search/results/content/?datePosted=%22past-24h%22&keywords=hiring%20%22nodejs%20developer%22&origin=FACETED_SEARCH&sid=RUH&sortBy=%22date_posted%22";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function extractContacts(text) {
    const emails = text.match(EMAIL_REGEX);
    return emails ? emails[0] : null;
}

export async function scrapePosts(maxScroll = 6) {
    console.log("🚀 Launching browser...");
    const startTime = Date.now()
    const browser = await chromium.launch({
        channel: "chrome",
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });


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

    // ----- Scroll to load more posts -----
    for (let i = 0; i < maxScroll; i++) {
        await page.mouse.wheel(0, 3000);
        await page.waitForTimeout(2000);
    }

    // ----- Frame detection -----
    const frames = page.frames();

    let contentFrame = frames.find(f =>
        f.url().includes("search/results/content")
    );

    if (!contentFrame) {
        for (let f of frames) {
            try {
                const count = await f.locator("div.scaffold-finite-scroll__content").count();
                if (count > 0) {
                    contentFrame = f;
                    break;
                }
            } catch { }
        }
    }

    if (!contentFrame) {
        console.log("❌ Could not find content frame");
        await browser.close();
        return [];
    }

    // ----- Select post containers -----
    const postLocator = contentFrame.locator(
        "div.feed-shared-update-v2, div.update-components-card"
    );

    const total = await postLocator.count();

    const postsData = new Set();

    for (let i = 0; i < total; i++) {
        try {
            const post = postLocator.nth(i);
            const text = await post.innerText({ timeout: 2000 });

            const email = extractContacts(text);
            if (email) postsData.add(email);

        } catch (e) {
            continue;
        }
    }

    await browser.close();
    const ms = Date.now() - startTime;
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);

    console.log(`browser closed in ${min}m ${sec % 60}s`);

    return postsData;
}


