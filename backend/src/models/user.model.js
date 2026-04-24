import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email:     { type: String, required: true, unique: true, lowercase: true },
  name:      { type: String, default: "" },
  picture:   { type: String, default: "" },
  google_id: { type: String, default: "" },
  password:  { type: String, default: "" }, // hashed; empty for Google-only accounts
  created_at:{ type: Date, default: Date.now },
}, {
  toJSON: {
    transform(_, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    },
  },
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
