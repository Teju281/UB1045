import { db, collections } from './firebase';
import bcrypt from 'bcryptjs';

// User functions
export const createUser = async (userData: any) => {
  const userRef = db.collection(collections.users);
  const passwordHash = await bcrypt.hash(userData.password, 12);
  
  const newUser = {
    ...userData,
    password_hash: passwordHash,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  delete newUser.password;
  const docRef = await userRef.add(newUser);
  return { id: docRef.id, ...newUser };
};

export const getUserByEmail = async (email: string) => {
  const snapshot = await db.collection(collections.users)
    .where('email', '==', email)
    .limit(1)
    .get();
  
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

// Hospital functions
export const createHospital = async (hospitalData: any) => {
  const hospitalRef = db.collection(collections.hospitals);
  const newHospital = {
    ...hospitalData,
    created_at: new Date().toISOString()
  };
  
  const docRef = await hospitalRef.add(newHospital);
  return { id: docRef.id, ...newHospital };
};

export const getAllHospitals = async () => {
  const snapshot = await db.collection(collections.hospitals).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getHospitalsByCity = async (city: string) => {
  const snapshot = await db.collection(collections.hospitals)
    .where('city', '==', city)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Doctor functions
export const createDoctor = async (doctorData: any) => {
  const doctorRef = db.collection(collections.doctors);
  const newDoctor = {
    ...doctorData,
    created_at: new Date().toISOString()
  };
  
  const docRef = await doctorRef.add(newDoctor);
  return { id: docRef.id, ...newDoctor };
};

export const getDoctorsByHospital = async (hospitalId: string) => {
  const snapshot = await db.collection(collections.doctors)
    .where('hospital_id', '==', hospitalId)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getAllDoctors = async () => {
  const snapshot = await db.collection(collections.doctors).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Patient functions
export const createPatient = async (patientData: any) => {
  const patientRef = db.collection(collections.patients);
  const newPatient = {
    ...patientData,
    created_at: new Date().toISOString()
  };
  
  const docRef = await patientRef.add(newPatient);
  return { id: docRef.id, ...newPatient };
};

// Bed functions
export const createBedRecord = async (bedData: any) => {
  const bedRef = db.collection(collections.beds);
  const newBed = {
    ...bedData,
    updated_at: new Date().toISOString()
  };
  
  const docRef = await bedRef.add(newBed);
  return { id: docRef.id, ...newBed };
};

export const getBedsByHospital = async (hospitalId: string) => {
  const snapshot = await db.collection(collections.beds)
    .where('hospital_id', '==', hospitalId)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Appointment functions
export const createAppointment = async (appointmentData: any) => {
  const appointmentRef = db.collection(collections.appointments);
  const newAppointment = {
    ...appointmentData,
    created_at: new Date().toISOString()
  };
  
  const docRef = await appointmentRef.add(newAppointment);
  return { id: docRef.id, ...newAppointment };
};

// Medical Record functions
export const createMedicalRecord = async (recordData: any) => {
  const recordRef = db.collection(collections.medicalRecords);
  const newRecord = {
    ...recordData,
    created_at: new Date().toISOString()
  };
  
  const docRef = await recordRef.add(newRecord);
  return { id: docRef.id, ...newRecord };
};

// Emergency SOS functions
export const createSOSAlert = async (sosData: any) => {
  const sosRef = db.collection(collections.emergencySOS);
  const newSOS = {
    ...sosData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const docRef = await sosRef.add(newSOS);
  return { id: docRef.id, ...newSOS };
};

// Initialize Firebase with Davangere hospital data
export const initializeFirebaseDatabase = async () => {
  console.log('🔥 Initializing Firebase database with Davangere hospitals...');
  
  // Check if data already exists
  const existingHospitals = await getAllHospitals();
  if (existingHospitals.length > 0) {
    console.log('✅ Firebase database already initialized');
    return;
  }
  
  // Davangere Hospitals
  const davangereHospitals = [
    {
      name: "Bapuji Institute of Engineering and Technology Hospital",
      address: "Bapuji Campus, Davanagere",
      city: "Davanagere",
      district: "Davanagere",
      state: "Karnataka",
      phone: "+91-8192-220234",
      type: "Teaching Hospital",
      latitude: 14.4646,
      longitude: 75.9218,
      total_beds: 500,
      emergency_available: true,
      rating: 4.2
    },
    {
      name: "JJM Medical College Hospital",
      address: "JJM Campus, Davanagere",
      city: "Davanagere",
      district: "Davanagere",
      state: "Karnataka",
      phone: "+91-8192-220435",
      type: "Teaching Hospital",
      latitude: 14.4646,
      longitude: 75.9218,
      total_beds: 750,
      emergency_available: true,
      rating: 4.3
    },
    {
      name: "District Hospital Davanagere",
      address: "PB Road, Davanagere",
      city: "Davanagere",
      district: "Davanagere",
      state: "Karnataka",
      phone: "+91-8192-228012",
      type: "Government",
      latitude: 14.4646,
      longitude: 75.9218,
      total_beds: 300,
      emergency_available: true,
      rating: 3.8
    },
    {
      name: "Chigateri General Hospital",
      address: "Chigateri, Davanagere",
      city: "Davanagere",
      district: "Davanagere",
      state: "Karnataka",
      phone: "+91-8192-226789",
      type: "Government",
      latitude: 14.4646,
      longitude: 75.9218,
      total_beds: 200,
      emergency_available: true,
      rating: 3.7
    },
    {
      name: "Sri Devi Hospital",
      address: "Santhebennur Road, Davanagere",
      city: "Davanagere",
      district: "Davanagere",
      state: "Karnataka",
      phone: "+91-8192-234567",
      type: "Private",
      latitude: 14.4646,
      longitude: 75.9218,
      total_beds: 150,
      emergency_available: true,
      rating: 4.1
    }
  ];
  
  // Create hospitals
  const hospitalIds = [];
  for (const hospital of davangereHospitals) {
    const created = await createHospital(hospital);
    hospitalIds.push(created.id);
    console.log(`🏥 Created hospital: ${hospital.name}`);
  }
  
  // Create demo users
  const password = "demo1234";
  const demoUsers = [
    { name: "Ravi Kumar", email: "patient@davangere.com", role: "patient" },
    { name: "Dr. Suresh Patil", email: "doctor@davangere.com", role: "doctor", hospital_id: hospitalIds[0] },
    { name: "Staff Nurse", email: "staff@davangere.com", role: "hospital_staff", hospital_id: hospitalIds[0] },
    { name: "Admin Davangere", email: "admin@davangere.com", role: "admin" }
  ];
  
  for (const user of demoUsers) {
    await createUser({ ...user, password });
    console.log(`👤 Created user: ${user.name}`);
  }
  
  // Create doctors for each hospital
  const specializations = ["Cardiology", "General Medicine", "Pediatrics", "Orthopedics", "Gynecology"];
  let doctorIndex = 0;
  
  for (const hospitalId of hospitalIds) {
    for (const spec of specializations) {
      await createDoctor({
        hospital_id: hospitalId,
        name: `Dr. ${spec} Specialist ${doctorIndex + 1}`,
        specialization: spec,
        qualification: "MD, DNB",
        experience_years: Math.floor(Math.random() * 20) + 5,
        phone: `+91-98450${1000 + doctorIndex}`,
        email: `doctor${doctorIndex}@davangere.com`,
        available_days: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri"]),
        consultation_fee: 500 + Math.floor(Math.random() * 1000),
        rating: 3.5 + Math.random() * 1.5
      });
      doctorIndex++;
    }
  }
  
  // Create bed records for each hospital
  const wards = ["General", "ICU", "Emergency", "Pediatric", "Maternity"];
  for (const hospitalId of hospitalIds) {
    for (const ward of wards) {
      const total = ward === "ICU" ? 20 : ward === "Emergency" ? 15 : 50;
      const available = Math.floor(total * 0.3);
      const occupied = Math.floor(total * 0.6);
      const underMaintenance = total - available - occupied;
      
      await createBedRecord({
        hospital_id: hospitalId,
        ward,
        total,
        available,
        occupied,
        under_maintenance
      });
    }
  }
  
  console.log('✅ Firebase database initialized with Davangere hospitals!');
  console.log('📧 Demo accounts (password: demo1234):');
  console.log('   patient@davangere.com | doctor@davangere.com | staff@davangere.com | admin@davangere.com');
};
