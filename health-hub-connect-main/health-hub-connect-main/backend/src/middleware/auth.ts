import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
        role: string;
        hospital_id?: number;
    };
}

const JWT_SECRET = process.env.JWT_SECRET || "healthhub_fallback_secret";

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: "Access token required" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest["user"];
        req.user = decoded;
        next();
    } catch {
        return res.status(403).json({ error: "Invalid or expired token" });
    }
}

export function authorize(...roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Access denied. Required role: ${roles.join(" or ")}`,
                yourRole: req.user.role,
            });
        }
        next();
    };
}

export function logAction(action: string, resource: string) {
    return (req: AuthRequest, _res: Response, next: NextFunction) => {
        const db = require("../database").default;
        try {
            db.prepare(`
        INSERT INTO audit_logs (user_id, action, resource, resource_id, ip_address, details)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
                req.user?.id || null,
                action,
                resource,
                (req.params?.id as string) || null,
                req.ip,
                JSON.stringify({ method: req.method, path: req.path })
            );
        } catch (_) { }
        next();
    };
}
