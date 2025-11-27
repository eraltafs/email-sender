import { Router } from "express";
import { deleteData, health, home, send, sentEmails } from "./controller.js";
const appRouter = Router()


appRouter.get("/health", health)
appRouter.get("/", home)
appRouter.get("/sent-emails", sentEmails)
appRouter.get("/send", send)
appRouter.delete("/clean", deleteData)


export default appRouter