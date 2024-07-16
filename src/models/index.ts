import { BrowserContext } from "playwright";

export class Dealership {
  name: string;
  phone: string;
  location: string;
  url: string;
  constructor(args: {
    phone: string;
    name: string;
    location: string;
    url: string;
  }) {
    this.name = args.name;
    this.phone = args.phone;
    this.location = args.location.trim();
    this.url = args.url;
  }
}

type Unknown = "NA";
type Trim = Unknown | "SR" | "SR5";
type DriveTrain = Unknown | "2WD" | "4WD";
type Cab = Unknown | "DC" | "CM";
export class Vehicle {
  dateFound?: Date;
  exteriorColor: string;
  trim: Trim;
  year: number;
  driveTrain: DriveTrain;
  cab: Cab;
  price: string;
  mileage: string;
  vin: string;
  engine: string;
  carFax?: string;
  stock?: string;
  daysOnMarket?: number;
  dealership: Dealership;
  url: string;
  constructor(args: {
    exteriorColor: string;
    trim: string;
    year: number;
    driveTrain: string;
    cab: string;
    price: string;
    mileage: string;
    vin: string;
    engine: string;
    carFax?: string;
    stock?: string;
    daysOnMarket?: number;
    dealership: Dealership;
    url: string;
    dateFound?: Date;
  }) {
    this.exteriorColor = args.exteriorColor.toUpperCase();
    this.trim = this.parseTrim(args.trim);
    this.year = Number(args.year);
    this.driveTrain = this.parseDriveTrain(args.driveTrain);
    this.cab = this.parseCab(args.cab);
    this.price = args.price;
    this.mileage = args.mileage;
    this.vin = args.vin;
    this.engine = args.engine;
    this.dealership = args.dealership;
    this.carFax = args.carFax;
    this.stock = args.stock;
    this.daysOnMarket = args.daysOnMarket;
    this.url = args.url;
    this.dateFound = args.dateFound;
  }

  parseTrim(trim: string): Trim {
    switch (trim.toUpperCase()) {
      case "SR5":
        return "SR5";
      case "SR":
        return "SR";
      default:
        return "NA";
    }
  }

  parseDriveTrain(driveTrain: string): DriveTrain {
    switch (driveTrain.toUpperCase()) {
      case "FWD":
      case "RWD":
      case "4x2":
      case "2WD":
        return "2WD";
      case "4X4":
      case "4WD":
        return "4WD";
      default:
        return "NA";
    }
  }

  parseCab(cab: string): Cab {
    switch (cab.toUpperCase()) {
      case "DOUBLECAB":
      case "DC":
        return "DC";
      case "CREWMAX":
      case "CM":
        return "CM";
      default:
        return "NA";
    }
  }
}

export interface Scrapable {
  vehicles: Vehicle[];
  url: string;
  scrape: (context: BrowserContext, inventory: Inventory) => void;
}

export class Site {
  id: string;
  url: string;
  baseUrl?: string;
  vehicles: Vehicle[];
  dealership?: Dealership;
  constructor({
    id,
    url,
    baseUrl,
    dealership,
  }: {
    id: string;
    url: string;
    baseUrl?: string;
    dealership?: Dealership;
  }) {
    this.id = id;
    this.url = url;
    this.baseUrl = baseUrl;
    this.vehicles = [];
    this.dealership = dealership;
  }
}

export class Inventory {
  vehiclesByVIN: { [key: Vehicle["vin"]]: Vehicle } = {};
  vehiclesByURL: { [key: Vehicle["url"]]: Vehicle } = {};
  count: number = 0;

  addMany(vehicles: Vehicle[]) {
    vehicles.forEach((vehicle) => this.add(vehicle));
  }

  add(vehicle: Vehicle) {
    let count = 0;
    if (!this.vehiclesByURL.hasOwnProperty(vehicle.url)) {
      this.vehiclesByURL[vehicle.url] = vehicle;
      count = 1;
    }
    if (!this.vehiclesByVIN.hasOwnProperty(vehicle.vin)) {
      this.vehiclesByVIN[vehicle.vin] = vehicle;
      count = 1;
    }
    this.count += count;
  }

  has(vehicle: Vehicle): boolean {
    if (this.vehiclesByURL.hasOwnProperty(vehicle.url)) {
      return true;
    }
    if (this.vehiclesByVIN.hasOwnProperty(vehicle.vin)) {
      return true;
    }
    return false;
  }

  hasVehicleByVIN(vin: Vehicle["vin"]): boolean {
    if (this.vehiclesByVIN.hasOwnProperty(vin)) {
      return true;
    }
    return false;
  }

  hasVehicleByURL(url: Vehicle["url"]): boolean {
    if (this.vehiclesByURL.hasOwnProperty(url)) {
      return true;
    }
    return false;
  }
}
