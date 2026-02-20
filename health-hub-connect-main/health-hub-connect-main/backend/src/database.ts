import Database from "better-sqlite3";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const dbPath = process.env.DB_PATH || "./healthhub.db";
const db = new Database(path.resolve(dbPath));

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'patient' CHECK(role IN ('public','patient','doctor','hospital_staff','admin')),
      hospital_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS hospitals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      city TEXT,
      district TEXT,
      state TEXT DEFAULT 'Karnataka',
      phone TEXT,
      type TEXT DEFAULT 'General',
      latitude REAL,
      longitude REAL,
      total_beds INTEGER DEFAULT 0,
      emergency_available INTEGER DEFAULT 1,
      rating REAL DEFAULT 4.0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      hospital_id INTEGER,
      name TEXT NOT NULL,
      specialization TEXT NOT NULL,
      qualification TEXT,
      experience_years INTEGER DEFAULT 0,
      phone TEXT,
      email TEXT,
      available_days TEXT DEFAULT '["Mon","Tue","Wed","Thu","Fri"]',
      consultation_fee INTEGER DEFAULT 500,
      rating REAL DEFAULT 4.0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    CREATE TABLE IF NOT EXISTS beds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hospital_id INTEGER NOT NULL,
      ward TEXT NOT NULL CHECK(ward IN ('General','ICU','Emergency','Pediatric','Maternity','Surgical','Orthopedic','Oncology')),
      total INTEGER NOT NULL DEFAULT 0,
      available INTEGER NOT NULL DEFAULT 0,
      occupied INTEGER NOT NULL DEFAULT 0,
      under_maintenance INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      health_id TEXT UNIQUE,
      name TEXT NOT NULL,
      age INTEGER,
      gender TEXT CHECK(gender IN ('Male','Female','Other')),
      blood_group TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      allergies TEXT DEFAULT '[]',
      chronic_conditions TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS medical_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('Consultation','Lab Report','Prescription','Imaging','Surgery')),
      doctor TEXT NOT NULL,
      hospital TEXT NOT NULL,
      diagnosis TEXT NOT NULL,
      notes TEXT,
      prescription TEXT,
      attachment_name TEXT,
      attachment_path TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER,
      doctor_name TEXT NOT NULL,
      hospital_id INTEGER,
      hospital_name TEXT,
      department TEXT,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending','Confirmed','Completed','Cancelled')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );

    CREATE TABLE IF NOT EXISTS emergency_sos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_name TEXT,
      phone TEXT,
      latitude REAL,
      longitude REAL,
      address TEXT,
      emergency_type TEXT DEFAULT 'General',
      status TEXT DEFAULT 'Pending',
      assigned_hospital TEXT,
      ambulance_number TEXT,
      notes TEXT,
      triggered_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (triggered_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS staff_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assigned_to INTEGER NOT NULL,
      hospital_id INTEGER,
      patient_id INTEGER,
      task_type TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'Normal',
      status TEXT DEFAULT 'Pending',
      due_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      resource TEXT,
      resource_id TEXT,
      ip_address TEXT,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  seedDatabase();
  console.log("✅ Database initialized successfully");
}

function seedDatabase() {
  const bcrypt = require("bcryptjs");
  const existing = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (existing.count > 0) return;

  console.log("🌱 Seeding Karnataka hospital database...");

  // ── Karnataka Hospitals ──────────────────────────────────
  const insertHospital = db.prepare(`
    INSERT INTO hospitals (name, address, city, district, phone, type, latitude, longitude, total_beds, emergency_available, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const hospitals = [
    // Bengaluru
    ["Manipal Hospital (HAL Airport Road)", "98, HAL Airport Road, Kodihalli", "Bengaluru", "Bengaluru Urban", "+91-80-25023456", "Super Speciality", 12.9592, 77.6484, 650, 1, 4.7],
    ["Narayana Health City", "258/A, Bommasandra Industrial Area", "Bengaluru", "Bengaluru Urban", "+91-80-71222222", "Super Speciality", 12.8219, 77.6811, 1500, 1, 4.8],
    ["Fortis Hospital Bannerghatta", "154/9, Bannerghatta Road", "Bengaluru", "Bengaluru Urban", "+91-80-66214444", "Super Speciality", 12.8709, 77.5983, 800, 1, 4.6],
    ["St. John's Medical College Hospital", "Sarjapur Road, Koramangala", "Bengaluru", "Bengaluru Urban", "+91-80-22065000", "Teaching Hospital", 12.9352, 77.6245, 1200, 1, 4.5],
    ["Aster CMI Hospital", "43/2, New Airport Road, NH-7", "Bengaluru", "Bengaluru Urban", "+91-80-43422222", "Super Speciality", 13.0612, 77.5956, 550, 1, 4.6],
    ["Victoria Hospital", "Fort Road, Krishnarajendra Market", "Bengaluru", "Bengaluru Urban", "+91-80-26701150", "Government", 12.9634, 77.5737, 1200, 1, 3.9],
    ["Apollo Hospital Seshadripuram", "21/2, Seshadripuram", "Bengaluru", "Bengaluru Urban", "+91-80-49002222", "Super Speciality", 13.0027, 77.5717, 450, 1, 4.5],
    ["Sakra World Hospital", "52/2 & 52/3, Devarabeesanahalli", "Bengaluru", "Bengaluru Urban", "+91-80-49690000", "Super Speciality", 12.9304, 77.6934, 350, 1, 4.7],
    // Mysuru
    ["JSS Hospital Mysuru", "Ramanuja Road, Agrahara", "Mysuru", "Mysuru", "+91-821-2335555", "Teaching Hospital", 12.3052, 76.6552, 750, 1, 4.4],
    ["Columbia Asia Referral Hospital Mysore", "Plot No. 1007, Mandi Mohalla", "Mysuru", "Mysuru", "+91-821-2555555", "Super Speciality", 12.2977, 76.6394, 300, 1, 4.5],
    ["KR Hospital Mysuru", "Irwin Road", "Mysuru", "Mysuru", "+91-821-2425802", "Government", 12.3119, 76.6573, 1100, 1, 3.8],
    // Mangaluru
    ["Kasturba Medical College Hospital", "Ambedkar Circle, Lighthouse Hill Road", "Mangaluru", "Dakshina Kannada", "+91-824-2445858", "Teaching Hospital", 12.8745, 74.8426, 1000, 1, 4.6],
    ["Yenepoya Medical College Hospital", "University Road, Deralakatte", "Mangaluru", "Dakshina Kannada", "+91-824-2204668", "Teaching Hospital", 12.8120, 74.8953, 800, 1, 4.4],
    ["Father Muller Medical College Hospital", "Father Muller Road", "Mangaluru", "Dakshina Kannada", "+91-824-2238000", "Teaching Hospital", 12.8770, 74.8426, 700, 1, 4.3],
    // Hubballi-Dharwad
    ["KIMS Hospital Hubballi", "KIMS Road, Vidyanagar", "Hubballi", "Dharwad", "+91-836-2377000", "Super Speciality", 15.3549, 75.1372, 600, 1, 4.4],
    ["SDM College of Medical Sciences", "Manjushree Nagar, Sattur", "Dharwad", "Dharwad", "+91-836-2467700", "Teaching Hospital", 15.4607, 75.0006, 900, 1, 4.3],
    // Belagavi
    ["BIMS Hospital Belagavi", "BIMS Campus, Nehru Nagar", "Belagavi", "Belagavi", "+91-831-2405000", "Teaching Hospital", 15.8497, 74.4977, 700, 1, 4.2],
    ["District Hospital Belagavi", "Club Road", "Belagavi", "Belagavi", "+91-831-2420099", "Government", 15.8559, 74.5004, 500, 1, 3.7],
    // Shivamogga
    ["McGann Teaching Hospital Shivamogga", "Shivamogga Institute of Medical Sciences", "Shivamogga", "Shivamogga", "+91-8182-227447", "Teaching Hospital", 13.9299, 75.5681, 800, 1, 4.1],
    // Vijayapura
    ["BLDEU Shri B M Patil Medical College", "BLDE University Campus", "Vijayapura", "Vijayapura", "+91-8352-262770", "Teaching Hospital", 16.8302, 75.7100, 750, 1, 4.2],
  ];

  hospitals.forEach((h) => insertHospital.run(...h));

  // ── Beds per hospital ────────────────────────────────────
  const insertBed = db.prepare(`
    INSERT INTO beds (hospital_id, ward, total, available, occupied, under_maintenance)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const bedTemplates: Record<string, [string, number, number, number, number][]> = {
    large: [
      ["General", 300, 72, 218, 10], ["ICU", 60, 10, 47, 3], ["Emergency", 40, 12, 28, 0],
      ["Surgical", 80, 18, 59, 3], ["Pediatric", 50, 15, 33, 2], ["Maternity", 60, 20, 38, 2]
    ],
    medium: [
      ["General", 150, 38, 106, 6], ["ICU", 30, 6, 22, 2], ["Emergency", 25, 8, 17, 0],
      ["Surgical", 50, 12, 36, 2], ["Pediatric", 30, 10, 19, 1], ["Maternity", 35, 12, 22, 1]
    ],
    small: [
      ["General", 80, 20, 56, 4], ["ICU", 15, 3, 11, 1], ["Emergency", 15, 5, 10, 0],
      ["Surgical", 30, 8, 21, 1]
    ],
    govt: [
      ["General", 400, 60, 326, 14], ["ICU", 50, 8, 39, 3], ["Emergency", 60, 15, 45, 0],
      ["Surgical", 100, 20, 76, 4], ["Pediatric", 80, 22, 55, 3], ["Maternity", 100, 30, 67, 3],
      ["Orthopedic", 60, 14, 43, 3]
    ],
  };

  const hospitalSizes = [
    "large", "large", "large", "large", "large", "govt", "large", "medium",
    "large", "medium", "govt", "large", "large", "medium", "large", "large",
    "large", "govt", "large", "large"
  ];
  hospitals.forEach((_, idx) => {
    const size = hospitalSizes[idx] || "medium";
    (bedTemplates[size] || bedTemplates.medium).forEach((b) => insertBed.run(idx + 1, ...b));
  });

  // ── Users ────────────────────────────────────────────────
  const password = bcrypt.hashSync("demo1234", 10);
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, hospital_id)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertUser.run("Priya Sharma", "patient@demo.com", password, "patient", null);
  insertUser.run("Dr. Rajesh Kumar", "doctor@demo.com", password, "doctor", 1);
  insertUser.run("Anand Staff", "staff@demo.com", password, "hospital_staff", 1);
  insertUser.run("Admin Karnataka", "admin@demo.com", password, "admin", null);

  // More doctors — Hospital 1 (Manipal Bengaluru)
  insertUser.run("Dr. Surekha Naidu", "surekha@demo.com", password, "doctor", 1);
  insertUser.run("Dr. Mohan Reddy", "mohan@demo.com", password, "doctor", 1);
  // Hospital 2 (Narayana Bengaluru)
  insertUser.run("Dr. Kavitha Rao", "kavitha@demo.com", password, "doctor", 2);
  insertUser.run("Dr. Arun Prasad", "arun@demo.com", password, "doctor", 2);
  // Hospital 9 (JSS Mysuru)
  insertUser.run("Dr. Nirmala Hegde", "nirmala@demo.com", password, "doctor", 9);
  // Hospital 12 (Kasturba Mangaluru)
  insertUser.run("Dr. Suresh Shetty", "suresh@demo.com", password, "doctor", 12);

  // ── Doctors Table ─────────────────────────────────────────
  const insertDoctor = db.prepare(`
    INSERT INTO doctors (user_id, hospital_id, name, specialization, qualification, experience_years, phone, email, available_days, consultation_fee, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const days_mwf = JSON.stringify(["Mon", "Wed", "Fri"]);
  const days_ttf = JSON.stringify(["Tue", "Thu", "Sat"]);
  const days_all = JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
  const days_wkd = JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri"]);

  // Bengaluru — Manipal (hospital 1)
  insertDoctor.run(2, 1, "Dr. Rajesh Kumar", "Cardiology", "MD, DM Cardiology, AIIMS Delhi", 18, "+91-9845012301", "doctor@demo.com", days_wkd, 1200, 4.9);
  insertDoctor.run(5, 1, "Dr. Surekha Naidu", "Neurology", "MD, DM Neurology, NIMHANS", 15, "+91-9845012302", "surekha@demo.com", days_mwf, 1000, 4.7);
  insertDoctor.run(6, 1, "Dr. Mohan Reddy", "Orthopedics", "MS Ortho, DNB, Fellowship (UK)", 12, "+91-9845012303", "mohan@demo.com", days_ttf, 900, 4.6);
  insertDoctor.run(null, 1, "Dr. Ananya Singh", "Oncology", "MD, DM Oncology, Tata Memorial", 20, "+91-9845012304", "ananya@manipal.com", days_wkd, 1500, 4.8);
  insertDoctor.run(null, 1, "Dr. Kiran Bhat", "Gastroenterology", "MD, DM Gastro, JIPMER", 10, "+91-9845012305", "kiran@manipal.com", days_mwf, 800, 4.5);
  insertDoctor.run(null, 1, "Dr. Divya Menon", "Gynecology", "MS OBG, FOGSI Gold Medalist", 8, "+91-9845012306", "divya@manipal.com", days_all, 700, 4.6);

  // Bengaluru — Narayana (hospital 2)
  insertDoctor.run(7, 2, "Dr. Kavitha Rao", "Cardiac Surgery", "MS, MCh Cardiac Surgery, AIIMS", 22, "+91-9845012401", "kavitha@demo.com", days_wkd, 2000, 4.9);
  insertDoctor.run(8, 2, "Dr. Arun Prasad", "Pediatric Cardiology", "MD, DM Ped Cardiology", 14, "+91-9845012402", "arun@demo.com", days_wkd, 1200, 4.7);
  insertDoctor.run(null, 2, "Dr. Shobha Kamath", "Nephrology", "MD, DM Nephrology", 16, "+91-9845012403", "shobha@narayana.com", days_ttf, 900, 4.6);
  insertDoctor.run(null, 2, "Dr. Vivek Sharma", "Pulmonology", "MD Pulmonology, CHEST Fellow", 11, "+91-9845012404", "vivek@narayana.com", days_mwf, 800, 4.5);

  // Bengaluru — Fortis Bannerghatta (hospital 3)
  insertDoctor.run(null, 3, "Dr. Pradeep Nair", "Neurosurgery", "MS, MCh Neurosurgery", 18, "+91-9845012501", "pradeep@fortis.com", days_wkd, 1500, 4.7);
  insertDoctor.run(null, 3, "Dr. Meena Kulkarni", "Endocrinology", "MD, DM Endocrinology, MRCP(UK)", 13, "+91-9845012502", "meena@fortis.com", days_ttf, 900, 4.6);
  insertDoctor.run(null, 3, "Dr. Santosh Gowda", "Urology", "MS, MCh Urology", 10, "+91-9845012503", "santosh@fortis.com", days_mwf, 1000, 4.5);

  // Bengaluru — St. John's (hospital 4)
  insertDoctor.run(null, 4, "Dr. Angela D'Souza", "General Medicine", "MD General Medicine, MRCP", 15, "+91-9845012601", "angela@stjohns.com", days_wkd, 600, 4.4);
  insertDoctor.run(null, 4, "Dr. Francis Xavier", "Psychiatry", "MD Psychiatry, DPM", 12, "+91-9845012602", "francis@stjohns.com", days_mwf, 700, 4.5);

  // Mysuru — JSS (hospital 9)
  insertDoctor.run(9, 9, "Dr. Nirmala Hegde", "Obstetrics & Gynecology", "MS OBG, FOGSI Member", 16, "+91-9845013301", "nirmala@demo.com", days_all, 600, 4.6);
  insertDoctor.run(null, 9, "Dr. Basavaraj Patil", "General Surgery", "MS Surgery, FACS", 14, "+91-9845013302", "basavaraj@jss.com", days_wkd, 700, 4.4);
  insertDoctor.run(null, 9, "Dr. Girija Shankar", "Dermatology", "MD Dermatology, FRCP", 10, "+91-9845013303", "girija@jss.com", days_ttf, 500, 4.3);

  // Mangaluru — Kasturba (hospital 12)
  insertDoctor.run(10, 12, "Dr. Suresh Shetty", "Internal Medicine", "MD, Fellowship Infectious Disease", 17, "+91-9845014401", "suresh@demo.com", days_wkd, 700, 4.7);
  insertDoctor.run(null, 12, "Dr. Pooja Karanth", "Pediatrics", "MD Pediatrics, DCH, IAP Member", 11, "+91-9845014402", "pooja@kasturba.com", days_all, 600, 4.5);
  insertDoctor.run(null, 12, "Dr. Ramesh Bangera", "ENT", "MS ENT, DORL", 9, "+91-9845014403", "ramesh@kasturba.com", days_mwf, 500, 4.4);

  // Hubballi — KIMS (hospital 15)
  insertDoctor.run(null, 15, "Dr. Shashikumar Patel", "Cardiology", "MD, DM Cardiology", 13, "+91-9845015501", "shashi@kims.com", days_wkd, 900, 4.5);
  insertDoctor.run(null, 15, "Dr. Latha Desai", "Radiology", "MD Radiology, FRCR (UK)", 11, "+91-9845015502", "latha@kims.com", days_ttf, 700, 4.4);

  // Belagavi — BIMS (hospital 17)
  insertDoctor.run(null, 17, "Dr. Mahesh Patil", "Orthopedics", "MS Ortho, Fellowship AO Spine", 12, "+91-9845016601", "mahesh@bims.com", days_wkd, 700, 4.3);
  insertDoctor.run(null, 17, "Dr. Savita Benakatti", "Community Medicine", "MD Community Medicine", 8, "+91-9845016602", "savita@bims.com", days_mwf, 400, 4.2);

  // ── Patients ─────────────────────────────────────────────
  const insertPatient = db.prepare(`
    INSERT INTO patients (user_id, health_id, name, age, gender, blood_group, email, phone, address, allergies, chronic_conditions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPatient.run(1, "ABHA-KA-2026-001", "Priya Sharma", 32, "Female", "B+",
    "patient@demo.com", "+91 98450 11111",
    "14, Indiranagar 1st Stage, Bengaluru - 560038",
    JSON.stringify(["Penicillin"]),
    JSON.stringify(["Hypothyroidism"]));

  const insertRecord = db.prepare(`
    INSERT INTO medical_records (patient_id, date, type, doctor, hospital, diagnosis, notes, prescription)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertRecord.run(1, "2026-02-10", "Consultation", "Dr. Rajesh Kumar", "Manipal Hospital", "Hypertension Stage 1", "BP: 142/90. Lifestyle changes advised. Follow up in 4 weeks.", "Amlodipine 5mg OD");
  insertRecord.run(1, "2026-01-20", "Lab Report", "Dr. Surekha Naidu", "Manipal Hospital", "Thyroid panel — TSH: 6.2 mIU/L (elevated)", "T3/T4 within range. Increase levothyroxine dose.", "Levothyroxine 50mcg OD");
  insertRecord.run(1, "2025-11-05", "Imaging", "Dr. Mohan Reddy", "Manipal Hospital", "Chest X-Ray — Normal", "No active pathology detected. Repeat after 1 year.", null);
  insertRecord.run(1, "2025-09-18", "Prescription", "Dr. Kavitha Rao", "Narayana Health City", "Routine follow-up — Thyroid management", "Patient stable. Continuing current regimen.", "Levothyroxine 75mcg OD, Calcium + Vit D3");

  const insertAppt = db.prepare(`
    INSERT INTO appointments (patient_id, doctor_id, doctor_name, hospital_id, hospital_name, department, appointment_date, appointment_time, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertAppt.run(1, 1, "Dr. Rajesh Kumar", 1, "Manipal Hospital", "Cardiology", "2026-02-28", "10:00", "Hypertension follow-up", "Confirmed");
  insertAppt.run(1, 2, "Dr. Surekha Naidu", 1, "Manipal Hospital", "Neurology", "2026-03-10", "11:30", "Routine neurological checkup", "Pending");

  const insertTask = db.prepare(`INSERT INTO staff_tasks (assigned_to, hospital_id, task_type, description, priority, status) VALUES (?, ?, ?, ?, ?, ?)`);
  insertTask.run(3, 1, "Bed Check", "Verify ICU bed availability and update records", "High", "Pending");
  insertTask.run(3, 1, "Patient Discharge", "Process discharge for patient in Ward B-12", "Normal", "In Progress");
  insertTask.run(3, 1, "Inventory Check", "Audit surgical equipment in OT 2 and 3", "High", "Pending");
  insertTask.run(3, 1, "Vitals Update", "Record vitals for all ICU patients — evening shift", "Critical", "Pending");

  console.log("✅ Karnataka database seeded!");
  console.log("📧 Demo accounts (password: demo1234):");
  console.log("   patient@demo.com | doctor@demo.com | staff@demo.com | admin@demo.com");
}

export default db;
