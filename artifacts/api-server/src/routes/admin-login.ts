import { Router } from "express";
import { randomUUID } from "crypto";
import { addToken, removeToken, requireAdmin } from "../middleware/admin-auth";

const router = Router();

router.post("/login", (req, res) => {
  const { password } = req.body as { password?: string };
  const adminPassword = process.env["ADMIN_PASSWORD"];

  if (!adminPassword) {
    res.status(503).json({ error: "Admin password not configured" });
    return;
  }

  if (!password || password !== adminPassword) {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }

  const token = randomUUID();
  addToken(token);
  res.json({ token });
});

router.delete("/logout", requireAdmin, (req, res) => {
  const auth = req.headers["authorization"]!;
  const token = auth.slice(7);
  removeToken(token);
  res.status(204).send();
});

export default router;
