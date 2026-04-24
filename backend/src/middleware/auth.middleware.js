import jwt from "jsonwebtoken";

const secret = () => process.env.JWT_SECRET || "dev-fallback-secret-change-in-prod";

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    req.user = jwt.verify(auth.slice(7), secret());
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function optionalAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    try { req.user = jwt.verify(auth.slice(7), secret()); } catch {}
  }
  next();
}

export function signToken(payload) {
  return jwt.sign(payload, secret(), { expiresIn: "30d" });
}
