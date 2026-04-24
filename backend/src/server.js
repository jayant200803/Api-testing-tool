import express from "express";
import cors from "cors";
import proxyRoutes from "./routes/proxy.routes.js";
import historyRoutes from "./routes/history.routes.js";
import collectionsRoutes from "./routes/collections.routes.js";
import environmentsRoutes from "./routes/environments.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/proxy", proxyRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/collections", collectionsRoutes);
app.use("/api/environments", environmentsRoutes);

app.get("/", (req, res) => res.send("API Studio Backend Running"));

app.listen(PORT, () => console.log("Backend listening on port", PORT));
