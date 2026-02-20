import { Router, Response } from "express";
import db from "../database";
import { AuthRequest, authenticateToken } from "../middleware/auth";

const router = Router();

// GET /api/beds/summary/stats — MUST be before /:bedId
router.get("/summary/stats", (_req, res: Response) => {
    try {
        const stats = db.prepare(`
      SELECT
        SUM(total) as totalBeds,
        SUM(available) as availableBeds,
        SUM(occupied) as occupiedBeds,
        SUM(under_maintenance) as maintenanceBeds,
        COUNT(DISTINCT hospital_id) as hospitals
      FROM beds
    `).get() as any;
        return res.json(stats);
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to fetch summary", details: err.message });
    }
});

// GET /api/beds — all hospitals' bed status
router.get("/", (_req, res: Response) => {
    try {
        const hospitals = db.prepare("SELECT * FROM hospitals ORDER BY city, name").all() as any[];
        const result = hospitals.map((hospital) => {
            const wards = db.prepare("SELECT * FROM beds WHERE hospital_id = ?").all(hospital.id) as any[];
            const totalBeds = wards.reduce((s: number, w: any) => s + w.total, 0);
            const availableBeds = wards.reduce((s: number, w: any) => s + w.available, 0);
            return {
                ...hospital,
                wards,
                totalBeds,
                availableBeds,
                occupancyRate: totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0,
            };
        });
        return res.json({ hospitals: result, timestamp: new Date().toISOString() });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to fetch bed data", details: err.message });
    }
});

// GET /api/beds/hospital/:hospitalId — specific hospital
router.get("/hospital/:hospitalId", (req, res: Response) => {
    try {
        const { hospitalId } = req.params;
        const hospital = db.prepare("SELECT * FROM hospitals WHERE id = ?").get(hospitalId) as any;
        if (!hospital) return res.status(404).json({ error: "Hospital not found" });
        const wards = db.prepare("SELECT * FROM beds WHERE hospital_id = ?").all(hospitalId) as any[];
        return res.json({ hospital, wards });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to fetch hospital beds", details: err.message });
    }
});

// PUT /api/beds/:bedId — update bed availability (staff/admin only)
router.put("/:bedId", authenticateToken, (req: AuthRequest, res: Response) => {
    if (!["hospital_staff", "admin", "doctor"].includes(req.user?.role || "")) {
        return res.status(403).json({ error: "Staff or Admin access required" });
    }
    try {
        const { bedId } = req.params;
        const { available, occupied, under_maintenance } = req.body;
        const bed = db.prepare("SELECT * FROM beds WHERE id = ?").get(bedId) as any;
        if (!bed) return res.status(404).json({ error: "Bed record not found" });

        const newAvailable = available ?? bed.available;
        const newOccupied = occupied ?? bed.occupied;
        const newMaintenance = under_maintenance ?? bed.under_maintenance;

        if (newAvailable + newOccupied + newMaintenance > bed.total) {
            return res.status(400).json({ error: "Sum of beds exceeds total capacity" });
        }
        db.prepare(`
      UPDATE beds SET available=?, occupied=?, under_maintenance=?, updated_at=datetime('now') WHERE id=?
    `).run(newAvailable, newOccupied, newMaintenance, bedId);

        return res.json({ message: "Bed status updated", bed: db.prepare("SELECT * FROM beds WHERE id=?").get(bedId) });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to update bed", details: err.message });
    }
});

export default router;
