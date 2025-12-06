import express, { Request, Response } from "express";
import { userModel } from "./db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { GoogleGenAI } from "@google/genai";
import cors from "cors";
import { writeFileSync } from "fs";
import deployHtmlFileToVercel from "./deploy";

const app = express();
const PORT = 5000;
const History:any = []
// ---------------- MIDDLEWARE ----------------
app.use(express.json({ limit: "20mb" })); // Increase limit to handle large Base64 images
app.use(cors());

// ---------------- GOOGLE AI ----------------
const ai = new GoogleGenAI({ apiKey: "AIzaSyBnUE5z3gdxq_f8JoVjjDsAx4-CvjkwRfM" });

// ---------------- FUNCTIONS ----------------

// Text-to-HTML
async function textToHtml(prompt: string): Promise<string> {

  History.push({
    role:'user',
    parts:[{text:prompt}]
  })
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

  if (!response.text) throw new Error("AI returned empty response");
  
  History.push({
    role:'model',
    parts:[{text:response.text}]
  })
  return response.text;
}

// Image(Base64)-to-HTML
async function imageToHtml(base64Image: string): Promise<string> {
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

  if (!response.text) throw new Error("AI returned empty response");
  return response.text;
}

// ---------------- ROUTES ----------------
app.get("/", (_req: Request, res: Response) => {
  res.send("Server is running!");
});

// ---------------- SIGNUP ----------------
app.post("/api/signup", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ msg: "Username & password required" });

    const existingUser = await userModel.findOne({ username });
    if (existingUser) return res.status(409).json({ msg: "User already exists" });

    const hashPassword = await bcrypt.hash(password, 5);
    await userModel.create({ username, password: hashPassword });

    res.json({ msg: "Signed up successfully" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: "Signup failed", error: err.message });
  }
});

// ---------------- SIGNIN ----------------
app.post("/api/signin", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ msg: "Username & password required" });

    const user = await userModel.findOne({ username });
    if (!user) return res.status(404).json({ msg: "User not found" });

    //@ts-ignore
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, "antigravity", { expiresIn: "1d" });
    res.json({ token });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: "Signin failed", error: err.message });
  }
});

// ---------------- PROCESS TEXT ----------------
app.post("/api/process", async (req: Request, res: Response) => {
  try {
    const { userInput } = req.body;
    if (!userInput || typeof userInput !== "string") return res.status(400).json({ msg: "userInput required" });

    const html = await textToHtml(userInput);
    writeFileSync("./index.html", html, { encoding: "utf8" });

    res.json({ result: html });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: "Text processing failed", error: err.message });
  }
});

// ---------------- PROCESS IMAGE ----------------
app.post("/api/process-image", async (req: Request, res: Response) => {
  try {
    const { base64Image } = req.body;
    if (!base64Image || typeof base64Image !== "string") return res.status(400).json({ msg: "base64Image required" });

    const html = await imageToHtml(base64Image);
    writeFileSync("./index.html", html, { encoding: "utf8" });

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: "Image processing failed", error: err.message });
  }
});

// ---------------- DEPLOY ----------------
app.post("/api/deploy", async (req: Request, res: Response) => {
  try {
    const { deploymentName } = req.body;
    if (!deploymentName) return res.status(400).json({ msg: "Deployment name required" });

    await deployHtmlFileToVercel("./index.html", deploymentName);

    res.json({
      msg: "Deployment successful",
      deploymentUrl: `https://${deploymentName}.vercel.app/`,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: "Deployment failed", error: err.message });
  }
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
