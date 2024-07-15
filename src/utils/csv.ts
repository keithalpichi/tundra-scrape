import { stat } from "fs/promises";
import * as csv from "fast-csv";
import { Inventory, Vehicle, Dealership } from "../models";

export default class CSV {
  // async read(path: string): Promise<Inventory> {
  //   const inventory = new Inventory();
  //   try {
  //     const fileStats = await stat(path);
  //     if (fileStats.isFile()) {
  //       return new Promise((res, rej) => {
  //         csv
  //           .parseFile(path)
  //           .on("error", (error) => {
  //             rej(error);
  //           })
  //           .on("data", (row) => {
  //             // TODO
  //           })
  //           .on("end", () => {
  //             res(inventory);
  //           });
  //       });
  //     }
  //   } catch (err) {
  //     return Promise.reject(err);
  //   }
  //   return inventory;
  // }
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
      "vin",
      "stock",
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
        String(vehicle.daysOnMarket) || "NA",
        vehicle.price,
        vehicle.url,
        vehicle.dealership.name,
        vehicle.dealership.location,
        vehicle.vin,
        vehicle.stock || "NA",
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
