import { firefox } from "playwright";
import dealerships from "./dealerships";

(async () => {
  try {
    const browser = await firefox.launch({
      headless: true,
    });
    const context = await browser.newContext();
    if (!browser) {
      console.log("no browser");
      return;
    }
    for (const dealership of dealerships) {
      await dealership.scrape(context);
      for (const vehicle of dealership.vehicles) {
        console.log(
          `\nVehicle:\t${vehicle.year} ${vehicle.trim} ${vehicle.cab} ${vehicle.driveTrain}`,
        );
        console.log(`Price:\t\t${vehicle.price}`);
        console.log(`Miles:\t\t${vehicle.mileage}`);
        console.log(`Carfax:\t\t${vehicle.carFax || "Unknown"}`);
        console.log(`Vin:\t\t${vehicle.vin} (Stock ${vehicle.stock})`);
      }
    }
    await context.close();
    await browser.close();
  } catch (err) {
    console.error(err);
  }
})();
