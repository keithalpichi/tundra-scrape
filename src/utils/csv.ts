import { existsSync } from "fs";
import * as csv from "fast-csv";
import { Inventory, Vehicle, Dealership } from "../models";

export default class CSV {
  static readonly headerIndices = {
    year: 0,
    trim: 1,
    cab: 2,
    driveTrain: 3,
    exteriorColor: 4,
    mileage: 5,
    daysOnMarket: 6,
    price: 7,
    url: 8,
    dealership: 9,
    location: 10,
    phone: 11,
    vin: 12,
    stock: 13,
    dateFound: 14,
  };
  async read(path: string): Promise<Inventory> {
    return new Promise(async (res, rej) => {
      const inventory = new Inventory();
      try {
        const fileExists = existsSync(path);
        if (!fileExists) {
          return res(inventory);
        }
        csv
          .parseFile(path)
          .on("error", (error) => {
            rej(error);
          })
          .on("data", (row) => {
            const dealership = new Dealership({
              name: row[CSV.headerIndices.dealership],
              phone: row[CSV.headerIndices.phone],
              location: row[CSV.headerIndices.location],
              url: "NA",
            });
            const dateFound =
              new Date(row[CSV.headerIndices.dateFound]).toString() ===
              "Invalid Date"
                ? undefined
                : new Date(row[CSV.headerIndices.dateFound]);
            const vehicle = new Vehicle({
              exteriorColor: row[CSV.headerIndices.exteriorColor],
              trim: row[CSV.headerIndices.trim],
              year: Number(row[CSV.headerIndices.year]),
              driveTrain: row[CSV.headerIndices.driveTrain],
              cab: row[CSV.headerIndices.cab],
              price: row[CSV.headerIndices.price],
              mileage: row[CSV.headerIndices.mileage],
              vin: row[CSV.headerIndices.vin],
              daysOnMarket: Number.isNaN(
                Number(row[CSV.headerIndices.daysOnMarket]),
              )
                ? undefined
                : Number(row[CSV.headerIndices.daysOnMarket]),
              dealership,
              url: row[CSV.headerIndices.url],
              stock: row[CSV.headerIndices.stock],
              engine: "NA",
              dateFound,
            });
            inventory.add(vehicle);
          })
          .on("end", () => {
            res(inventory);
          });
      } catch (err) {
        if (err.type) return Promise.reject(err);
      }
    });
  }
  write(path: string, inventory: Inventory): Promise<void> {
    const header = [
      "year",
      "trim",
      "cab",
      "driveTrain",
      "color",
      "mileage",
      "daysOnMarket",
      "price",
      "url",
      "dealership",
      "location",
      "phone",
      "vin",
      "stock",
      "dateFound",
    ];
    const rows = [header];
    for (const vin in inventory.vehiclesByVIN) {
      const vehicle = inventory.vehiclesByVIN[vin];
      rows.push([
        String(vehicle.year),
        vehicle.trim,
        vehicle.cab,
        vehicle.driveTrain,
        vehicle.exteriorColor,
        vehicle.mileage,
        vehicle.daysOnMarket ? String(vehicle.daysOnMarket) : "",
        vehicle.price,
        vehicle.url,
        vehicle.dealership.name,
        vehicle.dealership.location,
        vehicle.dealership.phone,
        vehicle.vin,
        vehicle.stock || "NA",
        vehicle.dateFound ? vehicle.dateFound.toUTCString() : "",
      ]);
    }
    return new Promise((res, rej) => {
      csv
        .writeToPath(path, rows)
        .on("error", (error) => {
          rej(error);
          throw error;
        })
        .on("finish", () => {
          res();
        });
    });
  }
}
