import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { initializeDatabase } from "./database";

// Routes
import authRoutes from "./routes/auth";
import bedRoutes from "./routes/beds";
import appointmentRoutes from "./routes/appointments";
import emergencyRoutes from "./routes/emergency";
import recordRoutes from "./routes/records";
import staffRoutes from "./routes/staff";
import adminRoutes from "./routes/admin";
import doctorRoutes from "./routes/doctors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ──────────────────────────────────────────
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded files
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
app.use("/uploads", express.static(path.resolve(uploadDir)));

// Request logger
app.use((req, _res, next) => {
    const time = new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" });
    console.log(`[${time}] ${req.method} ${req.url}`);
    next();
});

// ─── Initialize Database ─────────────────────────────────
initializeDatabase();

// ─── API Routes ──────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/beds", bedRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/doctors", doctorRoutes);

// ─── Health Check ─────────────────────────────────────────
app.get("/api/health", (_req, res) => {
    res.json({
        status: "OK",
        service: "Health Hub Connect API",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        uptime: Math.round(process.uptime()) + "s",
        endpoints: {
            auth: "/api/auth",
            beds: "/api/beds",
            appointments: "/api/appointments",
            emergency: "/api/emergency",
            records: "/api/records",
            staff: "/api/staff",
            admin: "/api/admin",
            doctors: "/api/doctors",
        },
    });
});

// API route not found
app.use("/api", (_req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
});

// ─── 404 fallback ────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// ─── Error Handler ────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
});

// ─── Start Server ─────────────────────────────────────────
app.listen(PORT, () => {
    console.log("\n");
    console.log("╔════════════════════════════════════════════════╗");
    console.log("║   🏥  Health Hub Connect — Backend API         ║");
    console.log("╠════════════════════════════════════════════════╣");
    console.log(`║   🚀  Server running on http://localhost:${PORT}   ║`);
    console.log(`║   📋  API Docs: http://localhost:${PORT}/api/health ║`);
    console.log("║                                                ║");
    console.log("║   Demo Accounts (password: demo1234):          ║");
    console.log("║   📧  patient@demo.com  → patient              ║");
    console.log("║   📧  doctor@demo.com   → doctor               ║");
    console.log("║   📧  staff@demo.com    → hospital_staff       ║");
    console.log("║   📧  admin@demo.com    → admin                ║");
    console.log("╚════════════════════════════════════════════════╝");
    console.log("\n");
});

export default app;
