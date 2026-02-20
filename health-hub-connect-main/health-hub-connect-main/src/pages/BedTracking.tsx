import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bed, Search, MapPin, Phone, Building2, Activity,
  Wind, Ambulance, Users, Clock, Filter, ChevronDown, ChevronUp,
} from "lucide-react";
import { hospitals, getBedStatus, getOccupancyPercent, type Hospital } from "@/data/hospitals";

const statusConfig = {
  available: { label: "Available", className: "bg-success text-success-foreground" },
  limited: { label: "Limited", className: "bg-warning text-warning-foreground" },
  full: { label: "Full", className: "bg-destructive text-destructive-foreground" },
};

const BedTracking = () => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = hospitals.filter((h) => {
    const matchSearch =
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.area.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || h.type === filterType;
    const matchStatus = filterStatus === "all" || getBedStatus(h) === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const totalBeds = hospitals.reduce((a, h) => a + h.totalBeds, 0);
  const totalAvail = hospitals.reduce((a, h) => a + h.availableBeds, 0);
  const totalICU = hospitals.reduce((a, h) => a + h.icuBeds, 0);
  const totalICUAvail = hospitals.reduce((a, h) => a + h.icuAvailable, 0);
  const totalO2 = hospitals.reduce((a, h) => a + h.oxygenBeds, 0);
  const totalO2Avail = hospitals.reduce((a, h) => a + h.oxygenAvailable, 0);
  const totalVent = hospitals.reduce((a, h) => a + h.ventilators, 0);
  const totalVentAvail = hospitals.reduce((a, h) => a + h.ventilatorsAvailable, 0);
  const totalAmbu = hospitals.reduce((a, h) => a + h.ambulancesAvailable, 0);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Hospital Infrastructure</h1>
        <p className="mt-1 text-muted-foreground">Live bed, ICU, oxygen, ventilator & ambulance availability across all hospitals</p>
      </div>

      {/* Summary Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Total Beds", avail: totalAvail, total: totalBeds, icon: Bed, color: "text-primary", bg: "bg-primary/10" },
          { label: "ICU Beds", avail: totalICUAvail, total: totalICU, icon: Activity, color: "text-info", bg: "bg-info/10" },
          { label: "Oxygen Beds", avail: totalO2Avail, total: totalO2, icon: Wind, color: "text-success", bg: "bg-success/10" },
          { label: "Ventilators", avail: totalVentAvail, total: totalVent, icon: Wind, color: "text-warning", bg: "bg-warning/10" },
          { label: "Ambulances", avail: totalAmbu, total: null, icon: Ambulance, color: "text-emergency", bg: "bg-emergency/10" },
        ].map((s) => (
          <Card key={s.label} className="shadow-card">
            <CardContent className="p-4">
              <div className={`mb-2 inline-flex rounded-lg ${s.bg} p-2`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="text-2xl font-bold font-heading text-foreground">
                {s.avail}
                {s.total !== null && <span className="text-base font-normal text-muted-foreground">/{s.total}</span>}
              </div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
              {s.total !== null && (
                <Progress value={((s.total - s.avail) / s.total) * 100} className="mt-2 h-1.5" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search hospitals by name or area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            id="bed-search"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-44" id="filter-type">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Government">Government</SelectItem>
            <SelectItem value="Private">Private</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-44" id="filter-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="limited">Limited</SelectItem>
            <SelectItem value="full">Full</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Hospital Cards */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">No hospitals found matching your filters.</div>
        )}
        {filtered.map((hospital) => {
          const status = getBedStatus(hospital);
          const occupancy = getOccupancyPercent(hospital);
          const sc = statusConfig[status];
          const isExpanded = expandedId === hospital.id;
          return (
            <Card key={hospital.id} className="shadow-card transition-all hover:shadow-elevated">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Building2 className="h-4 w-4 text-primary" />
                        {hospital.name}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">{hospital.type}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{hospital.area}</span>
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{hospital.phone}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Updated {new Date(hospital.lastUpdated).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={sc.className}>{sc.label}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => setExpandedId(isExpanded ? null : hospital.id)} className="h-8 w-8">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Bed Occupancy</span>
                    <span className={`font-semibold ${occupancy >= 100 ? "text-destructive" : occupancy >= 85 ? "text-warning" : "text-success"}`}>{occupancy}%</span>
                  </div>
                  <Progress value={occupancy} className="h-2" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-5">
                  {[
                    { label: "General Beds", avail: hospital.availableBeds, total: hospital.totalBeds },
                    { label: "ICU Beds", avail: hospital.icuAvailable, total: hospital.icuBeds },
                    { label: "O₂ Beds", avail: hospital.oxygenAvailable, total: hospital.oxygenBeds },
                    { label: "Ventilators", avail: hospital.ventilatorsAvailable, total: hospital.ventilators },
                    { label: "Ambulances", avail: hospital.ambulancesAvailable, total: null },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-lg p-2 ${item.avail === 0 ? "bg-destructive/10" : "bg-muted"}`}>
                      <div className={`text-lg font-bold ${item.avail === 0 ? "text-destructive" : "text-foreground"}`}>{item.avail}</div>
                      {item.total !== null && <div className="text-[10px] text-muted-foreground">of {item.total}</div>}
                      <div className="text-[10px] text-muted-foreground">{item.label}</div>
                    </div>
                  ))}
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-4 border-t border-border pt-4 animate-slide-up">
                    <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                      <div>
                        <div className="text-muted-foreground text-xs">Doctors on Duty</div>
                        <div className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                          <Users className="h-3 w-3 text-primary" />{hospital.doctorsOnDuty}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Nurses on Duty</div>
                        <div className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                          <Users className="h-3 w-3 text-info" />{hospital.nursesOnDuty}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Address</div>
                        <div className="font-medium text-foreground text-xs mt-0.5">{hospital.address}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Hospital Type</div>
                        <div className="font-semibold text-foreground mt-0.5">{hospital.type}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={`tel:${hospital.phone}`} className="flex-1">
                        <Button className="w-full gap-2 gradient-primary text-primary-foreground" size="sm">
                          <Phone className="h-4 w-4" />
                          Call Hospital
                        </Button>
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BedTracking;
