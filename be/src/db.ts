import mongoose, { model, Schema } from "mongoose";

mongoose.connect("mongodb://localhost:27017/antigravity");

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: String,
});

export const userModel = model("users", userSchema);
