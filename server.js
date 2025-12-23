const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require("mongoose");
const User = require("./models/User");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/generate", async (req, res) => {
    try {
        const { prompt } = req.body;

        const model = genAI.getGenerativeModel({
            model: "gemini-pro",
        });

        const response = await model.generateContent(prompt);

        res.json({ result: response.response.text() });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "AI request failed" });
    }
});

mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log("MongoDB Error:", err));


app.post("/signup", async (req, res) => {
    try {
        const { firstName, lastName, email, provider } = req.body;

        let user = await User.findOne({ email });

        if (!user) {
            user = new User({
                firstName,
                lastName,
                email,
                provider
            });
            await user.save();
        } else {
            user.lastLogin = Date.now();
            await user.save();
        }

        res.status(200).json({ message: "User saved", user });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "DB error" });
    }
});

app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});
