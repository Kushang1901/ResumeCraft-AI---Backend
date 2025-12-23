const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const User = require("./models/User");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ---------- MIDDLEWARE ---------- */
app.use(cors({ origin: "*" }));
app.use(express.json());

/* ---------- ROOT ROUTE ---------- */
app.get("/", (req, res) => {
    res.send("ResumeCraft AI Backend is running 🚀");
});

/* ---------- GEMINI SETUP ---------- */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ---------- AI GENERATE ROUTE ---------- */
app.post("/generate", async (req, res) => {
    try {
        const { prompt } = req.body;

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const response = await model.generateContent(prompt);

        res.status(200).json({
            result: response.response.text()
        });

    } catch (err) {
        console.error("AI Error:", err);
        res.status(500).json({ error: "AI request failed" });
    }
});

/* ---------- MONGODB ---------- */
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log("MongoDB Error:", err));

/* ---------- SIGNUP ROUTE ---------- */
app.post("/signup", async (req, res) => {
    try {
        const { firstName, lastName, email, provider } = req.body;

        let user = await User.findOne({ email });

        if (!user) {
            user = new User({
                firstName,
                lastName,
                email,
                provider,
                lastLogin: Date.now()
            });
            await user.save();
        } else {
            user.lastLogin = Date.now();
            await user.save();
        }

        res.status(200).json({
            message: "User saved successfully",
            user
        });

    } catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

/* ---------- START SERVER ---------- */
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
