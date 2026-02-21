import mongoose from 'mongoose';
import { DB_NAME } from '../Constants.js';

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables. Please check your .env file.");
    }

    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );

    console.log(`\n✅ MongoDB Connected Successfully!`);
    console.log(`   DB Host : ${connectionInstance.connection.host}`);
    console.log(`   DB Name : ${DB_NAME}\n`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;