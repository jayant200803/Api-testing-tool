import express from "express";
import cors from "cors";
import proxyRoutes from "./routes/proxy.routes.js";
import historyRoutes from "./routes/history.routes.js";
import collectionsRoutes from "./routes/collections.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ROUTES
app.use("/api/proxy", proxyRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/collections", collectionsRoutes);

app.get("/", (req, res) => {
  res.send("API Testing Tool Backend Running");
});

app.listen(PORT, () => {
  console.log("Backend listening on", PORT);
});
