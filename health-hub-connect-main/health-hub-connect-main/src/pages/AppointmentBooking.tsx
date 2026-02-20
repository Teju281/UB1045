import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Building2, CheckCircle, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Doctor { id: number; name: string; specialization: string; hospital_name: string; consultation_fee: number; available_days: string[]; }
interface Appointment { id: number; doctor_name: string; hospital_name: string; appointment_date: string; appointment_time: string; status: string; reason: string; }

const timeSlots = ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"];

const AppointmentBooking = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [filterSpec, setFilterSpec] = useState("all");

  // Load doctors and existing appointments
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Fetch doctors from backend
        const docRes = await fetch("/api/doctors");
        const docData = await docRes.json();
        if (docData.doctors) {
          // available_days comes from SQLite as a JSON string — parse it
          const parsed = docData.doctors.map((d: Doctor) => ({
            ...d,
            available_days: typeof d.available_days === "string"
              ? JSON.parse(d.available_days || "[]")
              : d.available_days || [],
          }));
          setDoctors(parsed);
        }

        // Fetch appointments (need auth)
        if (user) {
          const token = localStorage.getItem("hh_access_token");
          const aptRes = await fetch("/api/appointments", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const aptData = await aptRes.json();
          if (aptData.appointments) setAppointments(aptData.appointments);
        }
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const selectedDoctorObj = doctors.find((d) => String(d.id) === selectedDoctor);
  const specializations = [...new Set(doctors.map((d) => d.specialization))].sort();
  const filteredDoctors = filterSpec === "all" ? doctors : doctors.filter((d) => d.specialization === filterSpec);

  const handleBook = async () => {
    if (!user) {
      toast({ title: "Login required", description: "Please login to book an appointment.", variant: "destructive" });
      return;
    }
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast({ title: "Missing fields", description: "Please select a doctor, date, and time slot.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("hh_access_token");
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          doctor_name: selectedDoctorObj?.name,
          hospital_name: selectedDoctorObj?.hospital_name,
          department: selectedDoctorObj?.specialization,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          reason: reason || "General consultation",
        }),
      });
      const data = await res.json();

      if (res.ok) {
        toast({ title: "✅ Appointment Booked!", description: `${selectedDoctorObj?.name} on ${selectedDate} at ${selectedTime}` });
        setAppointments((prev) => [data.appointment, ...prev]);
        setSelectedDoctor("");
        setSelectedDate("");
        setSelectedTime("");
        setReason("");
      } else {
        toast({ title: "Booking failed", description: data.error || "Could not book appointment.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", description: "Cannot reach server.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: number) => {
    const token = localStorage.getItem("hh_access_token");
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "Cancelled" }),
      });
      if (res.ok) {
        setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: "Cancelled" } : a));
        toast({ title: "Appointment cancelled" });
      }
    } catch { /**/ }
  };

  const statusColor: Record<string, string> = {
    Confirmed: "bg-success text-success-foreground",
    Pending: "bg-warning text-warning-foreground",
    Cancelled: "bg-muted text-muted-foreground",
    Completed: "bg-primary text-primary-foreground",
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Book Appointment</h1>
        <p className="mt-1 text-muted-foreground">Schedule a visit with a doctor — saved directly to the database</p>
      </div>

      {!user && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
          <p className="text-sm text-warning font-medium">
            Please <a href="/login" className="underline font-bold">login</a> to book an appointment. You can still browse doctors below.
          </p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Booking Form */}
        <div className="lg:col-span-3">
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />New Appointment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Filter by specialization */}
              <div className="space-y-2">
                <Label>Filter by Specialization</Label>
                <Select value={filterSpec} onValueChange={setFilterSpec}>
                  <SelectTrigger><SelectValue placeholder="All specializations" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All specializations</SelectItem>
                    {specializations.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Doctor</Label>
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading doctors from database…
                  </div>
                ) : (
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger><SelectValue placeholder={`Select from ${filteredDoctors.length} doctors`} /></SelectTrigger>
                    <SelectContent>
                      {filteredDoctors.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name} — {d.specialization} · ₹{d.consultation_fee}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {selectedDoctorObj && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm space-y-1">
                  <div className="font-semibold text-foreground">{selectedDoctorObj.name}</div>
                  <div className="text-muted-foreground">{selectedDoctorObj.hospital_name}</div>
                  <div className="flex gap-3 text-xs mt-1">
                    <span className="text-primary font-medium">₹{selectedDoctorObj.consultation_fee}</span>
                    <span className="text-muted-foreground">Available: {Array.isArray(selectedDoctorObj.available_days) ? selectedDoctorObj.available_days.join(", ") : String(selectedDoctorObj.available_days || "—")}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={selectedDate} min={today} onChange={(e) => setSelectedDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Time Slot</Label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((slot) => (
                    <Button key={slot} variant={selectedTime === slot ? "default" : "outline"} size="sm"
                      className="text-xs" onClick={() => setSelectedTime(slot)}>{slot}</Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Visit</Label>
                <Input id="reason" placeholder="e.g., Follow-up, Check-up, Consultation" value={reason}
                  onChange={(e) => setReason(e.target.value)} />
              </div>

              <Button onClick={handleBook} disabled={!selectedDoctor || !selectedDate || !selectedTime || submitting}
                className="w-full gradient-primary text-primary-foreground font-semibold" id="btn-book-appointment">
                {submitting
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Booking…</>
                  : <><CheckCircle className="mr-2 h-4 w-4" />Book Appointment</>}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Existing Appointments */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 font-heading text-lg font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Your Appointments {appointments.length > 0 && <Badge variant="outline">{appointments.length}</Badge>}
          </h2>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : appointments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No appointments yet.<br />Book your first one!
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <Card key={apt.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 font-medium text-foreground text-sm truncate">
                          <User className="h-3.5 w-3.5 text-primary flex-shrink-0" />{apt.doctor_name}
                        </div>
                        {apt.hospital_name && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Building2 className="h-3 w-3" />{apt.hospital_name}
                          </div>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{apt.appointment_date}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{apt.appointment_time}</span>
                        </div>
                        {apt.reason && <p className="text-xs text-muted-foreground mt-1 italic truncate">{apt.reason}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Badge className={statusColor[apt.status] || "bg-muted"}>{apt.status}</Badge>
                        {apt.status !== "Cancelled" && apt.status !== "Completed" && (
                          <button onClick={() => handleCancel(apt.id)}
                            className="text-xs text-destructive hover:underline flex items-center gap-1">
                            <Trash2 className="h-3 w-3" />Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;
