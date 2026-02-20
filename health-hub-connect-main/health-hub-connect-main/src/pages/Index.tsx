import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Bed,
  AlertTriangle,
  BarChart3,
  Shield,
  ArrowRight,
  Activity,
  Users,
  Building2,
  Clock,
  FileText,
  Stethoscope,
  Ambulance,
  Cpu,
} from "lucide-react";

const features = [
  {
    icon: AlertTriangle,
    title: "Public Emergency Module",
    description: "Real-time geolocation-based nearest hospital finder with live bed counts, ICU, oxygen & ambulance status.",
    color: "text-emergency",
    bg: "bg-emergency/10",
    path: "/emergency",
  },
  {
    icon: Bed,
    title: "Hospital Infrastructure",
    description: "Full infrastructure visibility — beds, ICU, oxygen, ventilators, doctors, nurses and ambulances.",
    color: "text-success",
    bg: "bg-success/10",
    path: "/beds",
  },
  {
    icon: BarChart3,
    title: "Admin Analytics Dashboard",
    description: "City-level hospital analytics with occupancy charts, capacity trends and monthly utilisation data.",
    color: "text-primary",
    bg: "bg-primary/10",
    path: "/admin",
  },
  {
    icon: Stethoscope,
    title: "Hospital Staff Portal",
    description: "Secure staff login to update bed counts, ICU, oxygen and ambulance availability in real time.",
    color: "text-info",
    bg: "bg-info/10",
    path: "/staff",
  },
  {
    icon: FileText,
    title: "Digital Health Records",
    description: "Patient registration, medical history, lab reports, doctor notes and prescription records with access control.",
    color: "text-warning",
    bg: "bg-warning/10",
    path: "/health-records",
  },
  {
    icon: Shield,
    title: "Role-Based Access Control",
    description: "Five distinct roles — Public, Patient, Hospital Staff, Admin and Doctor — each with tailored dashboards.",
    color: "text-primary",
    bg: "bg-accent",
    path: "/login",
  },
];

const stats = [
  { icon: Building2, value: "8+", label: "Hospitals" },
  { icon: Bed, value: "3,010", label: "Total Beds" },
  { icon: Ambulance, value: "41", label: "Ambulances" },
  { icon: Clock, value: "<2 min", label: "Avg Response" },
];

const roles = [
  { label: "Public User", desc: "Emergency access, hospital search", icon: Users, color: "bg-muted text-muted-foreground" },
  { label: "Patient", desc: "Health records, prescriptions", icon: Heart, color: "bg-success/20 text-success" },
  { label: "Hospital Staff", desc: "Update bed & resource counts", icon: Bed, color: "bg-info/20 text-info" },
  { label: "Doctor", desc: "Patient notes, consultations", icon: Stethoscope, color: "bg-warning/20 text-warning" },
  { label: "Admin", desc: "Full analytics & management", icon: Shield, color: "bg-primary/20 text-primary" },
];

const Index = () => {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero px-4 py-24 text-primary-foreground md:py-36">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(187_65%_45%/0.2),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(0_85%_55%/0.08),transparent_50%)]" />
        <div className="container relative mx-auto max-w-5xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-5 py-2 text-sm font-medium backdrop-blur-sm">
            <Activity className="h-4 w-4 animate-pulse" />
            Smart Health Infrastructure Monitoring & Emergency Response System
          </div>
          <h1 className="mb-6 font-heading text-4xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl">
            Healthcare at Your
            <br />
            <span className="bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
              Fingertips
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-primary-foreground/75 md:text-xl">
            Real-time hospital infrastructure transparency, emergency response automation,
            and digital health record management — all in one powerful platform.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/emergency">
              <Button
                size="lg"
                className="gap-2 bg-emergency text-emergency-foreground hover:bg-emergency/90 font-bold px-8 py-6 text-base animate-pulse-glow shadow-elevated"
              >
                <AlertTriangle className="h-5 w-5" />
                Emergency SOS
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                className="gap-2 bg-primary-foreground text-foreground hover:bg-primary-foreground/90 font-semibold px-8"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/beds">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Bed className="h-4 w-4" />
                Check Bed Availability
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card px-4 py-14">
        <div className="container mx-auto grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center animate-count-up">
              <stat.icon className="mx-auto mb-2 h-6 w-6 text-primary" />
              <div className="text-3xl font-bold font-heading text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="mb-3 font-heading text-3xl font-bold text-foreground md:text-4xl">
              Everything You Need
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              A comprehensive platform for patients, hospital staff, doctors, and administrators.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <Link to={feature.path} key={feature.title}>
                <div
                  className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 cursor-pointer h-full"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={`mb-4 inline-flex rounded-lg ${feature.bg} p-3`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="mb-2 font-heading text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="px-4 py-20 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 font-heading text-3xl font-bold text-foreground md:text-4xl">
              Role-Based Access
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Five distinct roles with tailored dashboards and access controls.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {roles.map((role) => (
              <div key={role.label} className="rounded-xl border border-border bg-card p-5 text-center shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                <div className={`mx-auto mb-3 inline-flex rounded-full p-3 ${role.color}`}>
                  <role.icon className="h-5 w-5" />
                </div>
                <div className="font-heading font-semibold text-foreground text-sm">{role.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{role.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI / Future */}
      <section className="px-4 py-20 bg-background">
        <div className="container mx-auto max-w-5xl">
          <div className="rounded-2xl border border-border bg-card p-10 shadow-elevated">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <Cpu className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold text-foreground">Future Scalability Roadmap</h2>
                <p className="text-muted-foreground text-sm">Technology-forward health infrastructure</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "AI Bed Demand Prediction", desc: "ML models forecasting hospital capacity needs 24-48 hrs in advance" },
                { title: "Government API Integration", desc: "Direct sync with NHA Ayushman Bharat & ABHA digital health IDs" },
                { title: "Real-Time Data Sync", desc: "Hospital management systems streaming live bed availability updates" },
                { title: "National-Level Scaling", desc: "State → District → National aggregation with outbreak alerting" },
              ].map((item) => (
                <div key={item.title} className="rounded-lg bg-accent/50 p-4">
                  <div className="mb-2 font-heading font-semibold text-foreground text-sm">{item.title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Emergency */}
      <section className="px-4 py-20 bg-muted/30">
        <div className="container mx-auto max-w-3xl">
          <div className="rounded-2xl gradient-primary p-10 text-center text-primary-foreground shadow-elevated md:p-16">
            <AlertTriangle className="mx-auto mb-4 h-10 w-10" />
            <h2 className="mb-3 font-heading text-3xl font-bold">Emergency? Get Help Now</h2>
            <p className="mb-8 text-primary-foreground/75">
              One-click SOS with automatic priority scoring, geolocation-based hospital detection and live ambulance tracking.
            </p>
            <Link to="/emergency">
              <Button
                size="lg"
                className="gap-2 bg-emergency text-emergency-foreground hover:bg-emergency/90 font-bold px-8 animate-pulse-glow"
              >
                <AlertTriangle className="h-5 w-5" />
                Emergency SOS
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <Heart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-foreground">
              HealthHub<span className="text-primary">Connect</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 HealthHubConnect. Smart Health Infrastructure Monitoring & Emergency Response System.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
