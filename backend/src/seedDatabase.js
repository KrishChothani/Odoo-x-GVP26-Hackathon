import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./Models/user.model.js";
import { Vehicle } from "./Models/vehicle.model.js";
import { Trip } from "./Models/trip.model.js";
import { Cargo } from "./Models/cargo.model.js";

dotenv.config();

// Sample data
const vehicles = [
  {
    name: "FreightLiner Cascadia",
    model: "2022",
    licensePlate: "TRK-001-MH",
    vehicleType: "TRUCK",
    maxLoadCapacity: 20000,
    odometer: 45000,
    status: "ON_TRIP",
    region: "Mumbai",
    fuelEfficiency: 6.5,
    acquisitionCost: 4500000,
    insuranceExpiry: new Date("2026-12-31"),
    lastMaintenanceDate: new Date("2026-01-15"),
    nextMaintenanceDate: new Date("2026-04-15"),
  },
  {
    name: "Tata Prima",
    model: "2023",
    licensePlate: "TRK-002-DL",
    vehicleType: "TRUCK",
    maxLoadCapacity: 18000,
    odometer: 32000,
    status: "ON_TRIP",
    region: "Delhi",
    fuelEfficiency: 7.2,
    acquisitionCost: 3800000,
    insuranceExpiry: new Date("2026-11-30"),
    lastMaintenanceDate: new Date("2026-02-01"),
    nextMaintenanceDate: new Date("2026-05-01"),
  },
  {
    name: "Ashok Leyland",
    model: "2021",
    licensePlate: "TRK-003-KA",
    vehicleType: "TRUCK",
    maxLoadCapacity: 15000,
    odometer: 78000,
    status: "IN_SHOP",
    region: "Bangalore",
    fuelEfficiency: 6.8,
    acquisitionCost: 3200000,
    insuranceExpiry: new Date("2026-10-31"),
    lastMaintenanceDate: new Date("2026-02-18"),
    nextMaintenanceDate: new Date("2026-03-01"),
  },
  {
    name: "Mahindra Bolero",
    model: "2023",
    licensePlate: "VAN-004-MH",
    vehicleType: "VAN",
    maxLoadCapacity: 1500,
    odometer: 12000,
    status: "AVAILABLE",
    region: "Pune",
    fuelEfficiency: 12.0,
    acquisitionCost: 1200000,
    insuranceExpiry: new Date("2027-01-31"),
    lastMaintenanceDate: new Date("2026-01-10"),
    nextMaintenanceDate: new Date("2026-04-10"),
  },
  {
    name: "Eicher Pro 2049",
    model: "2022",
    licensePlate: "TRK-005-GJ",
    vehicleType: "TRUCK",
    maxLoadCapacity: 16000,
    odometer: 54000,
    status: "ON_TRIP",
    region: "Ahmedabad",
    fuelEfficiency: 7.5,
    acquisitionCost: 3500000,
    insuranceExpiry: new Date("2026-09-30"),
    lastMaintenanceDate: new Date("2026-01-20"),
    nextMaintenanceDate: new Date("2026-04-20"),
  },
  {
    name: "Hero Splendor",
    model: "2023",
    licensePlate: "BK-006-MH",
    vehicleType: "BIKE",
    maxLoadCapacity: 150,
    odometer: 8000,
    status: "AVAILABLE",
    region: "Mumbai",
    fuelEfficiency: 60.0,
    acquisitionCost: 85000,
    insuranceExpiry: new Date("2027-02-28"),
    lastMaintenanceDate: new Date("2026-02-01"),
    nextMaintenanceDate: new Date("2026-08-01"),
  },
  {
    name: "BharatBenz 1617R",
    model: "2023",
    licensePlate: "TRK-007-TN",
    vehicleType: "TRUCK",
    maxLoadCapacity: 17000,
    odometer: 28000,
    status: "IN_SHOP",
    region: "Chennai",
    fuelEfficiency: 6.9,
    acquisitionCost: 3900000,
    insuranceExpiry: new Date("2027-03-31"),
    lastMaintenanceDate: new Date("2026-02-15"),
    nextMaintenanceDate: new Date("2026-03-15"),
  },
  {
    name: "Maruti Eeco",
    model: "2022",
    licensePlate: "VAN-008-RJ",
    vehicleType: "VAN",
    maxLoadCapacity: 500,
    odometer: 35000,
    status: "ON_TRIP",
    region: "Jaipur",
    fuelEfficiency: 18.0,
    acquisitionCost: 600000,
    insuranceExpiry: new Date("2026-08-31"),
    lastMaintenanceDate: new Date("2026-01-25"),
    nextMaintenanceDate: new Date("2026-04-25"),
  },
];

const cargos = [
  {
    description: "Electronics - Mobile Phones",
    weight: 2500,
    volume: 15,
    status: "PENDING",
    priority: "HIGH",
    origin: {
      address: "Electronics Hub, Nehru Place, New Delhi",
      contactName: "Rajesh Kumar",
      contactPhone: "+91-9876543210",
    },
    destination: {
      address: "Tech Store, MG Road, Bangalore",
      contactName: "Priya Sharma",
      contactPhone: "+91-9876543211",
    },
    pickupDate: new Date("2026-02-22"),
    deliveryDate: new Date("2026-02-24"),
    specialInstructions: "Handle with care, fragile items",
    isFragile: true,
    requiresRefrigeration: false,
    customerName: "TechMart India",
    customerPhone: "+91-9876543212",
    customerEmail: "orders@techmart.in",
    estimatedValue: 15000000,
  },
  {
    description: "Pharmaceutical Supplies",
    weight: 3000,
    volume: 20,
    status: "PENDING",
    priority: "URGENT",
    origin: {
      address: "Medical Warehouse, Andheri, Mumbai",
      contactName: "Dr. Amit Patel",
      contactPhone: "+91-9876543213",
    },
    destination: {
      address: "City Hospital, Park Street, Kolkata",
      contactName: "Dr. Sunita Roy",
      contactPhone: "+91-9876543214",
    },
    pickupDate: new Date("2026-02-21"),
    deliveryDate: new Date("2026-02-22"),
    specialInstructions: "Temperature controlled, urgent delivery",
    isFragile: false,
    requiresRefrigeration: true,
    customerName: "MediCare Pharma",
    customerPhone: "+91-9876543215",
    customerEmail: "logistics@medicare.in",
    estimatedValue: 5000000,
  },
  {
    description: "Textile Products - Garments",
    weight: 5000,
    volume: 40,
    status: "PENDING",
    priority: "MEDIUM",
    origin: {
      address: "Textile Market, Ludhiana, Punjab",
      contactName: "Harpreet Singh",
      contactPhone: "+91-9876543216",
    },
    destination: {
      address: "Fashion Retail, Commercial Street, Bangalore",
      contactName: "Meera Nair",
      contactPhone: "+91-9876543217",
    },
    pickupDate: new Date("2026-02-23"),
    deliveryDate: new Date("2026-02-25"),
    specialInstructions: "Keep dry",
    isFragile: false,
    requiresRefrigeration: false,
    customerName: "Fashion Hub Ltd",
    customerPhone: "+91-9876543218",
    customerEmail: "supply@fashionhub.in",
    estimatedValue: 2500000,
  },
];

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await Vehicle.deleteMany({});
    await Trip.deleteMany({});
    await Cargo.deleteMany({});
    console.log("✅ Existing data cleared");

    // Find a fleet manager user to assign as creator
    let manager = await User.findOne({ role: "FLEET_MANAGER" });
    let driver = await User.findOne({ role: "DRIVER" });

    if (!manager) {
      console.log("⚠️  No fleet manager found. Please create a fleet manager account first.");
      console.log("💡 Creating a test fleet manager account...");
      
      // Create a test fleet manager
      manager = await User.create({
        name: "Test Fleet Manager",
        email: "manager@fleetflow.com",
        phone: "+91-9999999999",
        passwordHash: "$2a$10$YourHashedPasswordHere", // This won't work for login, just for system operations
        role: "FLEET_MANAGER",
        isActive: true,
        isVerified: true,
      });
      console.log("✅ Test fleet manager created");
    }

    if (!driver) {
      console.log("💡 Creating test driver accounts...");
      
      const drivers = await User.insertMany([
        {
          name: "Ramesh Kumar",
          email: "ramesh@fleetflow.com",
          phone: "+91-8888888881",
          passwordHash: "$2a$10$YourHashedPasswordHere",
          role: "DRIVER",
          isActive: true,
          isVerified: true,
        },
        {
          name: "Suresh Patel",
          email: "suresh@fleetflow.com",
          phone: "+91-8888888882",
          passwordHash: "$2a$10$YourHashedPasswordHere",
          role: "DRIVER",
          isActive: true,
          isVerified: true,
        },
        {
          name: "Vijay Singh",
          email: "vijay@fleetflow.com",
          phone: "+91-8888888883",
          passwordHash: "$2a$10$YourHashedPasswordHere",
          role: "DRIVER",
          isActive: true,
          isVerified: true,
        },
      ]);
      driver = drivers[0];
      console.log(`✅ Created ${drivers.length} test drivers`);
    }

    // Insert vehicles
    console.log("🚛 Creating vehicles...");
    const createdVehicles = await Vehicle.insertMany(vehicles);
    console.log(`✅ Created ${createdVehicles.length} vehicles`);

    // Insert cargo (one by one to trigger pre-save hook for cargoNumber)
    console.log("📦 Creating cargo...");
    const createdCargos = [];
    for (let i = 0; i < cargos.length; i++) {
      const cargo = await Cargo.create({
        ...cargos[i],
        createdBy: manager._id,
      });
      createdCargos.push(cargo);
    }
    console.log(`✅ Created ${createdCargos.length} cargo items`);

    // Get all drivers
    const allDrivers = await User.find({ role: "DRIVER" });

    // Create trips for vehicles that are ON_TRIP (one by one to trigger pre-save hook)
    console.log("🚀 Creating trips...");
    const createdTrips = [];
    
    for (let i = 0; i < createdVehicles.length; i++) {
      const vehicle = createdVehicles[i];
      
      if (vehicle.status === "ON_TRIP") {
        const assignedDriver = allDrivers[i % allDrivers.length];
        
        const trip = await Trip.create({
          vehicle: vehicle._id,
          driver: assignedDriver._id,
          cargo: i < createdCargos.length ? createdCargos[i]._id : null,
          status: "DISPATCHED",
          origin: {
            address: i === 0 ? "Warehouse, Andheri, Mumbai" : 
                     i === 1 ? "Distribution Center, Connaught Place, Delhi" :
                     i === 2 ? "Logistics Hub, Whitefield, Bangalore" :
                     "Supply Center, Satellite, Ahmedabad",
            coordinates: { latitude: 19.1136, longitude: 72.8697 },
          },
          destination: {
            address: i === 0 ? "Retail Store, Bandra, Mumbai" :
                     i === 1 ? "Shopping Complex, Karol Bagh, Delhi" :
                     i === 2 ? "Office Park, Koramangala, Bangalore" :
                     "Commercial Area, CG Road, Ahmedabad",
            coordinates: { latitude: 19.0596, longitude: 72.8295 },
          },
          cargoWeight: Math.floor(Math.random() * 5000) + 1000,
          distance: Math.floor(Math.random() * 500) + 50,
          estimatedDuration: Math.floor(Math.random() * 8) + 2,
          scheduledStartTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          actualStartTime: new Date(Date.now() - 20 * 60 * 60 * 1000),
          fuelConsumed: Math.floor(Math.random() * 100) + 20,
          fuelCost: Math.floor(Math.random() * 5000) + 1000,
          revenue: Math.floor(Math.random() * 50000) + 10000,
          notes: "Standard delivery route",
          createdBy: manager._id,
        });
        
        createdTrips.push(trip);
        
        // Update vehicle to reference the trip
        vehicle.currentTrip = trip._id;
        vehicle.assignedDriver = assignedDriver._id;
      }
    }
    
    console.log(`✅ Created ${createdTrips.length} trips`);

    // Update vehicles with trip references
    for (let i = 0; i < createdTrips.length; i++) {
      const trip = createdTrips[i];
      await Vehicle.findByIdAndUpdate(trip.vehicle, {
        currentTrip: trip._id,
        assignedDriver: trip.driver,
      });
    }

    // Update cargo status for assigned ones
    for (let i = 0; i < createdTrips.length; i++) {
      const trip = createdTrips[i];
      if (trip.cargo) {
        await Cargo.findByIdAndUpdate(trip.cargo, {
          status: "IN_TRANSIT",
          assignedTrip: trip._id,
        });
      }
    }

    console.log("\n✨ Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   Vehicles: ${createdVehicles.length}`);
    console.log(`   - ON_TRIP: ${createdVehicles.filter(v => v.status === "ON_TRIP").length}`);
    console.log(`   - IN_SHOP: ${createdVehicles.filter(v => v.status === "IN_SHOP").length}`);
    console.log(`   - AVAILABLE: ${createdVehicles.filter(v => v.status === "AVAILABLE").length}`);
    console.log(`   Trips: ${createdTrips.length}`);
    console.log(`   Cargo: ${createdCargos.length}`);
    const pendingCargoCount = await Cargo.countDocuments({ status: "PENDING" });
    const inTransitCargoCount = await Cargo.countDocuments({ status: "IN_TRANSIT" });
    console.log(`   - PENDING: ${pendingCargoCount}`);
    console.log(`   - IN_TRANSIT: ${inTransitCargoCount}`);
    console.log("\n🎉 Your dashboard should now display data!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
