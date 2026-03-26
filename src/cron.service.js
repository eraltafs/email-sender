import cron from "node-cron";
import { processEmails } from "./controller.js";

cron.schedule(
  "*/20 * * * *",
  async () => {
    console.log("⏰ Cron triggered");
    await processEmails();
  },
  { timezone: "Asia/Kolkata" }
);

