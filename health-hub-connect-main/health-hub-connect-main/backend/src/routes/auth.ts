import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../database";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import dotenv from "dotenv";
dotenv.config();

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "healthhub_fallback_secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "healthhub_refresh_fallback";

function generateTokens(user: { id: number; email: string; role: string; hospital_id?: number }) {
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role, hospital_id: user.hospital_id },
        JWT_SECRET,
        { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
        { id: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );
    return { accessToken, refreshToken };
}

// POST /api/auth/register
router.post("/register", async (req, res: Response) => {
    try {
        const { name, email, password, role = "patient", hospital_id } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email and password are required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
        if (existing) {
            return res.status(409).json({ error: "Email already registered" });
        }

        const password_hash = await bcrypt.hash(password, 12);
        const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, hospital_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, email, password_hash, role, hospital_id || null);

        const userId = result.lastInsertRowid as number;

        // Auto-create patient profile if role is patient
        if (role === "patient") {
            const healthId = `ABHA-${new Date().getFullYear()}-${String(userId).padStart(6, "0")}`;
            db.prepare(`
        INSERT INTO patients (user_id, health_id, name, email)
        VALUES (?, ?, ?, ?)
      `).run(userId, healthId, name, email);
        }

        const user = db.prepare("SELECT id, name, email, role, hospital_id FROM users WHERE id = ?").get(userId) as any;
        const { accessToken, refreshToken } = generateTokens(user);

        // Store refresh token
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        db.prepare("INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)").run(userId, refreshToken, expiresAt);

        return res.status(201).json({
            message: "Registration successful",
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            accessToken,
            refreshToken,
        });
    } catch (err: any) {
        console.error("Register error:", err);
        return res.status(500).json({ error: "Registration failed", details: err.message });
    }
});

// POST /api/auth/login
router.post("/login", async (req, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const { accessToken, refreshToken } = generateTokens(user);

        // Store refresh token
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        db.prepare("INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)").run(user.id, refreshToken, expiresAt);

        // Log the action
        db.prepare(`INSERT INTO audit_logs (user_id, action, resource, ip_address) VALUES (?, ?, ?, ?)`).run(
            user.id, "LOGIN", "auth", req.ip
        );

        return res.json({
            message: "Login successful",
            user: { id: user.id, name: user.name, email: user.email, role: user.role, hospital_id: user.hospital_id },
            accessToken,
            refreshToken,
        });
    } catch (err: any) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Login failed" });
    }
});

// POST /api/auth/refresh
router.post("/refresh", (req, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: "Refresh token required" });

    try {
        const tokenRow = db.prepare("SELECT * FROM refresh_tokens WHERE token = ?").get(refreshToken) as any;
        if (!tokenRow || new Date(tokenRow.expires_at) < new Date()) {
            return res.status(403).json({ error: "Invalid or expired refresh token" });
        }

        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: number };
        const user = db.prepare("SELECT id, email, role, hospital_id FROM users WHERE id = ?").get(decoded.id) as any;
        if (!user) return res.status(403).json({ error: "User not found" });

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

        // Rotate refresh token
        db.prepare("DELETE FROM refresh_tokens WHERE token = ?").run(refreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        db.prepare("INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)").run(user.id, newRefreshToken, expiresAt);

        return res.json({ accessToken, refreshToken: newRefreshToken });
    } catch {
        return res.status(403).json({ error: "Invalid refresh token" });
    }
});

// POST /api/auth/logout
router.post("/logout", authenticateToken, (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        db.prepare("DELETE FROM refresh_tokens WHERE token = ?").run(refreshToken);
    }
    db.prepare(`INSERT INTO audit_logs (user_id, action, resource) VALUES (?, ?, ?)`).run(req.user?.id, "LOGOUT", "auth");
    return res.json({ message: "Logged out successfully" });
});

// GET /api/auth/me
router.get("/me", authenticateToken, (req: AuthRequest, res: Response) => {
    const user = db.prepare("SELECT id, name, email, role, hospital_id, created_at FROM users WHERE id = ?").get(req.user?.id) as any;
    if (!user) return res.status(404).json({ error: "User not found" });

    // Get patient profile if applicable
    let patientProfile = null;
    if (user.role === "patient") {
        patientProfile = db.prepare("SELECT * FROM patients WHERE user_id = ?").get(user.id);
    }

    return res.json({ user, patientProfile });
});

// PUT /api/auth/change-password
router.put("/change-password", authenticateToken, async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new password required" });
    }

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user?.id) as any;
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Current password is incorrect" });

    const newHash = await bcrypt.hash(newPassword, 12);
    db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(newHash, req.user?.id);

    return res.json({ message: "Password updated successfully" });
});

export default router;
