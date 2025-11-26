import nodemailer from "nodemailer";
import { htmlTemp } from "./tempate.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function sendMail(to) {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    return transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject: "Application for Node.js Developer",
        html: htmlTemp,
        attachments: [
            {
                filename: "Altaf_Khan_Resume.pdf",
                path: path.join(__dirname, "Altaf_Khan_Resume.pdf")
            }
        ]
    });
}
