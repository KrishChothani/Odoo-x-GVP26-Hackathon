import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config({ path: ".env" });

connectDB()
  .then(() => {
    const PORT = 2590;
    app.listen(PORT, () => {
       console.log(`Server started on port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the database:", error);
  });

app.get("/", (req, res) => {
  res.send("Welcome to emissionX");
});
