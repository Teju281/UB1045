import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, User, Stethoscope, Shield, Bed, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const roles = [
  { value: "patient", label: "Patient", icon: User, desc: "Access health records & prescriptions", email: "patient@demo.com" },
  { value: "doctor", label: "Doctor", icon: Stethoscope, desc: "Manage patients & consultations", email: "doctor@demo.com" },
  { value: "hospital_staff", label: "Staff", icon: Bed, desc: "Update bed & resource counts", email: "staff@demo.com" },
  { value: "admin", label: "Admin", icon: Shield, desc: "Full analytics & management", email: "admin@demo.com" },
];

const roleDestinations: Record<string, string> = {
  patient: "/health-records",
  doctor: "/health-records",
  hospital_staff: "/staff",
  admin: "/admin",
};

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState("patient");
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedRoleObj = roles.find((r) => r.value === selectedRole);

  const prefillDemo = () => {
    if (selectedRoleObj) {
      setEmail(selectedRoleObj.email);
      setPassword("demo1234");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        const result = await login(email, password);
        if (result.success) {
          toast({ title: "✅ Logged in successfully", description: "Welcome back! Redirecting..." });
          navigate(roleDestinations[selectedRole] || "/");
        } else {
          toast({ title: "Login failed", description: result.error || "Invalid credentials.", variant: "destructive" });
        }
      } else {
        // Register via API directly
        const { authApi } = await import("@/lib/api");
        const res = await authApi.register(name, email, password, selectedRole);
        if (res.accessToken) {
          // Auto-login after registration
          const result = await login(email, password);
          if (result.success) {
            toast({ title: "✅ Account created!", description: `Welcome, ${name}! Your Health ID has been generated.` });
            navigate(roleDestinations[selectedRole] || "/");
          }
        } else {
          toast({ title: "Registration failed", description: res.error || "Could not create account.", variant: "destructive" });
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-65px)] items-center justify-center px-4 py-12 bg-muted/20">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-glow">
            <Heart className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLogin ? "Sign in to your HealthHubConnect account" : "Register for HealthHubConnect"}
          </p>
        </div>

        {/* Role Selection */}
        <div className="mb-6 grid grid-cols-4 gap-2">
          {roles.map((role) => (
            <button
              key={role.value}
              onClick={() => { setSelectedRole(role.value); setEmail(""); }}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${selectedRole === role.value
                ? "border-primary bg-accent shadow-card"
                : "border-border bg-card hover:border-primary/30"
                }`}
              id={`role-${role.value}`}
            >
              <role.icon className={`h-5 w-5 ${selectedRole === role.value ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-xs font-medium ${selectedRole === role.value ? "text-primary" : "text-muted-foreground"}`}>
                {role.label}
              </span>
            </button>
          ))}
        </div>

        <Card className="shadow-elevated">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {isLogin ? "Sign In" : "Sign Up"} as {selectedRoleObj?.label}
                </CardTitle>
                <CardDescription>{selectedRoleObj?.desc}</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">{selectedRoleObj?.label}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={selectedRoleObj?.email || "email@example.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="rounded-lg bg-accent p-3 text-sm text-accent-foreground">
                  💡 <strong>Demo Login:</strong>{" "}
                  <button type="button" onClick={prefillDemo} className="text-primary hover:underline font-medium">
                    Click to auto-fill {selectedRoleObj?.label} credentials
                  </button>
                </div>
              )}

              {!isLogin && selectedRole === "patient" && (
                <div className="rounded-lg bg-accent p-3 text-sm text-accent-foreground">
                  🏥 A unique <strong>Health ID (ABHA)</strong> will be generated for you upon registration.
                </div>
              )}

              <Button type="submit" disabled={submitting} className="w-full gradient-primary text-primary-foreground font-semibold" id="btn-login">
                {submitting ? "Please wait…" : isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-primary hover:underline">
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Emergency access note */}
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-emergency/20 bg-emergency/5 p-3">
          <AlertTriangle className="h-4 w-4 text-emergency flex-shrink-0" />
          <p className="text-xs text-emergency">
            Emergency services are available without login.{" "}
            <a href="/emergency" className="font-bold underline">Click here for Emergency SOS</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
