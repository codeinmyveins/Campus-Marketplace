// Importing required modules
require("dotenv").config(); // Load environment variables from .env file
require('express-async-errors');
const express = require('express');
const path = require('path');
const fs = require("fs");
const pool = require("./db/database");
const loadCSVData = require("./db/loadCSVData");
const cookieParser = require('cookie-parser');

// security 
// const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
// const rateLimiter = require("express-rate-limit");

//routers
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const itemRoutes = require("./routes/items");
const cllgRoutes = require("./routes/colleges");

//middleware
const notFound = require("./middleware/not-found");
const errorHandlerMiddleware = require('./middleware/error-handler');

// app.use("/api", rateLimiter({
//     windowMs: 15 * 60 * 1000,
//     max: 100
// }));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(xss());

// Public frontend
const uploadDir = path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadDir));

app.use(express.static(path.join(__dirname, "./public")));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/colleges", cllgRoutes);

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "./public/index.html"));
});

app.get('/user', (req, res) => {
    res.redirect("/me");
});
app.get('/me', (req, res) => {
    res.sendFile(path.join(__dirname, "./public/profile.html"));
});
app.get('/user/:username', (req, res) => {
    res.sendFile(path.join(__dirname, "./public/profile.html"));
});

app.get("/surprise", (req, res) => {
    res.redirect("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
});

app.use(notFound);
app.use(errorHandlerMiddleware);

// Start the server
const start = async () => {

    try {
        await pool.query(fs.readFileSync("./db/init.sql").toString());
        await loadCSVData("universities", "id,name", "universities.csv", "uni_list_data");
        await loadCSVData("colleges", null, "colleges.csv", "cllg_list_data");
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server listening on port http://localhost:${PORT}...`);
        });
    } catch (error) {
        console.log(error)
    }

}

start();
