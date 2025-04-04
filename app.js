// Importing required modules
require("dotenv").config(); // Load environment variables from .env file
require('express-async-errors');
const express = require('express');
const path = require('path');
const fs = require("fs");

// security 
// const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
// const rateLimiter = require("express-rate-limit");

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
// Middleware to parse JSON
app.use(express.json());

// Sample route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "./public/index.html"));
});

app.get("/surprise", (req, res) => {
    res.redirect("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
});

app.use(notFound);
app.use(errorHandlerMiddleware);

// Start the server
const start = async () => {

    try {
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server listening on port http://localhost:${PORT}...`);
        });
    } catch (error) {
        console.log(error)
    }

}

start();
