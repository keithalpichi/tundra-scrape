import { firefox } from "playwright";
import dealerships from "./dealerships";

(async () => {
  try {
    const browser = await firefox.launch({
      headless: true,
    });
    const context = await browser.newContext();
    for (const dealership of dealerships) {
      await dealership.scrape(context);
      for (const vehicle of dealership.vehicles) {
        console.log(
          `\nVehicle:\t\t\t${vehicle.year} ${vehicle.trim} ${vehicle.cab} ${vehicle.driveTrain}`,
        );
        console.log(`Exterior:\t\t\t${vehicle.exteriorColor}`);
        console.log(`Price:\t\t\t\t${vehicle.price}`);
        console.log(`Miles:\t\t\t\t${vehicle.mileage}`);
        console.log(`Engine:\t\t\t\t${vehicle.engine}`);
        console.log(`Carfax:\t\t\t\t${vehicle.carFax || "Unknown"}`);
        console.log(`Vin:\t\t\t\t${vehicle.vin} (Stock ${vehicle.stock})`);
        console.log(
          `Days on the market:\t\t${vehicle.daysOnMarket || "Unknown"}`,
        );
      }
    }
    await context.close();
    await browser.close();
  } catch (err) {
    console.error(err);
  }
})();
