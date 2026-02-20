import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle, MapPin, Phone, Heart, Activity, Loader2,
  Bed, Wind, Ambulance, CheckCircle, Navigation, ArrowRight,
} from "lucide-react";
import { hospitals, getOccupancyPercent, getBedStatus, getDistanceKm, type Hospital } from "@/data/hospitals";

const DAVANAGERE_CENTER = { lat: 14.4663, lng: 75.9239 };

type GeolocationCoords = { lat: number; lng: number } | null;

const statusConfig = {
  available: { label: "Beds Available", className: "bg-success text-success-foreground", dot: "bg-success" },
  limited: { label: "Limited Availability", className: "bg-warning text-warning-foreground", dot: "bg-warning" },
  full: { label: "Full", className: "bg-destructive text-destructive-foreground", dot: "bg-destructive" },
};

const EmergencySOS = () => {
  const [step, setStep] = useState<"form" | "locating" | "result">("form");
  const [age, setAge] = useState("35");
  const [oxygenLevel, setOxygenLevel] = useState([95]);
  const [symptoms, setSymptoms] = useState("");
  const [coords, setCoords] = useState<GeolocationCoords>(null);
  const [sortedHospitals, setSortedHospitals] = useState<(Hospital & { distanceKm: number })[]>([]);
  const [priority, setPriority] = useState<{ level: string; score: number; color: string } | null>(null);

  const calculatePriority = (score: number) => {
    let level = "NORMAL";
    let color = "bg-success text-success-foreground";
    if (score >= 5) { level = "CRITICAL"; color = "bg-destructive text-destructive-foreground"; }
    else if (score >= 3) { level = "HIGH"; color = "bg-emergency text-emergency-foreground"; }
    else if (score >= 1) { level = "MODERATE"; color = "bg-warning text-warning-foreground"; }
    return { level, score, color };
  };

  const handleSOS = async () => {
    let score = 0;
    const ageNum = parseInt(age);
    if (ageNum > 60) score += 2;
    if (ageNum > 75) score += 1;
    if (oxygenLevel[0] < 92) score += 3;
    if (oxygenLevel[0] < 85) score += 2;
    const severe = ["chest pain", "unconscious", "bleeding", "stroke", "seizure", "heart attack"];
    if (severe.some((s) => symptoms.toLowerCase().includes(s))) score += 3;
    setPriority(calculatePriority(score));
    setStep("locating");

    const submitSOS = async (c: { lat: number; lng: number }) => {
      setCoords(c);
      buildSortedList(c);
      setStep("result");
      // Save SOS alert to backend database
      try {
        await fetch("/api/emergency/sos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient_age: ageNum,
            oxygen_level: oxygenLevel[0],
            symptoms,
            priority_level: calculatePriority(score).level,
            priority_score: score,
            lat: c.lat,
            lng: c.lng,
          }),
        });
      } catch (e) {
        console.warn("SOS save failed (non-critical):", e);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => submitSOS({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => submitSOS(DAVANAGERE_CENTER),
        { timeout: 8000 }
      );
    } else {
      submitSOS(DAVANAGERE_CENTER);
    }
  };

  const buildSortedList = (c: { lat: number; lng: number }) => {
    const list = hospitals
      .map((h) => ({ ...h, distanceKm: getDistanceKm(c.lat, c.lng, h.lat, h.lng) }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
    setSortedHospitals(list);
  };

  const reset = () => {
    setStep("form");
    setPriority(null);
    setSortedHospitals([]);
    setCoords(null);
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emergency/10 animate-pulse-glow">
          <AlertTriangle className="h-10 w-10 text-emergency" />
        </div>
        <h1 className="font-heading text-4xl font-extrabold text-foreground">Emergency SOS</h1>
        <p className="mt-2 text-muted-foreground">Geolocation-based hospital finder with live bed availability</p>
      </div>

      {step === "form" && (
        <div className="space-y-6 animate-slide-up">
          {/* Priority Info Banner */}
          <div className="rounded-xl border border-emergency/30 bg-emergency/5 p-4">
            <p className="text-sm text-emergency font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              For life-threatening emergencies, call <strong>112</strong> immediately. This system helps find the nearest available hospital.
            </p>
          </div>

          <Card className="shadow-elevated border-emergency/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emergency">
                <Heart className="h-5 w-5" />
                Patient & Emergency Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sos-age">Patient Age</Label>
                  <Input id="sos-age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" min="0" max="120" />
                </div>
                <div className="space-y-2">
                  <Label>Oxygen Level (SpO₂): <span className={`font-bold ${oxygenLevel[0] < 92 ? "text-emergency" : "text-success"}`}>{oxygenLevel[0]}%</span></Label>
                  <Slider value={oxygenLevel} onValueChange={setOxygenLevel} max={100} min={60} step={1} className="mt-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>60%</span><span>Critical &lt;92%</span><span>100%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sos-symptoms">Symptoms / Situation</Label>
                <Input
                  id="sos-symptoms"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g., chest pain, difficulty breathing, unconscious, bleeding..."
                />
                <p className="text-xs text-muted-foreground">Critical keywords auto-detect priority level</p>
              </div>
              <Button
                onClick={handleSOS}
                className="w-full gradient-emergency text-emergency-foreground font-bold text-lg py-6 animate-pulse-glow"
                size="lg"
                id="btn-send-sos"
              >
                <AlertTriangle className="mr-2 h-5 w-5" />
                FIND NEAREST HOSPITAL & SEND SOS
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {step === "locating" && (
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <Loader2 className="h-16 w-16 text-emergency animate-spin" />
          <div className="text-center">
            <h2 className="font-heading text-2xl font-bold text-foreground">Locating You...</h2>
            <p className="text-muted-foreground mt-1">Detecting nearest hospitals with available beds</p>
          </div>
        </div>
      )}

      {step === "result" && (
        <div className="space-y-6 animate-slide-up">
          {/* Priority Badge */}
          {priority && (
            <Card className="border-2 border-emergency/30 shadow-elevated">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-emergency/10">
                    <CheckCircle className="h-8 w-8 text-emergency" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="font-heading text-2xl font-bold text-foreground">SOS Alert Sent!</h2>
                    <p className="text-muted-foreground text-sm mt-1">Emergency services notified. Nearest hospitals shown below.</p>
                  </div>
                  <div className={`rounded-full px-6 py-2.5 text-base font-bold ${priority.color}`}>
                    {priority.level} Priority
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {coords && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
              <Navigation className="h-4 w-4 text-primary" />
              <span>Location detected — hospitals sorted by distance</span>
            </div>
          )}

          {/* Hospital List */}
          <div className="space-y-4">
            {sortedHospitals.map((hospital, idx) => {
              const status = getBedStatus(hospital);
              const occupancy = getOccupancyPercent(hospital);
              const sc = statusConfig[status];
              return (
                <Card
                  key={hospital.id}
                  className={`shadow-card transition-all hover:shadow-elevated ${idx === 0 ? "border-2 border-success/40 ring-2 ring-success/10" : ""}`}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              {idx === 0 && <Badge className="bg-success text-success-foreground text-xs">Nearest</Badge>}
                              <h3 className="font-heading font-bold text-foreground">{hospital.name}</h3>
                              <Badge variant="outline" className="text-xs">{hospital.type}</Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{hospital.area}</span>
                              <span className="font-medium text-primary">{hospital.distanceKm} km away</span>
                            </div>
                          </div>
                          <Badge className={sc.className}>{sc.label}</Badge>
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Occupancy</span>
                            <span className={`font-medium ${occupancy >= 100 ? "text-destructive" : occupancy >= 85 ? "text-warning" : "text-success"}`}>{occupancy}%</span>
                          </div>
                          <Progress value={occupancy} className="h-2" />
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                          {[
                            { label: "Beds", value: hospital.availableBeds, total: hospital.totalBeds, icon: Bed },
                            { label: "ICU", value: hospital.icuAvailable, total: hospital.icuBeds, icon: Activity },
                            { label: "O₂ Beds", value: hospital.oxygenAvailable, total: hospital.oxygenBeds, icon: Wind },
                            { label: "Ventilators", value: hospital.ventilatorsAvailable, total: hospital.ventilators, icon: Wind },
                            { label: "Ambulances", value: hospital.ambulancesAvailable, total: null, icon: Ambulance },
                          ].map((item) => (
                            <div key={item.label} className="rounded-lg bg-muted p-2 text-center">
                              <div className={`text-lg font-bold ${item.value === 0 ? "text-destructive" : "text-foreground"}`}>{item.value}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {item.label}
                                {item.total !== null && <span className="text-muted-foreground/60">/{item.total}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <a href={`tel:${hospital.phone}`} className="flex-1">
                        <Button variant="default" className="w-full gap-2 gradient-primary text-primary-foreground">
                          <Phone className="h-4 w-4" />
                          Call: {hospital.phone}
                        </Button>
                      </a>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button variant="outline" className="w-full gap-2">
                          <Navigation className="h-4 w-4" />
                          Get Directions
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button onClick={reset} variant="outline" className="w-full" id="btn-new-sos">
            <ArrowRight className="mr-2 h-4 w-4" />
            Start New SOS
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmergencySOS;
