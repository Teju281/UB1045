import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import {
  Building2, Bed, Activity, Wind, Ambulance, TrendingUp,
  BarChart3, Users, AlertTriangle, Cpu, Calendar, ShieldAlert,
  Loader2, Lock, RefreshCw, Clock, User, CheckCircle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { hospitals, getOccupancyPercent } from "@/data/hospitals";

// ── Static hospital-level derived stats ─────────────────────────────────────
const totalBeds = hospitals.reduce((a, h) => a + h.totalBeds, 0);
const totalAvail = hospitals.reduce((a, h) => a + h.availableBeds, 0);
const totalICU = hospitals.reduce((a, h) => a + h.icuBeds, 0);
const totalICUAvail = hospitals.reduce((a, h) => a + h.icuAvailable, 0);
const totalO2 = hospitals.reduce((a, h) => a + h.oxygenBeds, 0);
const totalO2Avail = hospitals.reduce((a, h) => a + h.oxygenAvailable, 0);
const totalVent = hospitals.reduce((a, h) => a + h.ventilators, 0);
const totalVentAvail = hospitals.reduce((a, h) => a + h.ventilatorsAvailable, 0);

const occupancyData = hospitals.map((h) => ({
  name: h.name.split(" ")[0],
  occupancy: getOccupancyPercent(h),
  available: h.availableBeds,
  total: h.totalBeds,
}));

const hospitalTypeData = [
  { name: "Government", value: hospitals.filter((h) => h.type === "Government").length, color: "hsl(var(--primary))" },
  { name: "Private", value: hospitals.filter((h) => h.type === "Private").length, color: "hsl(var(--info))" },
];

const monthlyTrend = [
  { month: "Sep", bedUtil: 62, icuUtil: 58, o2Util: 54 },
  { month: "Oct", bedUtil: 68, icuUtil: 65, o2Util: 60 },
  { month: "Nov", bedUtil: 74, icuUtil: 70, o2Util: 68 },
  { month: "Dec", bedUtil: 82, icuUtil: 78, o2Util: 76 },
  { month: "Jan", bedUtil: 78, icuUtil: 72, o2Util: 70 },
  { month: "Feb", bedUtil: Math.round(((totalBeds - totalAvail) / totalBeds) * 100), icuUtil: Math.round(((totalICU - totalICUAvail) / totalICU) * 100), o2Util: Math.round(((totalO2 - totalO2Avail) / totalO2) * 100) },
];

const diseaseTrend = [
  { month: "Sep", flu: 120, dengue: 45, covid: 30, typhoid: 25 },
  { month: "Oct", flu: 150, dengue: 80, covid: 25, typhoid: 30 },
  { month: "Nov", flu: 180, dengue: 60, covid: 35, typhoid: 22 },
  { month: "Dec", flu: 220, dengue: 30, covid: 50, typhoid: 18 },
  { month: "Jan", flu: 190, dengue: 20, covid: 40, typhoid: 14 },
  { month: "Feb", flu: 160, dengue: 15, covid: 28, typhoid: 10 },
];

// ── Types ────────────────────────────────────────────────────────────────────
interface AdminOverview {
  totalPatients: number;
  totalUsers: number;
  totalHospitals: number;
  totalAppointments: number;
  totalSOS: number;
  pendingSOS: number;
  resolvedSOS: number;
  beds: { total: number; available: number; occupied: number };
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  hospital_id: number | null;
  created_at: string;
}

interface AuditLog {
  id: number;
  action: string;
  resource: string;
  user_name: string | null;
  user_role: string | null;
  created_at: string;
  details: string | null;
}

interface ChartItem { status?: string; role?: string; count: number; }

const roleColors: Record<string, string> = {
  admin: "bg-emergency/10 text-emergency border-emergency/20",
  doctor: "bg-primary/10 text-primary border-primary/20",
  hospital_staff: "bg-info/10 text-info border-info/20",
  patient: "bg-success/10 text-success border-success/20",
  public: "bg-muted text-muted-foreground",
};

// ── Component ────────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [apptChart, setApptChart] = useState<ChartItem[]>([]);
  const [roleChart, setRoleChart] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<number | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const isAdmin = user?.role === "admin";

  const loadData = async () => {
    setLoading(true);
    const token = localStorage.getItem("hh_access_token");
    const h = { Authorization: `Bearer ${token}` };
    try {
      const [statsRes, usersRes, logsRes] = await Promise.all([
        fetch("/api/admin/stats", { headers: h }),
        fetch("/api/admin/users", { headers: h }),
        fetch("/api/admin/audit-logs", { headers: h }),
      ]);
      if (statsRes.ok) {
        const d = await statsRes.json();
        setOverview(d.overview);
        setApptChart(d.charts.appointmentsByStatus || []);
        setRoleChart(d.charts.usersByRole || []);
      }
      if (usersRes.ok) {
        const d = await usersRes.json();
        setUsers(d.users || []);
      }
      if (logsRes.ok) {
        const d = await logsRes.json();
        setLogs(d.logs || []);
      }
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Admin load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    setUpdatingRole(userId);
    const token = localStorage.getItem("hh_access_token");
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      }
    } finally {
      setUpdatingRole(null);
    }
  };

  // ── Access guard ─────────────────────────────────────────────────────────
  if (!user || !isAdmin) {
    return (
      <div className="container mx-auto max-w-md px-4 py-20 text-center">
        <Lock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Admin Access Only</h2>
        <p className="text-muted-foreground mb-4">Login as admin to view the analytics dashboard.</p>
        <p className="text-xs text-muted-foreground">Demo: <strong>admin@demo.com</strong> / <strong>demo1234</strong></p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading admin analytics from database…</p>
        </div>
      </div>
    );
  }

  // ── Live + static merged stat cards ──────────────────────────────────────
  const statsCards = [
    { label: "Hospitals", value: (overview?.totalHospitals ?? hospitals.length).toString(), icon: Building2, color: "text-primary", bg: "bg-primary/10", sub: "Registered" },
    { label: "Total Beds", value: totalBeds.toLocaleString(), icon: Bed, color: "text-info", bg: "bg-info/10", sub: `${totalAvail} available` },
    { label: "Bed Occupancy", value: `${Math.round(((totalBeds - totalAvail) / totalBeds) * 100)}%`, icon: TrendingUp, color: "text-warning", bg: "bg-warning/10", sub: "Across all hospitals" },
    { label: "ICU Available", value: `${totalICUAvail}/${totalICU}`, icon: Activity, color: "text-emergency", bg: "bg-emergency/10", sub: "ICU beds" },
    { label: "Total Users", value: (overview?.totalUsers ?? "—").toString(), icon: Users, color: "text-info", bg: "bg-info/10", sub: "Registered accounts" },
    { label: "Patients", value: (overview?.totalPatients ?? "—").toString(), icon: User, color: "text-success", bg: "bg-success/10", sub: "Patient profiles" },
    { label: "Appointments", value: (overview?.totalAppointments ?? "—").toString(), icon: Calendar, color: "text-primary", bg: "bg-accent", sub: "Total booked" },
    { label: "SOS Alerts", value: (overview?.totalSOS ?? "—").toString(), icon: ShieldAlert, color: "text-emergency", bg: "bg-emergency/10", sub: `${overview?.pendingSOS ?? 0} pending` },
  ];

  const apptPieData = apptChart.map((a) => ({
    name: a.status || a.role || "",
    value: a.count,
    color: a.status === "Confirmed" ? "hsl(var(--success))" : a.status === "Pending" ? "hsl(var(--warning))" : a.status === "Completed" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
  }));

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Admin Analytics Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Live system-wide healthcare analytics • Karnataka</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-success text-success-foreground gap-1"><Activity className="h-3 w-3" /> Live</Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <Clock className="h-3 w-3" />
            {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </Badge>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={loadData}>
            <RefreshCw className="h-3.5 w-3.5" />Refresh
          </Button>
        </div>
      </div>

      {/* Live Stats Grid */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {statsCards.map((stat) => (
          <Card key={stat.label} className="shadow-card col-span-1">
            <CardContent className="p-4 text-center">
              <div className={`mx-auto mb-2 inline-flex rounded-lg ${stat.bg} p-2`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="text-xl font-bold font-heading text-foreground">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground font-medium">{stat.label}</div>
              <div className="text-[9px] text-muted-foreground/70 mt-0.5">{stat.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Capacity bars */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Bed Utilization", used: totalBeds - totalAvail, total: totalBeds, color: "text-primary" },
          { label: "ICU Utilization", used: totalICU - totalICUAvail, total: totalICU, color: "text-emergency" },
          { label: "Oxygen Beds", used: totalO2 - totalO2Avail, total: totalO2, color: "text-warning" },
          { label: "Ventilators", used: totalVent - totalVentAvail, total: totalVent, color: "text-info" },
        ].map((item) => {
          const pct = Math.round((item.used / item.total) * 100);
          return (
            <Card key={item.label} className="shadow-card">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <span className={`text-sm font-bold ${item.color}`}>{pct}%</span>
                </div>
                <Progress value={pct} className="h-2 mb-2" />
                <div className="text-xs text-muted-foreground">{item.used} used / {item.total} total</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="infrastructure" className="mt-6">
        <TabsList className="mb-6 grid w-full grid-cols-2 sm:grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="infrastructure"><BarChart3 className="mr-1 h-3.5 w-3.5" />Infrastructure</TabsTrigger>
          <TabsTrigger value="live"><Activity className="mr-1 h-3.5 w-3.5" />Live Data</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-1 h-3.5 w-3.5" />Users ({users.length})</TabsTrigger>
          <TabsTrigger value="logs"><Clock className="mr-1 h-3.5 w-3.5" />Audit Logs</TabsTrigger>
        </TabsList>

        {/* Infrastructure tab */}
        <TabsContent value="infrastructure" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><BarChart3 className="h-4 w-4 text-primary" />Hospital Bed Occupancy (%)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={occupancyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                    <Tooltip formatter={(v) => [`${v}%`, "Occupancy"]} />
                    <Bar dataKey="occupancy" radius={[4, 4, 0, 0]}>
                      {occupancyData.map((entry, i) => (
                        <Cell key={i} fill={entry.occupancy >= 100 ? "hsl(var(--destructive))" : entry.occupancy >= 85 ? "hsl(var(--warning))" : "hsl(var(--success))"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><TrendingUp className="h-4 w-4 text-primary" />Monthly Infrastructure Utilization (%)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" domain={[40, 100]} />
                    <Tooltip formatter={(v) => [`${v}%`]} />
                    <Legend />
                    <Area type="monotone" dataKey="bedUtil" name="Bed Util%" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.1)" strokeWidth={2} />
                    <Area type="monotone" dataKey="icuUtil" name="ICU Util%" stroke="hsl(var(--emergency))" fill="hsl(var(--emergency)/0.1)" strokeWidth={2} />
                    <Area type="monotone" dataKey="o2Util" name="O₂ Util%" stroke="hsl(var(--warning))" fill="hsl(var(--warning)/0.1)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Building2 className="h-4 w-4 text-primary" />Hospital Type Split</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={hospitalTypeData} cx="40%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {hospitalTypeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-primary" />Disease Trend (6 Months)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={diseaseTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip /><Legend />
                    <Line type="monotone" dataKey="flu" name="Influenza" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="dengue" name="Dengue" stroke="hsl(var(--warning))" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="covid" name="COVID-19" stroke="hsl(var(--emergency))" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="typhoid" name="Typhoid" stroke="hsl(var(--info))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Hospital table */}
          <Card className="shadow-card">
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><BarChart3 className="h-4 w-4 text-primary" />Hospital-wise Resource Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Hospital", "Type", "Beds", "ICU", "O₂ Beds", "Ventilators", "Ambulances", "Occupancy"].map((h) => (
                        <th key={h} className="pb-3 text-left text-xs font-semibold text-muted-foreground pr-4 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hospitals.map((h) => {
                      const occ = getOccupancyPercent(h);
                      return (
                        <tr key={h.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-3 font-medium text-foreground pr-4 whitespace-nowrap">{h.name}</td>
                          <td className="py-3 pr-4"><Badge variant="outline" className="text-xs">{h.type}</Badge></td>
                          <td className="py-3 pr-4 text-muted-foreground">{h.availableBeds}/{h.totalBeds}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{h.icuAvailable}/{h.icuBeds}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{h.oxygenAvailable}/{h.oxygenBeds}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{h.ventilatorsAvailable}/{h.ventilators}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{h.ambulancesAvailable}</td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <Progress value={occ} className="h-1.5 w-16" />
                              <span className={`text-xs font-medium ${occ >= 100 ? "text-destructive" : occ >= 85 ? "text-warning" : "text-success"}`}>{occ}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live DB Data tab */}
        <TabsContent value="live" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Appointments by status */}
            <Card className="shadow-card">
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-primary" />Appointments by Status (Live DB)</CardTitle></CardHeader>
              <CardContent>
                {apptPieData.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">No appointment data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={apptPieData} cx="40%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                        {apptPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {apptChart.map((a) => (
                    <div key={a.status} className="flex items-center justify-between rounded-lg bg-muted p-2.5">
                      <span className="text-sm text-muted-foreground">{a.status}</span>
                      <span className="font-bold text-foreground">{a.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Users by role */}
            <Card className="shadow-card">
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-primary" />Users by Role (Live DB)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={roleChart} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="role" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Bar dataKey="count" name="Users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {roleChart.map((r) => (
                    <div key={r.role} className="flex items-center justify-between rounded-lg bg-muted p-2.5">
                      <span className="text-sm text-muted-foreground capitalize">{r.role}</span>
                      <span className="font-bold text-foreground">{r.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* SOS summary */}
            <Card className="shadow-card border-emergency/20">
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm text-emergency"><ShieldAlert className="h-4 w-4" />Emergency SOS Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { label: "Total", value: overview?.totalSOS ?? 0, color: "text-foreground" },
                    { label: "Pending", value: overview?.pendingSOS ?? 0, color: "text-warning" },
                    { label: "Resolved", value: overview?.resolvedSOS ?? 0, color: "text-success" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-muted p-4">
                      <div className={`text-2xl font-bold font-heading ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* DB Bed summary */}
            <Card className="shadow-card">
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Bed className="h-4 w-4 text-primary" />Bed Tracking Summary (DB)</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { label: "Total", value: overview?.beds.total ?? 0, color: "text-foreground" },
                    { label: "Available", value: overview?.beds.available ?? 0, color: "text-success" },
                    { label: "Occupied", value: overview?.beds.occupied ?? 0, color: "text-emergency" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-muted p-4">
                      <div className={`text-2xl font-bold font-heading ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
                {overview && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Occupancy</span>
                      <span className="font-medium">{overview.beds.total > 0 ? Math.round((overview.beds.occupied / overview.beds.total) * 100) : 0}%</span>
                    </div>
                    <Progress value={overview.beds.total > 0 ? Math.round((overview.beds.occupied / overview.beds.total) * 100) : 0} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Management tab */}
        <TabsContent value="users">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-primary" />User Management — {users.length} accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["#", "Name", "Email", "Role", "Registered", "Change Role"].map((h) => (
                        <th key={h} className="pb-3 text-left text-xs font-semibold text-muted-foreground pr-4 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4 text-muted-foreground text-xs">{u.id}</td>
                        <td className="py-3 pr-4 font-medium text-foreground whitespace-nowrap">{u.name}</td>
                        <td className="py-3 pr-4 text-muted-foreground text-xs">{u.email}</td>
                        <td className="py-3 pr-4">
                          <Badge className={`text-xs border ${roleColors[u.role] || ""}`}>{u.role}</Badge>
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(u.created_at).toLocaleDateString("en-IN")}
                        </td>
                        <td className="py-3 pr-4">
                          {updatingRole === u.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <select
                              className="text-xs rounded border border-input bg-background px-2 py-1"
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            >
                              {["patient", "doctor", "hospital_staff", "admin", "public"].map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs tab */}
        <TabsContent value="logs">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />Recent Activity Logs — {logs.length} entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <Clock className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  No activity logs yet. Actions will appear here as users interact with the system.
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <span>{log.action}</span>
                          {log.resource && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{log.resource}</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                          {log.user_name && <span className="flex items-center gap-1"><User className="h-3 w-3" />{log.user_name}</span>}
                          {log.user_role && <Badge className={`text-[10px] px-1.5 py-0 ${roleColors[log.user_role] || ""}`}>{log.user_role}</Badge>}
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(log.created_at).toLocaleString("en-IN")}</span>
                        </div>
                        {log.details && <p className="text-xs text-muted-foreground/70 mt-1 truncate">{log.details}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
