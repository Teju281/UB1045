import { Router, Response } from "express";
import db from "../database";
import { AuthRequest, authenticateToken, authorize } from "../middleware/auth";

const router = Router();

// GET /api/appointments — patient's own or all (admin/staff)
router.get("/", authenticateToken, (req: AuthRequest, res: Response) => {
    try {
        const { role, id } = req.user!;
        let appointments;

        if (role === "patient") {
            const patient = db.prepare("SELECT id FROM patients WHERE user_id = ?").get(id) as any;
            if (!patient) return res.status(404).json({ error: "Patient profile not found" });
            appointments = db.prepare(`
        SELECT a.*, p.name as patient_name, p.health_id
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.patient_id = ?
        ORDER BY a.appointment_date DESC, a.appointment_time
      `).all(patient.id);
        } else if (role === "doctor") {
            appointments = db.prepare(`
        SELECT a.*, p.name as patient_name, p.health_id, p.age, p.blood_group
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.doctor_name = (SELECT name FROM users WHERE id = ?)
        ORDER BY a.appointment_date, a.appointment_time
      `).all(id);
        } else {
            // Admin / hospital_staff — all appointments
            appointments = db.prepare(`
        SELECT a.*, p.name as patient_name, p.health_id
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        ORDER BY a.appointment_date DESC, a.appointment_time
      `).all();
        }

        return res.json({ appointments });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to fetch appointments", details: err.message });
    }
});

// POST /api/appointments — book new appointment
router.post("/", authenticateToken, (req: AuthRequest, res: Response) => {
    try {
        const { role, id } = req.user!;
        const { doctor_name, hospital_name, department, appointment_date, appointment_time, reason } = req.body;

        if (!doctor_name || !appointment_date || !appointment_time) {
            return res.status(400).json({ error: "Doctor name, date and time are required" });
        }

        let patientId: number;
        if (role === "patient") {
            const patient = db.prepare("SELECT id FROM patients WHERE user_id = ?").get(id) as any;
            if (!patient) return res.status(404).json({ error: "Patient profile not found" });
            patientId = patient.id;
        } else {
            return res.status(403).json({ error: "Only patients can book appointments" });
        }

        // Check for conflicts
        const conflict = db.prepare(`
      SELECT id FROM appointments
      WHERE patient_id = ? AND appointment_date = ? AND appointment_time = ? AND status NOT IN ('Cancelled')
    `).get(patientId, appointment_date, appointment_time);
        if (conflict) {
            return res.status(409).json({ error: "You already have an appointment at this date and time" });
        }

        const result = db.prepare(`
      INSERT INTO appointments (patient_id, doctor_name, hospital_name, department, appointment_date, appointment_time, reason, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
    `).run(patientId, doctor_name, hospital_name || "", department || "", appointment_date, appointment_time, reason || "");

        const appointment = db.prepare("SELECT * FROM appointments WHERE id = ?").get(result.lastInsertRowid);
        return res.status(201).json({ message: "Appointment booked successfully", appointment });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to book appointment", details: err.message });
    }
});

// PUT /api/appointments/:id — update status
router.put("/:id", authenticateToken, (req: AuthRequest, res: Response) => {
    try {
        const { id: appointmentId } = req.params;
        const { status, notes } = req.body;
        const { role, id: userId } = req.user!;

        const appointment = db.prepare("SELECT * FROM appointments WHERE id = ?").get(appointmentId) as any;
        if (!appointment) return res.status(404).json({ error: "Appointment not found" });

        // Patient can only cancel their own
        if (role === "patient") {
            const patient = db.prepare("SELECT id FROM patients WHERE user_id = ?").get(userId) as any;
            if (appointment.patient_id !== patient?.id) {
                return res.status(403).json({ error: "Cannot modify other patients' appointments" });
            }
            if (status !== "Cancelled") {
                return res.status(403).json({ error: "Patients can only cancel appointments" });
            }
        }

        const allowedStatuses = ["Pending", "Confirmed", "Completed", "Cancelled"];
        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}` });
        }

        db.prepare(`
      UPDATE appointments SET status = ?, notes = ? WHERE id = ?
    `).run(status || appointment.status, notes || appointment.notes, appointmentId);

        const updated = db.prepare("SELECT * FROM appointments WHERE id = ?").get(appointmentId);
        return res.json({ message: "Appointment updated", appointment: updated });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to update appointment", details: err.message });
    }
});

// DELETE /api/appointments/:id
router.delete("/:id", authenticateToken, (req: AuthRequest, res: Response) => {
    try {
        const { id: appointmentId } = req.params;
        const { role } = req.user!;

        if (!["admin", "hospital_staff"].includes(role)) {
            return res.status(403).json({ error: "Admin access required to delete appointments" });
        }

        const result = db.prepare("DELETE FROM appointments WHERE id = ?").run(appointmentId);
        if (result.changes === 0) return res.status(404).json({ error: "Appointment not found" });

        return res.json({ message: "Appointment deleted" });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to delete appointment", details: err.message });
    }
});

export default router;
