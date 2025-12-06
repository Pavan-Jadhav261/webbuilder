"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("./db");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const genai_1 = require("@google/genai");
const cors_1 = __importDefault(require("cors"));
const fs_1 = require("fs");
const deploy_1 = __importDefault(require("./deploy"));
const app = (0, express_1.default)();
const PORT = 5000;
const History = [];
// ---------------- MIDDLEWARE ----------------
app.use(express_1.default.json({ limit: "20mb" })); // Increase limit to handle large Base64 images
app.use((0, cors_1.default)());
// ---------------- GOOGLE AI ----------------
const ai = new genai_1.GoogleGenAI({ apiKey: "AIzaSyBnUE5z3gdxq_f8JoVjjDsAx4-CvjkwRfM" });
// ---------------- FUNCTIONS ----------------
// Text-to-HTML
async function textToHtml(prompt) {
    History.push({
        role: 'user',
        parts: [{ text: prompt }]
    });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        //@ts-ignore
        contents: History,
        config: {
            systemInstruction: `
You are a professional web developer AI. Generate a complete HTML file with inline CSS and JS
based on the user prompt. Output code only, ready to save as .html file.and dont use words like html at the staring `,
        },
    });
    if (!response.text)
        throw new Error("AI returned empty response");
    History.push({
        role: 'model',
        parts: [{ text: response.text }]
    });
    return response.text;
}
// Image(Base64)-to-HTML
async function imageToHtml(base64Image) {
    const contents = [
        {
            inlineData: { mimeType: "image/jpeg", data: base64Image },
        },
        { text: "Convert this sketch into a complete HTML/CSS/JS website" },
    ];
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
            systemInstruction: `
You are a professional web developer. I will provide a rough sketch image.
Generate a complete HTML file with inline CSS and JS. Do not explain, no JSON, no markdown.
      `,
        },
    });
    if (!response.text)
        throw new Error("AI returned empty response");
    return response.text;
}
// ---------------- ROUTES ----------------
app.get("/", (_req, res) => {
    res.send("Server is running!");
});
// ---------------- SIGNUP ----------------
app.post("/api/signup", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password)
            return res.status(400).json({ msg: "Username & password required" });
        const existingUser = await db_1.userModel.findOne({ username });
        if (existingUser)
            return res.status(409).json({ msg: "User already exists" });
        const hashPassword = await bcrypt_1.default.hash(password, 5);
        await db_1.userModel.create({ username, password: hashPassword });
        res.json({ msg: "Signed up successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Signup failed", error: err.message });
    }
});
// ---------------- SIGNIN ----------------
app.post("/api/signin", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password)
            return res.status(400).json({ msg: "Username & password required" });
        const user = await db_1.userModel.findOne({ username });
        if (!user)
            return res.status(404).json({ msg: "User not found" });
        //@ts-ignore
        const isValid = await bcrypt_1.default.compare(password, user.password);
        if (!isValid)
            return res.status(401).json({ msg: "Invalid credentials" });
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, "antigravity", { expiresIn: "1d" });
        res.json({ token });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Signin failed", error: err.message });
    }
});
// ---------------- PROCESS TEXT ----------------
app.post("/api/process", async (req, res) => {
    try {
        const { userInput } = req.body;
        if (!userInput || typeof userInput !== "string")
            return res.status(400).json({ msg: "userInput required" });
        const html = await textToHtml(userInput);
        (0, fs_1.writeFileSync)("./index.html", html, { encoding: "utf8" });
        res.json({ result: html });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Text processing failed", error: err.message });
    }
});
// ---------------- PROCESS IMAGE ----------------
app.post("/api/process-image", async (req, res) => {
    try {
        const { base64Image } = req.body;
        if (!base64Image || typeof base64Image !== "string")
            return res.status(400).json({ msg: "base64Image required" });
        const html = await imageToHtml(base64Image);
        (0, fs_1.writeFileSync)("./index.html", html, { encoding: "utf8" });
        res.setHeader("Content-Type", "text/html");
        res.send(html);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Image processing failed", error: err.message });
    }
});
// ---------------- DEPLOY ----------------
app.post("/api/deploy", async (req, res) => {
    try {
        const { deploymentName } = req.body;
        if (!deploymentName)
            return res.status(400).json({ msg: "Deployment name required" });
        await (0, deploy_1.default)("./index.html", deploymentName);
        res.json({
            msg: "Deployment successful",
            deploymentUrl: `https://${deploymentName}.vercel.app/`,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Deployment failed", error: err.message });
    }
});
// ---------------- START SERVER ----------------
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map