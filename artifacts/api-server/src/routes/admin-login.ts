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

  req.session.isAdmin = true;
  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Session error" });
      return;
    }
    res.json({ ok: true });
  });
});

router.get("/me", (req, res) => {
  if (!req.session?.isAdmin) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ isAdmin: true });
});

router.delete("/logout", requireAdmin, (req, res) => {
  req.session.destroy(() => {
    res.status(204).send();
  });
});

export default router;
