import { Router } from "express";
import { requireAdmin } from "../middleware/admin-auth";

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

  res.json({ token: adminPassword });
});

router.delete("/logout", requireAdmin, (_req, res) => {
  res.status(204).send();
});

export default router;
