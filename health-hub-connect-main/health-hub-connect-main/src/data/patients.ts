export interface MedicalRecord {
    id: string;
    date: string;
    type: "Consultation" | "Lab Report" | "Prescription" | "Imaging" | "Surgery";
    doctor: string;
    hospital: string;
    diagnosis: string;
    notes: string;
    prescription?: string;
    attachmentName?: string;
}

export interface Patient {
    id: string;
    healthId: string;
    name: string;
    age: number;
    gender: "Male" | "Female" | "Other";
    bloodGroup: string;
    email: string;
    phone: string;
    address: string;
    allergies: string[];
    chronicConditions: string[];
    records: MedicalRecord[];
}

export const demoPatient: Patient = {
    id: "P001",
    healthId: "ABHA-2026-001234",
    name: "Rahul Sharma",
    age: 34,
    gender: "Male",
    bloodGroup: "O+",
    email: "rahul.sharma@example.com",
    phone: "+91 98765 11223",
    address: "4th Floor, Madhura Nagar, Hyderabad - 500038",
    allergies: ["Penicillin", "Sulfa Drugs"],
    chronicConditions: ["Hypertension", "Type 2 Diabetes"],
    records: [
        {
            id: "R001",
            date: "2026-02-10",
            type: "Consultation",
            doctor: "Dr. Anitha Reddy",
            hospital: "Apollo Multispecialty",
            diagnosis: "Hypertension with mild tachycardia",
            notes: "BP: 145/92, HR: 98 bpm. Advised lifestyle modification and medication adjustment.",
            prescription: "Amlodipine 5mg OD, Metoprolol 25mg BD",
        },
        {
            id: "R002",
            date: "2026-01-25",
            type: "Lab Report",
            doctor: "Dr. Vikram Nair",
            hospital: "City General Hospital",
            diagnosis: "HbA1c: 7.8% — Suboptimal control",
            notes: "FBS: 156 mg/dL, PPBS: 220 mg/dL. Suggest diet modification and dosage review.",
            attachmentName: "lab_jan26.pdf",
        },
        {
            id: "R003",
            date: "2025-12-05",
            type: "Imaging",
            doctor: "Dr. Priya Iyer",
            hospital: "KIMS Hospital",
            diagnosis: "Chest X-Ray — No active pulmonary pathology",
            notes: "Cardiomegaly not suspected. Repeat after 6 months.",
            attachmentName: "xray_dec25.png",
        },
        {
            id: "R004",
            date: "2025-10-18",
            type: "Prescription",
            doctor: "Dr. Anitha Reddy",
            hospital: "Apollo Multispecialty",
            diagnosis: "Routine follow-up — Diabetes management",
            notes: "Patient stable. Continuing current regimen.",
            prescription: "Metformin 500mg BD, Glimepiride 1mg OD, Telma 40mg OD",
        },
        {
            id: "R005",
            date: "2025-08-22",
            type: "Consultation",
            doctor: "Dr. Suresh Babu",
            hospital: "Yashoda Super Speciality",
            diagnosis: "Viral fever with upper respiratory tract infection",
            notes: "Temp: 101°F, Throat congestion. Advised rest and adequate fluids.",
            prescription: "Paracetamol 650mg TDS, Cetirizine 10mg OD",
        },
    ],
};

export type UserRole = "public" | "patient" | "hospital_staff" | "admin" | "doctor";

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    hospitalId?: number;
}

export const demoUsers: AuthUser[] = [
    { id: "U001", name: "Rahul Sharma", email: "patient@demo.com", role: "patient" },
    { id: "U002", name: "Dr. Anitha Reddy", email: "doctor@demo.com", role: "doctor", hospitalId: 2 },
    { id: "U003", name: "Staff Apollo", email: "staff@demo.com", role: "hospital_staff", hospitalId: 2 },
    { id: "U004", name: "Admin User", email: "admin@demo.com", role: "admin" },
];
