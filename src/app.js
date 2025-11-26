import express from "express"
import cors from 'cors'
import fs from "fs";
import path from "path";
import { scrapePosts } from "./linkedin_scraper.js";
import { sendMail } from "./sendMail.js";
import getISTTimestamp from "./utils/time.js";

const app = express()
app.use(express.json())
app.use(cors())

const emailFilePath = path.join(process.cwd(), "src", "emailSent.json");

app.get("/health", (req, res) => {
    res.json({ message: "Good" })
})


app.get("/", (req, res) => {
    res.sendFile(path.join(process.cwd(), "src/public", "index.html"));
});

app.get("/sent-emails", (req, res) => {
    if (!fs.existsSync(emailFilePath)) {
        return res.json({ today: [], yesterday: [], last7days: [] });
    }

    let data = JSON.parse(fs.readFileSync(emailFilePath));

    // Sort by newest first
    data.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

    const todayList = [];
    const yesterdayList = [];
    const last7daysList = [];

    const now = new Date();

    // Create dates normalized to midnight
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    data.forEach(item => {
        const sentDate = new Date(item.sentAt);

        // Normalize email date to midnight
        const d = new Date(sentDate.getFullYear(), sentDate.getMonth(), sentDate.getDate());

        if (d >= today) {
            todayList.push(item);
        } else if (d >= yesterday && d < today) {
            yesterdayList.push(item);
        } else if (d < yesterday && d >= sevenDaysAgo) {
            last7daysList.push(item);
        }
    });

    res.json({
        today: todayList,
        yesterday: yesterdayList,
        last7days: last7daysList,
    });
});


app.get("/send", async (req, res) => {
    console.log("api called")

    const emails = await scrapePosts();

    // Load sent emails file
    let sentEmails = [];
    if (fs.existsSync(emailFilePath)) {
        sentEmails = JSON.parse(fs.readFileSync(emailFilePath, "utf8"));
    }

    // Convert to set for fast lookup
    const sentSet = new Set(sentEmails.map(item => item.email));

    for (const email of emails) {

        // Skip if already sent
        if (sentSet.has(email)) {
            continue;
        }

        try {
            await sendMail(email);
            console.log("📨 Sent:", email);

            // Create timestamp
            const sentAt = getISTTimestamp()

            // Add to file memory
            sentEmails.push({ email, sentAt });

            // Save updated file
            fs.writeFileSync(emailFilePath, JSON.stringify(sentEmails, null, 2));

            console.log("⏳ waiting for 30 sec");
            await new Promise(res => setTimeout(res, 30000));

        } catch (err) {
            console.log("❌ Failed:", email, err.response || err);
        }
    }


    console.log({ message: '✅ completed' })
    res.json({ message: '✅ completed' });
})

app.delete("/clean", (req, res) => {
    if (!fs.existsSync(emailFilePath)) {
        return res.json({ deleted: 0, message: "No email file found" });
    }

    let data = JSON.parse(fs.readFileSync(emailFilePath, "utf8"));

    const now = new Date();
    const fiveDaysAgo = new Date(now);
    fiveDaysAgo.setDate(now.getDate() - 5);

    // Filter emails within last 5 days
    const filtered = data.filter(item => new Date(item.sentAt) >= fiveDaysAgo);

    const deletedCount = data.length - filtered.length;

    // Save updated file
    fs.writeFileSync(emailFilePath, JSON.stringify(filtered, null, 2));

    res.json({
        message: `Deleted ${deletedCount} old emails`,
        deleted: deletedCount
    });
});



export default app