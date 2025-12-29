const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const User = require("./models/User");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("ResumeCraft AI Backend is running 🚀");
});

if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing");
}

if (!process.env.MONGO_URL) {
    console.error("❌ MONGO_URL is missing");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/generate", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt || typeof prompt !== "string") {
            return res.status(400).json({
                error: "Prompt is required and must be a string"
            });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash"   
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


mongoose
    .connect(process.env.MONGO_URL)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err.message);
    });


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

            

            return res.status(201).json({
                message: "New user created",
                isNewUser: true,
                user
            });
        }

        
        user.lastLogin = Date.now();
        await user.save();

        return res.status(200).json({
            message: "User already exists",
            isNewUser: false,
            user
        });

    } catch (err) {
        console.error("❌ Signup Error:", err);
        res.status(500).json({ error: "Database error" });
    }
});



app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
