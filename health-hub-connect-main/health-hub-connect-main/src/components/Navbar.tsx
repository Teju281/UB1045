import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart, Menu, X, Home, Bed, Calendar, Stethoscope,
  AlertTriangle, BarChart3, LogIn, LogOut, FileText, User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/beds", label: "Infrastructure", icon: Bed },
  { path: "/appointments", label: "Appointments", icon: Calendar },
  { path: "/symptom-checker", label: "Symptoms", icon: Stethoscope },
  { path: "/health-records", label: "Health Records", icon: FileText },
  { path: "/staff", label: "Staff Portal", icon: User },
  { path: "/admin", label: "Analytics", icon: BarChart3 },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <Heart className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold font-heading text-foreground hidden sm:block">
            HealthHub<span className="text-primary">Connect</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-0.5 xl:flex">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant={location.pathname === item.path ? "default" : "ghost"}
                size="sm"
                className="gap-1.5 text-xs font-medium"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Button>
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 xl:flex">
          {/* Emergency quick button */}
          <Link to="/emergency">
            <Button size="sm" className="gap-1.5 bg-emergency text-emergency-foreground hover:bg-emergency/90 font-semibold animate-pulse-glow">
              <AlertTriangle className="h-3.5 w-3.5" />
              SOS
            </Button>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{user.name.split(" ")[0]} · {user.role.replace("_", " ")}</Badge>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleLogout}>
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm" className="gap-1.5">
                <LogIn className="h-3.5 w-3.5" />
                Login
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 xl:hidden">
          <Link to="/emergency">
            <Button size="sm" className="gap-1 bg-emergency text-emergency-foreground hover:bg-emergency/90 h-8 px-2 text-xs animate-pulse-glow">
              <AlertTriangle className="h-3.5 w-3.5" />
              SOS
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="border-t border-border bg-card p-4 xl:hidden animate-slide-up">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)}>
                <Button
                  variant={location.pathname === item.path ? "default" : "ghost"}
                  className="w-full justify-start gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
            <div className="mt-2 border-t border-border pt-2">
              {user ? (
                <>
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    Logged in as <strong>{user.name}</strong> ({user.role.replace("_", " ")})
                  </div>
                  <Button variant="ghost" className="w-full justify-start gap-2 text-destructive" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full gap-2">
                    <LogIn className="h-4 w-4" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
