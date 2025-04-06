// Importing required modules
require("dotenv").config(); // Load environment variables from .env file
require('express-async-errors');
const express = require('express');
const path = require('path');
const fs = require("fs");
const pool = require("./db/database");
const cookieParser = require('cookie-parser');

// security 
// const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
// const rateLimiter = require("express-rate-limit");

//routers
const authRoutes = require("./routes/auth");

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
app.use(express.static(path.join(__dirname, "./public")));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);

// Sample route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "./public/index.html"));
});

app.get('/user', async (req, res) => {

    try {
        const newUser = await pool.query("INSERT INTO users (username, full_name, email, password, dob, country_code, phone, college_name, gender) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING to_char(dob, \'DD-MM-YYYY\') as dob_date, *",
            ["me1", "my name", "email@email.com", "123456789", "2004/11/11", "IN", "+91 9849248704", "my college", "male"]
        )
        res.status(200).json({ newUser });
    } catch (error) {
        res.status(200).json({ error });
    }

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
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server listening on port http://localhost:${PORT}...`);
        });
    } catch (error) {
        console.log(error)
    }

}

start();
