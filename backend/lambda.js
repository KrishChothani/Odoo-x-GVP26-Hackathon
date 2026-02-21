import serverless from "serverless-http";
import { app } from "./src/app.js";
import connectDB from "./src/db/index.js";

let isDbConnected = false;

const apphandler = async (event, context) => {
  if (!isDbConnected) {
    await connectDB();
    isDbConnected = true;
  }

  return await serverless(app)(event, context);
};

export const handler = apphandler;
