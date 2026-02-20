export type HospitalType = "Government" | "Private";
export type BedStatus = "available" | "limited" | "full";

export interface Hospital {
    id: number;
    name: string;
    type: HospitalType;
    address: string;
    area: string;
    phone: string;
    lat: number;
    lng: number;
    totalBeds: number;
    availableBeds: number;
    icuBeds: number;
    icuAvailable: number;
    oxygenBeds: number;
    oxygenAvailable: number;
    ventilators: number;
    ventilatorsAvailable: number;
    doctorsOnDuty: number;
    nursesOnDuty: number;
    ambulancesAvailable: number;
    lastUpdated: string;
}

export const hospitals: Hospital[] = [
    {
        id: 1,
        name: "CG Hospital",
        type: "Government",
        address: "12, Shamanur Road, Davanagere - 577001",
        area: "Gundi Circle",
        phone: "+91 98765 43210",
        lat: 14.4663,
        lng: 75.9239,
        totalBeds: 200,
        availableBeds: 58,
        icuBeds: 30,
        icuAvailable: 8,
        oxygenBeds: 50,
        oxygenAvailable: 22,
        ventilators: 15,
        ventilatorsAvailable: 5,
        doctorsOnDuty: 12,
        nursesOnDuty: 28,
        ambulancesAvailable: 4,
        lastUpdated: "2026-02-20T20:45:00+05:30",
    },
    {
        id: 2,
        name: "City Central Hospital",
        type: "Private",
        address: "Davanagere,UBDT Road - 500771",
        area: "UBDT Road",
        phone: "+91 98765 43211",
        lat: 14.4700,
        lng: 75.9180,
        totalBeds: 350,
        availableBeds: 40,
        icuBeds: 60,
        icuAvailable: 6,
        oxygenBeds: 80,
        oxygenAvailable: 12,
        ventilators: 25,
        ventilatorsAvailable: 3,
        doctorsOnDuty: 22,
        nursesOnDuty: 45,
        ambulancesAvailable: 6,
        lastUpdated: "2026-02-20T20:50:00+05:30",
    },
    {
        id: 3,
        name: "SS Hospital",
        type: "Private",
        address: "Ramanagara,Harihara Road,Davanagere - 500082",
        area: "Davanagere ",
        phone: "+91 98765 43212",
        lat: 14.4631,
        lng: 75.9317,
        totalBeds: 500,
        availableBeds: 0,
        icuBeds: 80,
        icuAvailable: 0,
        oxygenBeds: 120,
        oxygenAvailable: 0,
        ventilators: 30,
        ventilatorsAvailable: 0,
        doctorsOnDuty: 35,
        nursesOnDuty: 60,
        ambulancesAvailable: 2,
        lastUpdated: "2026-02-20T20:40:00+05:30",
    },
    {
        id: 4,
        name: "Bapuji Dental College and Hospital",
        type: "Private",
        address: "Bapuji Dental College and Hospital, Davanagere - 500082",
        area: "Davanagere",
        phone: "+91 98765 43213",
        lat: 14.4682,
        lng: 75.9256,
        totalBeds: 180,
        availableBeds: 82,
        icuBeds: 25,
        icuAvailable: 14,
        oxygenBeds: 40,
        oxygenAvailable: 30,
        ventilators: 12,
        ventilatorsAvailable: 8,
        doctorsOnDuty: 15,
        nursesOnDuty: 32,
        ambulancesAvailable: 5,
        lastUpdated: "2026-02-20T20:55:00+05:30",
    },
    {
        id: 5,
        name: "Ramakrishna Hospital",
        type: "Private",
        address: "Davanagere,Police Station Road - 577001",
        area: "Davanagere",
        phone: "+91 98765 43214",
        lat: 14.4590,
        lng: 75.9201,
        totalBeds: 260,
        availableBeds: 13,
        icuBeds: 40,
        icuAvailable: 2,
        oxygenBeds: 60,
        oxygenAvailable: 5,
        ventilators: 18,
        ventilatorsAvailable: 1,
        doctorsOnDuty: 18,
        nursesOnDuty: 38,
        ambulancesAvailable: 3,
        lastUpdated: "2026-02-20T20:35:00+05:30",
    },
    {
        id: 6,
        name: "Srushti Speciality",
        type: "Private",
        address: "Davanagere,Harihara Road - 577001",
        area: "Davanagere",
        phone: "+91 98765 43215",
        lat: 14.4720,
        lng: 75.9165,
        totalBeds: 300,
        availableBeds: 165,
        icuBeds: 55,
        icuAvailable: 28,
        oxygenBeds: 70,
        oxygenAvailable: 45,
        ventilators: 22,
        ventilatorsAvailable: 14,
        doctorsOnDuty: 20,
        nursesOnDuty: 50,
        ambulancesAvailable: 7,
        lastUpdated: "2026-02-20T20:58:00+05:30",
    },
    {
        id: 7,
        name: "Nanjappa Hospital",
        type: "Government",
        address: "Hadadi Road,Davanagere- 500012",
        area: "Davanagere",
        phone: "+91 98765 43216",
        lat: 14.4756,
        lng: 75.9288,
        totalBeds: 1000,
        availableBeds: 120,
        icuBeds: 100,
        icuAvailable: 15,
        oxygenBeds: 200,
        oxygenAvailable: 55,
        ventilators: 40,
        ventilatorsAvailable: 8,
        doctorsOnDuty: 50,
        nursesOnDuty: 110,
        ambulancesAvailable: 10,
        lastUpdated: "2026-02-20T20:30:00+05:30",
    },
    {
        id: 8,
        name: "Care Hospitals",
        type: "Private",
        address: "RTO Road Davanagere- 577001",
        area: "Davanagere",
        phone: "+91 98765 43217",
        lat: 14.4641,
        lng: 75.9210,
        totalBeds: 220,
        availableBeds: 35,
        icuBeds: 35,
        icuAvailable: 7,
        oxygenBeds: 55,
        oxygenAvailable: 18,
        ventilators: 16,
        ventilatorsAvailable: 4,
        doctorsOnDuty: 16,
        nursesOnDuty: 36,
        ambulancesAvailable: 4,
        lastUpdated: "2026-02-20T20:52:00+05:30",
    },
];

export function getOccupancyPercent(hospital: Hospital): number {
    return Math.round(((hospital.totalBeds - hospital.availableBeds) / hospital.totalBeds) * 100);
}

export function getBedStatus(hospital: Hospital): BedStatus {
    const pct = getOccupancyPercent(hospital);
    if (pct >= 100) return "full";
    if (pct >= 85) return "limited";
    return "available";
}

export function getDistanceKm(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}
