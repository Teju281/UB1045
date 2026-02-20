import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
    Bed, Activity, Wind, Ambulance, Users, Building2,
    Save, RefreshCw, CheckCircle, AlertTriangle, Clock,
} from "lucide-react";
import { hospitals as initialHospitals } from "@/data/hospitals";
import { useAuth } from "@/context/AuthContext";

const StaffPortal = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [hospitalData, setHospitalData] = useState(() =>
        initialHospitals.map((h) => ({ ...h }))
    );
    const [selectedHospitalId, setSelectedHospitalId] = useState<number>(
        user?.hospital_id ?? initialHospitals[0].id
    );
    const [saved, setSaved] = useState(false);

    const hospital = hospitalData.find((h) => h.id === selectedHospitalId)!;
    const occupancy = Math.round(((hospital.totalBeds - hospital.availableBeds) / hospital.totalBeds) * 100);

    const update = (field: keyof typeof hospital, value: number) => {
        setHospitalData((prev) =>
            prev.map((h) => h.id === selectedHospitalId ? { ...h, [field]: value, lastUpdated: new Date().toISOString() } : h)
        );
        setSaved(false);
    };

    const handleSave = () => {
        setSaved(true);
        toast({ title: "Data saved", description: "Hospital resource data has been updated successfully." });
    };

    if (!user || !["hospital_staff", "admin", "doctor"].includes(user.role)) {
        return (
            <div className="container mx-auto max-w-md px-4 py-20 text-center">
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-warning" />
                <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Access Restricted</h2>
                <p className="text-muted-foreground">This portal is only accessible to Hospital Staff and Admins.</p>
                <a href="/login" className="mt-4 inline-block text-primary hover:underline">Login with Staff credentials</a>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-5xl px-4 py-8">
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="font-heading text-3xl font-bold text-foreground">Hospital Staff Portal</h1>
                    <p className="mt-1 text-muted-foreground">Update real-time resource availability for your hospital</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className="bg-success text-success-foreground gap-1">
                        <Activity className="h-3 w-3" /> Live
                    </Badge>
                    <Badge variant="outline">{user.name}</Badge>
                </div>
            </div>

            {/* Hospital selector for admins */}
            {user.role === "admin" && (
                <div className="mb-6">
                    <Label className="mb-2 block text-sm">Select Hospital</Label>
                    <div className="flex flex-wrap gap-2">
                        {initialHospitals.map((h) => (
                            <Button
                                key={h.id}
                                variant={selectedHospitalId === h.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedHospitalId(h.id)}
                            >
                                {h.name.split(" ")[0]}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Hospital Info */}
            <Card className="mb-6 shadow-card border-primary/20">
                <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-primary/10 p-3">
                                <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <div className="font-heading font-bold text-foreground text-lg">{hospital.name}</div>
                                <div className="text-sm text-muted-foreground">{hospital.type} • {hospital.area}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-muted-foreground">Last Updated</div>
                            <div className="text-sm font-medium text-foreground flex items-center gap-1 justify-end">
                                <Clock className="h-3 w-3" />
                                {new Date(hospital.lastUpdated).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Current Bed Occupancy</span>
                            <span className={`font-semibold ${occupancy >= 100 ? "text-destructive" : occupancy >= 85 ? "text-warning" : "text-success"}`}>{occupancy}%</span>
                        </div>
                        <Progress value={occupancy} className="h-2" />
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="beds">
                <TabsList className="mb-6">
                    <TabsTrigger value="beds">Bed Management</TabsTrigger>
                    <TabsTrigger value="icu">ICU & Oxygen</TabsTrigger>
                    <TabsTrigger value="staff">Staff & Ambulance</TabsTrigger>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                </TabsList>

                <TabsContent value="beds" className="space-y-4">
                    <Card className="shadow-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Bed className="h-4 w-4 text-primary" /> General Bed Management
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="totalBeds">Total Beds</Label>
                                    <Input id="totalBeds" type="number" value={hospital.totalBeds} onChange={(e) => update("totalBeds", +e.target.value)} min="0" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="availBeds">Available Beds</Label>
                                    <Input id="availBeds" type="number" value={hospital.availableBeds} onChange={(e) => update("availableBeds", Math.min(+e.target.value, hospital.totalBeds))} min="0" max={hospital.totalBeds} />
                                </div>
                            </div>
                            <div className="rounded-lg bg-muted p-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-muted-foreground">Bed Occupancy</span>
                                    <span className="font-bold text-foreground">{occupancy}%</span>
                                </div>
                                <Progress value={occupancy} className="h-3" />
                                <div className="mt-2 text-xs text-muted-foreground">
                                    {hospital.totalBeds - hospital.availableBeds} occupied / {hospital.availableBeds} available out of {hospital.totalBeds} total
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="icu" className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Card className="shadow-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Activity className="h-4 w-4 text-emergency" /> ICU Beds
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Total ICU Beds</Label>
                                    <Input type="number" value={hospital.icuBeds} onChange={(e) => update("icuBeds", +e.target.value)} min="0" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Available ICU Beds</Label>
                                    <Input type="number" value={hospital.icuAvailable} onChange={(e) => update("icuAvailable", Math.min(+e.target.value, hospital.icuBeds))} min="0" max={hospital.icuBeds} />
                                </div>
                                <Progress value={((hospital.icuBeds - hospital.icuAvailable) / hospital.icuBeds) * 100} className="h-2" />
                            </CardContent>
                        </Card>

                        <Card className="shadow-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Wind className="h-4 w-4 text-success" /> Oxygen Beds
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Total O₂ Beds</Label>
                                    <Input type="number" value={hospital.oxygenBeds} onChange={(e) => update("oxygenBeds", +e.target.value)} min="0" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Available O₂ Beds</Label>
                                    <Input type="number" value={hospital.oxygenAvailable} onChange={(e) => update("oxygenAvailable", Math.min(+e.target.value, hospital.oxygenBeds))} min="0" max={hospital.oxygenBeds} />
                                </div>
                                <Progress value={((hospital.oxygenBeds - hospital.oxygenAvailable) / hospital.oxygenBeds) * 100} className="h-2" />
                            </CardContent>
                        </Card>

                        <Card className="shadow-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Wind className="h-4 w-4 text-info" /> Ventilators
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Total Ventilators</Label>
                                    <Input type="number" value={hospital.ventilators} onChange={(e) => update("ventilators", +e.target.value)} min="0" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Available Ventilators</Label>
                                    <Input type="number" value={hospital.ventilatorsAvailable} onChange={(e) => update("ventilatorsAvailable", Math.min(+e.target.value, hospital.ventilators))} min="0" max={hospital.ventilators} />
                                </div>
                                <Progress value={((hospital.ventilators - hospital.ventilatorsAvailable) / hospital.ventilators) * 100} className="h-2" />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="staff" className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            { label: "Doctors on Duty", field: "doctorsOnDuty", icon: Users, color: "text-primary" },
                            { label: "Nurses on Duty", field: "nursesOnDuty", icon: Users, color: "text-info" },
                            { label: "Ambulances Available", field: "ambulancesAvailable", icon: Ambulance, color: "text-emergency" },
                        ].map((item) => (
                            <Card key={item.field} className="shadow-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-sm">
                                        <item.icon className={`h-4 w-4 ${item.color}`} />
                                        {item.label}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Input
                                        type="number"
                                        value={hospital[item.field as keyof typeof hospital] as number}
                                        onChange={(e) => update(item.field as keyof typeof hospital, +e.target.value)}
                                        min="0"
                                        className="text-2xl font-bold h-14 text-center"
                                    />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="overview">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            { label: "General Beds", avail: hospital.availableBeds, total: hospital.totalBeds, color: "text-primary" },
                            { label: "ICU Beds", avail: hospital.icuAvailable, total: hospital.icuBeds, color: "text-emergency" },
                            { label: "Oxygen Beds", avail: hospital.oxygenAvailable, total: hospital.oxygenBeds, color: "text-success" },
                            { label: "Ventilators", avail: hospital.ventilatorsAvailable, total: hospital.ventilators, color: "text-warning" },
                            { label: "Doctors on Duty", avail: hospital.doctorsOnDuty, total: null, color: "text-primary" },
                            { label: "Nurses on Duty", avail: hospital.nursesOnDuty, total: null, color: "text-info" },
                            { label: "Ambulances", avail: hospital.ambulancesAvailable, total: null, color: "text-emergency" },
                        ].map((item) => (
                            <Card key={item.label} className="shadow-card">
                                <CardContent className="p-4">
                                    <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                                    <div className={`text-3xl font-bold font-heading ${item.color}`}>
                                        {item.avail}
                                        {item.total !== null && <span className="text-base font-normal text-muted-foreground">/{item.total}</span>}
                                    </div>
                                    {item.total !== null && (
                                        <Progress value={((item.total - item.avail) / item.total) * 100} className="mt-2 h-1.5" />
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Save Button */}
            <div className="mt-8 flex items-center gap-4">
                <Button onClick={handleSave} className="gap-2 gradient-primary text-primary-foreground font-semibold px-8" size="lg" id="btn-save-staff">
                    {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {saved ? "Saved!" : "Save Changes"}
                </Button>
                <Button
                    variant="outline"
                    onClick={() => { setHospitalData(initialHospitals.map((h) => ({ ...h }))); setSaved(false); }}
                    className="gap-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    Reset
                </Button>
                {saved && (
                    <span className="text-sm text-success flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" /> Changes saved successfully
                    </span>
                )}
            </div>
        </div>
    );
};

export default StaffPortal;
