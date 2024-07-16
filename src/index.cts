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
    }
    await context.close();
    await browser.close();
    await csv.write("data.csv", inventory);
  } catch (err) {
    console.error(err);
  }
})();
