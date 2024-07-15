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
  scrape: (context: BrowserContext) => void;
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
