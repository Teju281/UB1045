import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { recordsApi } from "@/lib/api";
import {
    FileText, Activity, Pill, User, Shield, Upload,
    Heart, AlertTriangle, Plus, Calendar, Stethoscope, Eye, Lock, Loader2, CheckCircle,
} from "lucide-react";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    Consultation: Stethoscope,
    "Lab Report": Activity,
    Prescription: Pill,
    Imaging: Eye,
    Surgery: Heart,
};

const typeColors: Record<string, string> = {
    Consultation: "bg-primary/10 text-primary",
    "Lab Report": "bg-info/10 text-info",
    Prescription: "bg-success/10 text-success",
    Imaging: "bg-warning/10 text-warning",
    Surgery: "bg-emergency/10 text-emergency",
};

interface PatientProfile {
    id: number;
    health_id: string;
    name: string;
    age: number;
    gender: string;
    blood_group: string;
    email: string;
    phone: string;
    address: string;
    allergies: string[];
    chronic_conditions: string[];
}

interface MedicalRecord {
    id: number;
    date: string;
    type: "Consultation" | "Lab Report" | "Prescription" | "Imaging" | "Surgery";
    doctor: string;
    hospital: string;
    diagnosis: string;
    notes: string;
    prescription?: string;
    attachment_name?: string;
}

const HealthRecords = () => {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeRecord, setActiveRecord] = useState<number | null>(null);
    const [filterType, setFilterType] = useState("all");
    const [patient, setPatient] = useState<PatientProfile | null>(null);
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [dataLoading, setDataLoading] = useState(false);
    const [uploadSubmitting, setUploadSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadForm, setUploadForm] = useState({ type: "Consultation", diagnosis: "", doctor: "", hospital: "", notes: "", prescription: "", date: "" });

    const recordTypes = ["all", "Consultation", "Lab Report", "Prescription", "Imaging", "Surgery"];
    const filteredRecords = filterType === "all" ? records : records.filter((r) => r.type === filterType);

    const isRestricted = !user || user.role === "public";

    const loadData = async () => {
        setDataLoading(true);
        try {
            const data = await recordsApi.getMyProfile();
            if (data.patient) {
                setPatient(data.patient);
                setRecords(data.records || []);
            }
        } catch (err) {
            console.error("Failed to load health records:", err);
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        if (!user || isRestricted) return;
        loadData();
    }, [user]);

    if (authLoading || dataLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center">
                    <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading health records…</p>
                </div>
            </div>
        );
    }

    if (isRestricted) {
        return (
            <div className="container mx-auto max-w-md px-4 py-20 text-center">
                <Lock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Access Restricted</h2>
                <p className="text-muted-foreground mb-6">Sign in as a Patient, Doctor, or Admin to view health records.</p>
                <div className="space-y-2">
                    <a href="/login" className="block">
                        <Button className="w-full gradient-primary text-primary-foreground">Login to Access Records</Button>
                    </a>
                    <p className="text-xs text-muted-foreground mt-2">Demo: Use <strong>patient@demo.com</strong> / password: <strong>demo1234</strong></p>
                </div>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="container mx-auto max-w-md px-4 py-20 text-center">
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-warning" />
                <h2 className="font-heading text-xl font-bold text-foreground mb-2">No Patient Profile Found</h2>
                <p className="text-muted-foreground">Your account doesn't have a linked patient profile yet.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-6xl px-4 py-8">
            <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="font-heading text-3xl font-bold text-foreground">Digital Health Records</h1>
                    <p className="mt-1 text-muted-foreground">Secure, centralized medical history and prescription records</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className="bg-success text-success-foreground gap-1">
                        <Shield className="h-3 w-3" /> Encrypted
                    </Badge>
                    <Badge variant="outline">Role: {user.role.replace("_", " ")}</Badge>
                </div>
            </div>

            <Tabs defaultValue="profile">
                <TabsList className="mb-6 grid w-full grid-cols-3 sm:w-auto sm:inline-flex">
                    <TabsTrigger value="profile"><User className="mr-1 h-4 w-4" />Profile</TabsTrigger>
                    <TabsTrigger value="records"><FileText className="mr-1 h-4 w-4" />Records ({records.length})</TabsTrigger>
                    <TabsTrigger value="upload"><Upload className="mr-1 h-4 w-4" />Upload</TabsTrigger>
                </TabsList>

                {/* Patient Profile */}
                <TabsContent value="profile">
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="shadow-elevated border-primary/20 lg:col-span-1">
                            <CardContent className="p-6 text-center">
                                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                                    <User className="h-10 w-10 text-primary" />
                                </div>
                                <h2 className="font-heading text-xl font-bold text-foreground">{patient.name}</h2>
                                <p className="text-sm text-muted-foreground">{patient.email}</p>
                                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                                    <Shield className="h-3 w-3" />
                                    {patient.health_id}
                                </div>
                                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                    <div className="rounded-lg bg-muted p-2">
                                        <div className="font-bold text-foreground">{patient.age || "—"}</div>
                                        <div className="text-[10px] text-muted-foreground">Age</div>
                                    </div>
                                    <div className="rounded-lg bg-muted p-2">
                                        <div className="font-bold text-foreground">{patient.gender || "—"}</div>
                                        <div className="text-[10px] text-muted-foreground">Gender</div>
                                    </div>
                                    <div className="rounded-lg bg-emergency/10 p-2">
                                        <div className="font-bold text-emergency">{patient.blood_group || "—"}</div>
                                        <div className="text-[10px] text-muted-foreground">Blood</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-4 lg:col-span-2">
                            <Card className="shadow-card">
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-primary" />Personal Details</CardTitle></CardHeader>
                                <CardContent className="grid gap-3 sm:grid-cols-2">
                                    {[
                                        { label: "Phone", value: patient.phone },
                                        { label: "Address", value: patient.address },
                                        { label: "Health ID", value: patient.health_id },
                                    ].map((item) => (
                                        <div key={item.label}>
                                            <div className="text-xs text-muted-foreground">{item.label}</div>
                                            <div className="text-sm font-medium text-foreground mt-0.5">{item.value || "—"}</div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card className="shadow-card border-warning/20">
                                <CardHeader><CardTitle className="text-base flex items-center gap-2 text-warning"><AlertTriangle className="h-4 w-4" />Allergies & Chronic Conditions</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="mb-3">
                                        <div className="text-xs text-muted-foreground mb-1.5">Allergies</div>
                                        <div className="flex flex-wrap gap-2">
                                            {patient.allergies.length > 0
                                                ? patient.allergies.map((a) => <Badge key={a} className="bg-emergency/10 text-emergency border-emergency/20">{a}</Badge>)
                                                : <span className="text-xs text-muted-foreground">None recorded</span>}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1.5">Chronic Conditions</div>
                                        <div className="flex flex-wrap gap-2">
                                            {patient.chronic_conditions.length > 0
                                                ? patient.chronic_conditions.map((c) => <Badge key={c} className="bg-warning/10 text-warning border-warning/20">{c}</Badge>)
                                                : <span className="text-xs text-muted-foreground">None recorded</span>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-card">
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />Access Permissions</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {[
                                            { role: "Patient (Owner)", access: "Full Access", color: "bg-success text-success-foreground" },
                                            { role: "Treating Doctor", access: "Read + Write Notes", color: "bg-primary text-primary-foreground" },
                                            { role: "Hospital Admin", access: "Read Only", color: "bg-info text-info-foreground" },
                                            { role: "Public", access: "No Access", color: "bg-muted text-muted-foreground" },
                                        ].map((p) => (
                                            <div key={p.role} className="flex items-center justify-between">
                                                <span className="text-sm text-foreground">{p.role}</span>
                                                <Badge className={p.color}>{p.access}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Medical Records */}
                <TabsContent value="records">
                    <div className="mb-4 flex flex-wrap gap-2">
                        {recordTypes.map((t) => (
                            <Button key={t} variant={filterType === t ? "default" : "outline"} size="sm"
                                onClick={() => setFilterType(t)} className="capitalize">{t}</Button>
                        ))}
                    </div>

                    {filteredRecords.length === 0 ? (
                        <div className="py-16 text-center text-muted-foreground">
                            <FileText className="mx-auto mb-3 h-10 w-10 opacity-30" />
                            <p>No {filterType === "all" ? "" : filterType} records found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredRecords.map((record) => {
                                const Icon = typeIcons[record.type] || FileText;
                                const isActive = activeRecord === record.id;
                                return (
                                    <Card key={record.id}
                                        className={`shadow-card transition-all cursor-pointer hover:shadow-elevated ${isActive ? "border-primary/30" : ""}`}
                                        onClick={() => setActiveRecord(isActive ? null : record.id)}>
                                        <CardContent className="p-5">
                                            <div className="flex items-start gap-4">
                                                <div className={`rounded-lg p-2.5 flex-shrink-0 ${typeColors[record.type]}`}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <div className="font-heading font-semibold text-foreground">{record.diagnosis}</div>
                                                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                                <span className="flex items-center gap-1"><Stethoscope className="h-3 w-3" />{record.doctor}</span>
                                                                <span>{record.hospital}</span>
                                                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(record.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                                                            </div>
                                                        </div>
                                                        <Badge className={`flex-shrink-0 text-xs ${typeColors[record.type]}`}>{record.type}</Badge>
                                                    </div>
                                                    {isActive && (
                                                        <div className="mt-4 space-y-3 animate-slide-up">
                                                            <div className="rounded-lg bg-muted p-3">
                                                                <div className="text-xs text-muted-foreground mb-1">Doctor Notes</div>
                                                                <p className="text-sm text-foreground">{record.notes}</p>
                                                            </div>
                                                            {record.prescription && (
                                                                <div className="rounded-lg bg-success/10 p-3">
                                                                    <div className="text-xs text-success font-medium mb-1 flex items-center gap-1"><Pill className="h-3 w-3" />Prescription</div>
                                                                    <p className="text-sm text-foreground">{record.prescription}</p>
                                                                </div>
                                                            )}
                                                            {record.attachment_name && (
                                                                <div className="rounded-lg border border-border p-3 flex items-center gap-2">
                                                                    <Upload className="h-4 w-4 text-primary" />
                                                                    <span className="text-sm text-primary font-medium">{record.attachment_name}</span>
                                                                    <Button size="sm" variant="outline" className="ml-auto">Download</Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* Upload */}
                <TabsContent value="upload">
                    <Card className="shadow-card max-w-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Upload className="h-4 w-4 text-primary" />Add Medical Record
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="rec-type">Record Type</Label>
                                <select id="rec-type" value={uploadForm.type} onChange={(e) => setUploadForm((p) => ({ ...p, type: e.target.value }))}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                                    {["Consultation", "Lab Report", "Prescription", "Imaging", "Surgery"].map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rec-date">Date of Visit</Label>
                                <Input id="rec-date" type="date" value={uploadForm.date}
                                    max={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => setUploadForm((p) => ({ ...p, date: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rec-diagnosis">Diagnosis / Title <span className="text-emergency">*</span></Label>
                                <Input id="rec-diagnosis" placeholder="e.g., Chest X-Ray — Normal" value={uploadForm.diagnosis}
                                    onChange={(e) => setUploadForm((p) => ({ ...p, diagnosis: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rec-doctor">Doctor Name</Label>
                                <Input id="rec-doctor" placeholder="Dr. Full Name" value={uploadForm.doctor}
                                    onChange={(e) => setUploadForm((p) => ({ ...p, doctor: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rec-hospital">Hospital</Label>
                                <Input id="rec-hospital" placeholder="Hospital name" value={uploadForm.hospital}
                                    onChange={(e) => setUploadForm((p) => ({ ...p, hospital: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rec-notes">Notes</Label>
                                <textarea id="rec-notes" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                                    rows={3} placeholder="Doctor notes, findings..." value={uploadForm.notes}
                                    onChange={(e) => setUploadForm((p) => ({ ...p, notes: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rec-prescription">Prescription</Label>
                                <textarea id="rec-prescription" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                                    rows={2} placeholder="Medicines prescribed..." value={uploadForm.prescription}
                                    onChange={(e) => setUploadForm((p) => ({ ...p, prescription: e.target.value }))} />
                            </div>
                            {/* File upload */}
                            <div
                                className="rounded-xl border-2 border-dashed border-border p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
                                {selectedFile ? (
                                    <p className="text-sm text-primary font-medium">{selectedFile.name}</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Click to attach file (PDF, PNG, JPG — max 10MB)</p>
                                )}
                                <input ref={fileInputRef} type="file" className="hidden"
                                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                            </div>
                            <Button
                                className="w-full gradient-primary text-primary-foreground font-semibold" id="btn-upload-record"
                                disabled={!uploadForm.diagnosis || uploadSubmitting}
                                onClick={async () => {
                                    if (!uploadForm.diagnosis) {
                                        toast({ title: "Diagnosis required", variant: "destructive" });
                                        return;
                                    }
                                    setUploadSubmitting(true);
                                    try {
                                        const token = localStorage.getItem("hh_access_token");
                                        const formData = new FormData();
                                        formData.append("type", uploadForm.type);
                                        formData.append("diagnosis", uploadForm.diagnosis);
                                        formData.append("doctor", uploadForm.doctor || "Self-reported");
                                        formData.append("hospital", uploadForm.hospital || "Not specified");
                                        formData.append("notes", uploadForm.notes);
                                        formData.append("prescription", uploadForm.prescription);
                                        if (uploadForm.date) formData.append("date", uploadForm.date);
                                        if (selectedFile) formData.append("attachment", selectedFile);

                                        const res = await fetch("/api/records/my/upload", {
                                            method: "POST",
                                            headers: { Authorization: `Bearer ${token}` },
                                            body: formData,
                                        });
                                        const data = await res.json();
                                        if (res.ok) {
                                            toast({ title: "✅ Record saved!", description: `${uploadForm.diagnosis} added to your health records.` });
                                            setUploadForm({ type: "Consultation", diagnosis: "", doctor: "", hospital: "", notes: "", prescription: "", date: "" });
                                            setSelectedFile(null);
                                            if (fileInputRef.current) fileInputRef.current.value = "";
                                            // Refresh records list
                                            await loadData();
                                        } else {
                                            toast({ title: "Failed to save", description: data.error || "Unknown error", variant: "destructive" });
                                        }
                                    } catch {
                                        toast({ title: "Network error", description: "Cannot reach backend server.", variant: "destructive" });
                                    } finally {
                                        setUploadSubmitting(false);
                                    }
                                }}>
                                {uploadSubmitting
                                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving to database…</>
                                    : <><Plus className="mr-2 h-4 w-4" />Save Record to Database</>}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default HealthRecords;
