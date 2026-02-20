import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../database";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import dotenv from "dotenv";
dotenv.config();

const router = Router();

// Configure multer for file uploads
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (_req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mime = allowedTypes.test(file.mimetype);
        if (ext && mime) return cb(null, true);
        cb(new Error("Only images and documents are allowed"));
    },
});

// GET /api/records/:patientId — get patient's records
router.get("/:patientId", authenticateToken, (req: AuthRequest, res: Response) => {
    try {
        const { patientId } = req.params;
        const { role, id: userId } = req.user!;

        // Patients can only access their own records
        if (role === "patient") {
            const myPatient = db.prepare("SELECT id FROM patients WHERE user_id = ?").get(userId) as any;
            if (!myPatient || myPatient.id !== Number(patientId)) {
                return res.status(403).json({ error: "You can only access your own records" });
            }
        }

        const patient = db.prepare("SELECT * FROM patients WHERE id = ?").get(patientId) as any;
        if (!patient) return res.status(404).json({ error: "Patient not found" });

        patient.allergies = JSON.parse(patient.allergies || "[]");
        patient.chronic_conditions = JSON.parse(patient.chronic_conditions || "[]");

        const records = db.prepare(`
      SELECT * FROM medical_records WHERE patient_id = ? ORDER BY date DESC
    `).all(patientId);

        return res.json({ patient, records });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to fetch records", details: err.message });
    }
});

// GET /api/records/my/profile — get own patient profile
router.get("/my/profile", authenticateToken, (req: AuthRequest, res: Response) => {
    try {
        const patient = db.prepare("SELECT * FROM patients WHERE user_id = ?").get(req.user?.id) as any;
        if (!patient) return res.status(404).json({ error: "Patient profile not found" });

        patient.allergies = JSON.parse(patient.allergies || "[]");
        patient.chronic_conditions = JSON.parse(patient.chronic_conditions || "[]");

        const records = db.prepare(`
      SELECT * FROM medical_records WHERE patient_id = ? ORDER BY date DESC
    `).all(patient.id);

        return res.json({ patient, records });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to fetch profile", details: err.message });
    }
});

// POST /api/records/my/upload — patient uploads their OWN record
router.post("/my/upload", authenticateToken, upload.single("attachment"), (req: AuthRequest, res: Response) => {
    try {
        const patient = db.prepare("SELECT id FROM patients WHERE user_id = ?").get(req.user?.id) as any;
        if (!patient) return res.status(404).json({ error: "Patient profile not found" });

        const { date, type, doctor, hospital, diagnosis, notes, prescription } = req.body;
        if (!diagnosis || !type) {
            return res.status(400).json({ error: "Diagnosis and type are required" });
        }

        const attachmentName = req.file?.originalname || null;
        const attachmentPath = req.file?.filename || null;
        const recordDate = date || new Date().toISOString().split("T")[0];

        const result = db.prepare(`
      INSERT INTO medical_records (patient_id, date, type, doctor, hospital, diagnosis, notes, prescription, attachment_name, attachment_path, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            patient.id,
            recordDate,
            type,
            doctor || "Self-reported",
            hospital || "Not specified",
            diagnosis,
            notes || null,
            prescription || null,
            attachmentName,
            attachmentPath,
            req.user?.id
        );

        const record = db.prepare("SELECT * FROM medical_records WHERE id = ?").get(result.lastInsertRowid);
        return res.status(201).json({ message: "Medical record added successfully", record });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to add record", details: err.message });
    }
});

// POST /api/records — add new medical record (doctor/staff/admin)
router.post("/", authenticateToken, upload.single("attachment"), (req: AuthRequest, res: Response) => {
    if (!["doctor", "hospital_staff", "admin"].includes(req.user?.role || "")) {
        return res.status(403).json({ error: "Doctor or Staff access required" });
    }

    try {
        const { patient_id, date, type, doctor, hospital, diagnosis, notes, prescription } = req.body;

        if (!patient_id || !date || !type || !doctor || !hospital || !diagnosis) {
            return res.status(400).json({ error: "patient_id, date, type, doctor, hospital, and diagnosis are required" });
        }

        const patient = db.prepare("SELECT id FROM patients WHERE id = ?").get(patient_id);
        if (!patient) return res.status(404).json({ error: "Patient not found" });

        const attachmentName = req.file?.originalname || null;
        const attachmentPath = req.file?.filename || null;

        const result = db.prepare(`
      INSERT INTO medical_records (patient_id, date, type, doctor, hospital, diagnosis, notes, prescription, attachment_name, attachment_path, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(patient_id, date, type, doctor, hospital, diagnosis, notes || null, prescription || null, attachmentName, attachmentPath, req.user?.id);

        const record = db.prepare("SELECT * FROM medical_records WHERE id = ?").get(result.lastInsertRowid);
        return res.status(201).json({ message: "Medical record added", record });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to add record", details: err.message });
    }
});

// DELETE /api/records/:id — delete medical record (admin only)
router.delete("/:id", authenticateToken, (req: AuthRequest, res: Response) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
    }

    try {
        const { id } = req.params;
        const record = db.prepare("SELECT * FROM medical_records WHERE id = ?").get(id) as any;
        if (!record) return res.status(404).json({ error: "Record not found" });

        // Delete file if exists
        if (record.attachment_path) {
            const filePath = path.join(process.env.UPLOAD_DIR || "./uploads", record.attachment_path);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        db.prepare("DELETE FROM medical_records WHERE id = ?").run(id);
        return res.json({ message: "Medical record deleted" });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to delete record", details: err.message });
    }
});

// GET /api/records/download/:id — download attachment
router.get("/download/:id", authenticateToken, (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const record = db.prepare("SELECT * FROM medical_records WHERE id = ?").get(id) as any;
        if (!record || !record.attachment_path) {
            return res.status(404).json({ error: "No attachment found" });
        }

        const filePath = path.join(process.env.UPLOAD_DIR || "./uploads", record.attachment_path);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "File not found on server" });
        }

        return res.download(filePath, record.attachment_name);
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to download file", details: err.message });
    }
});

// GET /api/records/search — search patients by name or health ID (staff/admin/doctor)
router.get("/search/patients", authenticateToken, (req: AuthRequest, res: Response) => {
    if (!["doctor", "hospital_staff", "admin"].includes(req.user?.role || "")) {
        return res.status(403).json({ error: "Staff access required" });
    }

    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ error: "Query parameter 'q' required" });

        const patients = db.prepare(`
      SELECT id, health_id, name, age, gender, blood_group, email, phone
      FROM patients
      WHERE name LIKE ? OR health_id LIKE ?
      LIMIT 20
    `).all(`%${q}%`, `%${q}%`);

        return res.json({ patients });
    } catch (err: any) {
        return res.status(500).json({ error: "Failed to search patients", details: err.message });
    }
});

export default router;
