require("dotenv").config()
const express = require("express")
const cors = require("cors")
const path = require("path") 
const app = express()
const connectDB  = require("./config/db");

const authRoutes = require("./routes/authRoutes")
const userRoutes = require("./routes/userRoutes")
const taskRoutes = require("./routes/taskRoutes")


// Middleware to handle CORS
app.use(cors({
    origin:process.env.CLIENT_URL || "*",
    methods:["GET","POST","PUT","DELETE"],
    allowedHeaders:["content-type","Authorization"],
}))

// connect db
connectDB()

//Middleware
app.use(express.json())



// Routes
app.use("/api/auth",authRoutes)
app.use("/api/users",userRoutes)
app.use("/api/tasks",taskRoutes)
// app.use("api/reports",reportRoutes)

//Start Server
const PORT = process.env.PORT|| 5000

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
  });
});
