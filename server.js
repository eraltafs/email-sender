import app from "./src/app.js"
import "./src/cron.service.js";
const PORT = process.env.PORT

app.listen(PORT, () => {
    console.log("listening on", PORT)
})
