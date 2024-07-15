import { BrowserContext } from "playwright";
import { Site, Scrapable, Vehicle, Dealership } from "../models";

class ToyotaSite extends Site implements Scrapable {
  constructor(args: { id: string; baseUrl: string; url: string }) {
    super(args);
  }
  async scrape(context: BrowserContext) {
    await this.scrapePage(context, this.url);
  }

  async scrapePage(context: BrowserContext, url: string) {
    try {
      await context.clearCookies();
      let page = await context.newPage();
      await page.goto(url);
      await page.locator(".styles_totalResults__IxCM-").waitFor();

      const hitLocators = await page.locator(".styles_cta__FQ8cp").all();

      for (const hit of hitLocators) {
        const vehicleUrl = await hit.getAttribute("href");
        if (!vehicleUrl) {
          continue;
        }
        await this.scrapeVehicle(context, `${this.baseUrl}${vehicleUrl}`);
      }

      // const nextPageLocator = page.getByTestId("pagination-next-link");
      // const nextPageUrl = awaikt nextPageLocator.getAttribute("href");
      // if (!nextPageUrl || nextPageUrl.length === 0 || nextPageUrl === "#") {
      //   return;
      // }
      // await this.scrapePage(context, nextPageUrl);
    } catch (err) {
      console.error(err);
    }
  }

  async scrapeVehicle(context: BrowserContext, url: string) {
    try {
      console.log(`Scraping vehicle data from ${url}`);
      await context.clearCookies();
      let page = await context.newPage();
      await page.goto(url, { waitUntil: "load" });
      const pageWaitLocator = page.locator("#vehicleDetails");
      await pageWaitLocator.waitFor();

      const infoLocator = page.locator(
        ".styles_vehicleDescription__+xD6y > h3",
      );
      const info = (await infoLocator.innerText()).split(" ");
      const year = info[0];
      const trim = info[2];
      const driveTrain = info[info.length - 1];

      const mileageLocator = page.locator(
        ".styles_vehicleDescription__+xD6y > div > span",
      );
      const mileage = (await mileageLocator.innerText()).replace(" mi", "");

      const priceLocator = page.locator(".styles_price__zRedZ");
      const price = await priceLocator.innerText();

      const vinLocator = page.locator(".styles_vdpLink__O8qoB");
      const vin = (await vinLocator.innerText()).replace("VIN", "");

      // const carFaxLocator = page.locator('.carfax')

      this.vehicles.push(
        new Vehicle({
          url,
          exteriorColor: "", // TBD
          trim,
          year: Number(year),
          driveTrain,
          cab: "NA", // TBD
          price,
          mileage,
          vin,
          engine: "NA", // TBD
          stock: "NA", // TBD
          carFax: undefined, // TBD
          dealership: new Dealership({
            name: "N/A",
            url: "N/A",
            phone: "N/A",
            location: "N/A",
          }), // TBD
        }),
      );
    } catch (err) {
      console.error(err);
    }
  }
}

export default new ToyotaSite({
  id: "Toyota",
  baseUrl: "https://www.toyotacertified.com",
  url: "https://www.toyotacertified.com/inventory?zipCode=92003&radius=50&sort=-listdate&model=tundra&priceMax=40000&yearMin=2016&yearMax=2021",
});
