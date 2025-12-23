const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const User = require("./models/User");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

/* ---------- MIDDLEWARE ---------- */
app.use(cors());
app.use(express.json());

/* ---------- ROOT ROUTE ---------- */
app.get("/", (req, res) => {
    res.send("ResumeCraft AI Backend is running 🚀");
});

/* ---------- ENV VALIDATION ---------- */
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing");
}

if (!process.env.MONGO_URL) {
    console.error("❌ MONGO_URL is missing");
}

/* ---------- GEMINI SETUP ---------- */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ---------- AI GENERATE ROUTE ---------- */
app.post("/generate", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt || typeof prompt !== "string") {
            return res.status(400).json({
                error: "Prompt is required and must be a string"
            });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash"   // ✅ UPDATED MODEL
        });

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        res.status(200).json({ result: text });

    } catch (err) {
        console.error("🔥 Gemini API Error:", err);

        res.status(500).json({
            error: "AI request failed",
            details: err.message
        });
    }
});

/* ---------- MONGODB CONNECTION ---------- */
mongoose
    .connect(process.env.MONGO_URL)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err.message);
    });

/* ---------- SIGNUP ROUTE ---------- */
app.post("/signup", async (req, res) => {
    try {
        const { firstName, lastName, email, provider } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

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
        console.error("❌ Signup Error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

/* ---------- START SERVER ---------- */
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
