import { Router, Response, Request } from "express";
import db from "../database";
import { AuthRequest, authenticateToken } from "../middleware/auth";

const router = Router();

// GET /api/doctors — list all doctors (optionally filter by hospital/specialization)
router.get("/", (_req: Request, res: Response) => {
    try {
        const { hospital_id, specialization, city, q } = _req.query;
        let query = `
      SELECT d.*, h.name as hospital_name, h.city, h.address as hospital_address
      FROM doctors d
      JOIN hospitals h ON d.hospital_id = h.id
      WHERE 1=1
    `;
        const params: any[] = [];

        if (hospital_id) { query += " AND d.hospital_id = ?"; params.push(hospital_id); }
        if (specialization) { query += " AND d.specialization LIKE ?"; params.push(`%${specialization}%`); }
        if (city) { query += " AND h.city LIKE ?"; params.push(`%${city}%`); }
        if (q) { query += " AND (d.name LIKE ? OR d.specialization LIKE ?)"; params.push(`%${q}%`, `%${q}%`); }

        query += " ORDER BY d.rating DESC, d.name";

        const doctors = db.prepare(query).all(...params) as any[];
        const result = doctors.map((d) => ({
            ...d,
            available_days: JSON.parse(d.available_days || "[]"),
        }));

        return res.json({ doctors: result, total: result.length });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to fetch doctors", details: err.message });
    }
});

// GET /api/doctors/specializations — unique list of specializations
router.get("/specializations", (_req: Request, res: Response) => {
    try {
        const specs = db.prepare("SELECT DISTINCT specialization FROM doctors ORDER BY specialization").all() as any[];
        return res.json({ specializations: specs.map((s) => s.specialization) });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to fetch specializations", details: err.message });
    }
});

// GET /api/doctors/:id — single doctor detail
router.get("/:id", (_req: Request, res: Response) => {
    try {
        const doctor = db.prepare(`
      SELECT d.*, h.name as hospital_name, h.city, h.address as hospital_address, h.phone as hospital_phone
      FROM doctors d
      JOIN hospitals h ON d.hospital_id = h.id
      WHERE d.id = ?
    `).get(_req.params.id) as any;

        if (!doctor) return res.status(404).json({ error: "Doctor not found" });

        doctor.available_days = JSON.parse(doctor.available_days || "[]");
        return res.json({ doctor });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to fetch doctor", details: err.message });
    }
});

export default router;
