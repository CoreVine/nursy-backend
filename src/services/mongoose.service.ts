import mongoose from "mongoose"

export async function testMongooseConnection(): Promise<void> {
  try {
    const dbUri = process.env.MONGOOSE_URI || "mongodb://localhost:27017/mydatabase"
    await mongoose.connect(dbUri)
    console.log("✅ Mongoose connection successful")
  } catch (error) {
    console.error("❌ Mongoose connection failed:", error)
    throw error
  }
}
