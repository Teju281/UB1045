import { Router, Response } from "express";
import db from "../database";
import { AuthRequest, authenticateToken } from "../middleware/auth";

const router = Router();

// GET /api/staff/patients — patients admitted at hospital (staff/doctor)
router.get("/patients", authenticateToken, (req: AuthRequest, res: Response) => {
    if (!["hospital_staff", "doctor", "admin"].includes(req.user?.role || "")) {
        return res.status(403).json({ error: "Staff access required" });
    }

    try {
        const patients = db.prepare(`
      SELECT p.*, u.email as user_email
      FROM patients p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.name
    `).all() as any[];

        const result = patients.map((p) => ({
            ...p,
            allergies: JSON.parse(p.allergies || "[]"),
            chronic_conditions: JSON.parse(p.chronic_conditions || "[]"),
        }));

        return res.json({ patients: result, total: result.length });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to fetch patients", details: err.message });
    }
});

// GET /api/staff/tasks — get tasks for current staff member
router.get("/tasks", authenticateToken, (req: AuthRequest, res: Response) => {
    if (!["hospital_staff", "doctor", "admin"].includes(req.user?.role || "")) {
        return res.status(403).json({ error: "Staff access required" });
    }

    try {
        const { role, id } = req.user!;
        let tasks;

        if (role === "admin") {
            tasks = db.prepare(`
        SELECT t.*, u.name as assigned_to_name, h.name as hospital_name
        FROM staff_tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN hospitals h ON t.hospital_id = h.id
        ORDER BY t.created_at DESC
      `).all();
        } else {
            tasks = db.prepare(`
        SELECT t.*, u.name as assigned_to_name, h.name as hospital_name
        FROM staff_tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN hospitals h ON t.hospital_id = h.id
        WHERE t.assigned_to = ?
        ORDER BY t.created_at DESC
      `).all(id);
        }

        return res.json({ tasks });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to fetch tasks", details: err.message });
    }
});

// POST /api/staff/tasks — create task (admin/staff)
router.post("/tasks", authenticateToken, (req: AuthRequest, res: Response) => {
    if (!["hospital_staff", "admin"].includes(req.user?.role || "")) {
        return res.status(403).json({ error: "Staff or Admin access required" });
    }

    try {
        const { assigned_to, hospital_id, patient_id, task_type, description, priority = "Normal", due_at } = req.body;

        if (!assigned_to || !task_type) {
            return res.status(400).json({ error: "assigned_to and task_type are required" });
        }

        const result = db.prepare(`
      INSERT INTO staff_tasks (assigned_to, hospital_id, patient_id, task_type, description, priority, due_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(assigned_to, hospital_id || null, patient_id || null, task_type, description || null, priority, due_at || null);

        const task = db.prepare("SELECT * FROM staff_tasks WHERE id = ?").get(result.lastInsertRowid);
        return res.status(201).json({ message: "Task created", task });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to create task", details: err.message });
    }
});

// PUT /api/staff/tasks/:id — update task status
router.put("/tasks/:id", authenticateToken, (req: AuthRequest, res: Response) => {
    if (!["hospital_staff", "doctor", "admin"].includes(req.user?.role || "")) {
        return res.status(403).json({ error: "Staff access required" });
    }

    try {
        const { id } = req.params;
        const { status, description } = req.body;

        const task = db.prepare("SELECT * FROM staff_tasks WHERE id = ?").get(id) as any;
        if (!task) return res.status(404).json({ error: "Task not found" });

        db.prepare(`
      UPDATE staff_tasks SET status = ?, description = ? WHERE id = ?
    `).run(status || task.status, description || task.description, id);

        const updated = db.prepare("SELECT * FROM staff_tasks WHERE id = ?").get(id);
        return res.json({ message: "Task updated", task: updated });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to update task", details: err.message });
    }
});

// GET /api/staff/overview — staff dashboard summary
router.get("/overview", authenticateToken, (req: AuthRequest, res: Response) => {
    if (!["hospital_staff", "doctor", "admin"].includes(req.user?.role || "")) {
        return res.status(403).json({ error: "Staff access required" });
    }

    try {
        const { id, role } = req.user!;
        const todayPending = db.prepare(`
      SELECT COUNT(*) as count FROM staff_tasks
      WHERE ${role === "admin" ? "1=1" : "assigned_to = ?"}
      AND status IN ('Pending','In Progress')
    `).get(role === "admin" ? undefined : id) as any;

        const recentAlerts = db.prepare(`
      SELECT * FROM emergency_sos WHERE status IN ('Pending','Dispatched') ORDER BY created_at DESC LIMIT 5
    `).all();

        const bedStats = db.prepare(`
      SELECT SUM(available) as totalAvailable, SUM(occupied) as totalOccupied FROM beds
    `).get();

        const todayAppointments = db.prepare(`
      SELECT COUNT(*) as count FROM appointments WHERE appointment_date = date('now') AND status != 'Cancelled'
    `).get();

        return res.json({
            pendingTasks: todayPending?.count || 0,
            recentAlerts,
            bedStats,
            todayAppointments,
        });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to fetch overview", details: err.message });
    }
});

export default router;
