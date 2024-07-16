import { firefox } from "playwright";
import dealerships from "./dealerships";
import { Inventory } from "./models";
import CSV from "./utils/csv";

(async () => {
  try {
    const csv = new CSV();
    const inventory = await csv.read("data.csv");
    const browser = await firefox.launch({
      headless: true,
    });
    const context = await browser.newContext();
    for (const dealership of dealerships) {
      await dealership.scrape(context, inventory);
      // for (const vehicle of dealership.vehicles) {
      //   inventory.add(vehicle);
      // console.log(
      //   `\nVehicle:\t\t\t${vehicle.year} ${vehicle.trim} ${vehicle.cab} ${vehicle.driveTrain}`,
      // );
      // console.log(`Exterior:\t\t\t${vehicle.exteriorColor}`);
      // console.log(`Price:\t\t\t\t${vehicle.price}`);
      // console.log(`Miles:\t\t\t\t${vehicle.mileage}`);
      // console.log(`Engine:\t\t\t\t${vehicle.engine}`);
      // console.log(`Carfax:\t\t\t\t${vehicle.carFax || "Unknown"}`);
      // console.log(`Vin:\t\t\t\t${vehicle.vin} (Stock ${vehicle.stock})`);
      // console.log(
      //   `Days on the market:\t\t${vehicle.daysOnMarket || "Unknown"}`,
      // );
      // console.log(
      //   `Dealership:\t\t\t${vehicle.dealership.name}, ${vehicle.dealership.location}. ${vehicle.dealership.url} (${vehicle.dealership.phone})`,
      // );
      // }
    }
    // console.log(`Found ${inventory.count} vehicles`);
    await context.close();
    await browser.close();
    await csv.write("data.csv", inventory);
  } catch (err) {
    console.error(err);
  }
})();
