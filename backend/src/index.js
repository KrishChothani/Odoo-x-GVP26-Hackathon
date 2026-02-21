import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

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
