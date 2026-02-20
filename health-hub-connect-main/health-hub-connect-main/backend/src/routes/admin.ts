import { Router, Response } from "express";
import db from "../database";
import { AuthRequest, authenticateToken, authorize } from "../middleware/auth";

const router = Router();

// All admin routes require admin role
router.use(authenticateToken, authorize("admin"));

// GET /api/admin/stats — system-wide analytics
router.get("/stats", (_req: AuthRequest, res: Response) => {
    try {
        const totalPatients = (db.prepare("SELECT COUNT(*) as c FROM patients").get() as any).c;
        const totalUsers = (db.prepare("SELECT COUNT(*) as c FROM users").get() as any).c;
        const totalHospitals = (db.prepare("SELECT COUNT(*) as c FROM hospitals").get() as any).c;
        const totalAppointments = (db.prepare("SELECT COUNT(*) as c FROM appointments").get() as any).c;
        const totalSOS = (db.prepare("SELECT COUNT(*) as c FROM emergency_sos").get() as any).c;
        const pendingSOS = (db.prepare("SELECT COUNT(*) as c FROM emergency_sos WHERE status = 'Pending'").get() as any).c;
        const resolvedSOS = (db.prepare("SELECT COUNT(*) as c FROM emergency_sos WHERE status = 'Resolved'").get() as any).c;
        const totalBeds = (db.prepare("SELECT SUM(total) as t, SUM(available) as a, SUM(occupied) as o FROM beds").get() as any);

        const appointmentsByStatus = db.prepare(`
      SELECT status, COUNT(*) as count FROM appointments GROUP BY status
    `).all();

        const sosByType = db.prepare(`
      SELECT emergency_type, COUNT(*) as count FROM emergency_sos GROUP BY emergency_type
    `).all();

        const usersByRole = db.prepare(`
      SELECT role, COUNT(*) as count FROM users GROUP BY role
    `).all();

        const recentActivity = db.prepare(`
      SELECT al.*, u.name as user_name FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC LIMIT 20
    `).all();

        return res.json({
            overview: {
                totalPatients,
                totalUsers,
                totalHospitals,
                totalAppointments,
                totalSOS,
                pendingSOS,
                resolvedSOS,
                beds: { total: totalBeds.t || 0, available: totalBeds.a || 0, occupied: totalBeds.o || 0 },
            },
            charts: {
                appointmentsByStatus,
                sosByType,
                usersByRole,
            },
            recentActivity,
        });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to fetch stats", details: err.message });
    }
});

// GET /api/admin/users — list all users
router.get("/users", (_req: AuthRequest, res: Response) => {
    try {
        const users = db.prepare(`
      SELECT id, name, email, role, hospital_id, created_at FROM users ORDER BY created_at DESC
    `).all();
        return res.json({ users });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to fetch users", details: err.message });
    }
});

// PUT /api/admin/users/:id/role — change user role
router.put("/users/:id/role", (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { role, hospital_id } = req.body;

        const validRoles = ["public", "patient", "doctor", "hospital_staff", "admin"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
        }

        const user = db.prepare("SELECT id FROM users WHERE id = ?").get(id);
        if (!user) return res.status(404).json({ error: "User not found" });

        db.prepare("UPDATE users SET role = ?, hospital_id = ?, updated_at = datetime('now') WHERE id = ?").run(role, hospital_id || null, id);

        return res.json({ message: "User role updated" });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to update user role", details: err.message });
    }
});

// DELETE /api/admin/users/:id — delete user
router.delete("/users/:id", (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        if (Number(id) === req.user?.id) {
            return res.status(400).json({ error: "Cannot delete your own account" });
        }
        const result = db.prepare("DELETE FROM users WHERE id = ?").run(id);
        if (result.changes === 0) return res.status(404).json({ error: "User not found" });
        return res.json({ message: "User deleted" });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to delete user", details: err.message });
    }
});

// GET /api/admin/hospitals — list & manage hospitals
router.get("/hospitals", (_req: AuthRequest, res: Response) => {
    try {
        const hospitals = db.prepare("SELECT * FROM hospitals ORDER BY name").all();
        return res.json({ hospitals });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to fetch hospitals", details: err.message });
    }
});

// POST /api/admin/hospitals — add hospital
router.post("/hospitals", (req: AuthRequest, res: Response) => {
    try {
        const { name, address, city, state, phone, type, latitude, longitude, total_beds } = req.body;
        if (!name) return res.status(400).json({ error: "Hospital name is required" });

        const result = db.prepare(`
      INSERT INTO hospitals (name, address, city, state, phone, type, latitude, longitude, total_beds)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, address, city, state, phone, type || "General", latitude, longitude, total_beds || 0);

        const hospital = db.prepare("SELECT * FROM hospitals WHERE id = ?").get(result.lastInsertRowid);
        return res.status(201).json({ message: "Hospital added", hospital });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to add hospital", details: err.message });
    }
});

// GET /api/admin/audit-logs — access logs
router.get("/audit-logs", (_req: AuthRequest, res: Response) => {
    try {
        const logs = db.prepare(`
      SELECT al.*, u.name as user_name, u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 100
    `).all();
        return res.json({ logs });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to fetch audit logs", details: err.message });
    }
});

export default router;
