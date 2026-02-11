// const { MongoClient, ServerApiVersion } = require('mongodb');
// const uri = "mongodb://localhost:27017/";
// // const uri = "mongodb+srv://daniyal:system123@cluster0.icegyb7.mongodb.net/?appName=Cluster0";
// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//     serverApi: {
//         version: ServerApiVersion.v1,
//         strict: true,
//         deprecationErrors: true,
//     }
// });

// let db;

// async function connectDB() {
//     try {
//         await client.connect();
//         db = client.db("yourDatabaseName");
//         console.log(" MongoDB connected successfully");
//     } catch (error) {
//         console.error("MongoDB connection failed:", error);
//         process.exit(1);
//     }
// }

// function getDB() {
//     if (!db) throw new Error("Database not initialized");
//     return db;
// }

// module.exports = { connectDB, getDB };


const mongoose = require("mongoose")
// const uri = "mongodb://localhost:27017/";
const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/")
    console.log("MongoDB connected successfully (Mongoose)")
  } catch (error) {
    console.error("MongoDB connection failed:", error.message)
    process.exit(1)
  }
}

module.exports = connectDB