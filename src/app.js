import express from "express"
import cors from 'cors'
import dotenv from "dotenv";
import appRouter from "./routes.js";
dotenv.config();

const app = express()
app.use(express.json())
app.use(cors())
app.use("/", appRouter)


export default app