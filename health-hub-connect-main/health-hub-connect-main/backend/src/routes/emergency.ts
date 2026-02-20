import { Router, Response, Request } from "express";
import db from "../database";
import { AuthRequest, authenticateToken } from "../middleware/auth";

const router = Router();

// POST /api/emergency/sos — trigger SOS (anyone can, no auth required)
router.post("/sos", (req: Request, res: Response) => {
    try {
        const { patient_name, phone, latitude, longitude, address, emergency_type = "General" } = req.body;

        if (!patient_name || !phone) {
            return res.status(400).json({ error: "Patient name and phone are required" });
        }

        const result = db.prepare(`
      INSERT INTO emergency_sos (patient_name, phone, latitude, longitude, address, emergency_type, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Pending')
    `).run(patient_name, phone, latitude || null, longitude || null, address || null, emergency_type);

        const sos = db.prepare("SELECT * FROM emergency_sos WHERE id = ?").get(result.lastInsertRowid) as any;

        // Find nearest hospital
        let nearestHospital = null;
        if (latitude && longitude) {
            const hospitals = db.prepare("SELECT * FROM hospitals WHERE emergency_available = 1").all() as any[];
            if (hospitals.length > 0) {
                const withDistance = hospitals.map((h) => ({
                    ...h,
                    distance: getDistanceKm(latitude, longitude, h.latitude || 17.385, h.longitude || 78.4867),
                })).sort((a, b) => a.distance - b.distance);
                nearestHospital = withDistance[0];
            }
        }

        console.log(`🚨 SOS Alert #${sos.id}: ${patient_name} | ${emergency_type} | ${phone}`);

        return res.status(201).json({
            message: "SOS alert triggered successfully",
            alertId: sos.id,
            status: "Pending",
            sos,
            nearestHospital,
            instructions: "Emergency services have been notified. Stay calm and keep your phone available.",
        });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to trigger SOS", details: err.message });
    }
});

// GET /api/emergency/alerts — get all SOS alerts (staff/admin)
router.get("/alerts", authenticateToken, (req: AuthRequest, res: Response) => {
    if (!["admin", "hospital_staff", "doctor"].includes(req.user?.role || "")) {
        return res.status(403).json({ error: "Staff or Admin access required" });
    }

    try {
        const { status, limit = 50 } = req.query;
        let query = "SELECT * FROM emergency_sos";
        const params: any[] = [];

        if (status) {
            query += " WHERE status = ?";
            params.push(status);
        }
        query += ` ORDER BY created_at DESC LIMIT ?`;
        params.push(Number(limit));

        const alerts = db.prepare(query).all(...params);
        const counts = db.prepare(`
      SELECT status, COUNT(*) as count FROM emergency_sos GROUP BY status
    `).all();

        return res.json({ alerts, counts });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to fetch alerts", details: err.message });
    }
});

// PUT /api/emergency/:id/status — update SOS status (staff/admin)
router.put("/:id/status", authenticateToken, (req: AuthRequest, res: Response) => {
    if (!["admin", "hospital_staff", "doctor"].includes(req.user?.role || "")) {
        return res.status(403).json({ error: "Staff or Admin access required" });
    }

    try {
        const { id } = req.params;
        const { status, assigned_hospital, ambulance_number, notes } = req.body;

        const sos = db.prepare("SELECT * FROM emergency_sos WHERE id = ?").get(id) as any;
        if (!sos) return res.status(404).json({ error: "SOS alert not found" });

        const validStatuses = ["Pending", "Dispatched", "En Route", "Resolved", "Cancelled"];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
        }

        db.prepare(`
      UPDATE emergency_sos
      SET status = ?, assigned_hospital = ?, ambulance_number = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
            status || sos.status,
            assigned_hospital || sos.assigned_hospital,
            ambulance_number || sos.ambulance_number,
            notes || sos.notes,
            id
        );

        const updated = db.prepare("SELECT * FROM emergency_sos WHERE id = ?").get(id);
        return res.json({ message: "SOS status updated", sos: updated });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to update SOS status", details: err.message });
    }
});

// GET /api/emergency/nearby — get nearest hospitals
router.get("/nearby", (req: Request, res: Response) => {
    try {
        const { lat, lng, limit = 5 } = req.query;
        const hospitals = db.prepare("SELECT * FROM hospitals WHERE emergency_available = 1").all() as any[];

        if (lat && lng) {
            const withDistance = hospitals.map((h) => ({
                ...h,
                distanceKm: getDistanceKm(Number(lat), Number(lng), h.latitude || 17.385, h.longitude || 78.4867).toFixed(2),
            })).sort((a, b) => Number(a.distanceKm) - Number(b.distanceKm)).slice(0, Number(limit));
            return res.json({ hospitals: withDistance });
        }

        return res.json({ hospitals: hospitals.slice(0, Number(limit)) });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to fetch nearby hospitals", details: err.message });
    }
});

// Haversine distance formula (km)
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function toRad(deg: number) { return deg * (Math.PI / 180); }

export default router;
