import cron from "node-cron";
import { send } from "./controller.js";

cron.schedule("0 11,14,17,22 * * *", async () => {
  console.log("⏰ Cron triggered: scraping and sending emails...");
  await send();
}, {
  timezone: "Asia/Kolkata"
});
