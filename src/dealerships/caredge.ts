import { BrowserContext } from "playwright";
import { Site, Scrapable, Vehicle } from "../models";

class CarEdge extends Site implements Scrapable {
  baseUrl: string;
  constructor({
    id,
    url,
    baseUrl,
  }: {
    id: string;
    baseUrl: string;
    url: string;
  }) {
    super({ id, url });
    this.baseUrl = baseUrl;
  }
  async scrape(context: BrowserContext) {
    await this.scrapePage(context, this.url);
  }

  async scrapePage(context: BrowserContext, url: string) {
    try {
      await context.clearCookies();
      let page = await context.newPage();
      await page.goto(url);
      await page.locator(".listings_cardContainer__SbXnS").waitFor();

      const hits = await page
        .locator(".vehicle-card_vehicleCardContainer___2DV3")
        .all();

      for (const hit of hits) {
        const hitLinkLocator = hit.locator(
          ".vehicle-card_cardDetailsSection__XwUdl > a",
        );
        const attr = await hitLinkLocator.getAttribute("href");
        if (!attr) {
          continue;
        }
        await this.scrapeVehicle(context, `${this.baseUrl}${attr}`);
      }

      // const nextPageLocator = page.getByTestId("pagination-next-link");
      // const nextPageUrl = await nextPageLocator.getAttribute("href");
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
      const pageWaitLocator = page.locator("#ceWideMain");
      await pageWaitLocator.waitFor();

      const infoLocator = page.locator(
        ".vdp-heading_detailsContainer__sFJv1 > h1",
      );
      const info = (await infoLocator.innerText()).split(" ");
      const year = info[0];
      const trim = info[3];
      const driveTrain = info[4];

      const vinParentLocator = page
        .locator(".vdp-heading_vehicleDetails__FNYDL > p")
        .first()
        .filter({ hasText: "VIN:" });

      const vin = await vinParentLocator
        .locator(".vdp-heading_detailValue__Ix4aU")
        .innerText();

      const stockParentLocator = page
        .locator(".vdp-heading_vehicleDetails__FNYDL > p")
        .nth(1)
        .filter({ hasText: "Stock#:" });

      const stock = await stockParentLocator
        .locator(".vdp-heading_detailValue__Ix4aU")
        .innerText();

      const pricingAndCTALocator = page.locator(
        ".vdp-heading_priceAndActionContainer__2r6Dm",
      );
      const priceLocator = pricingAndCTALocator
        .locator(".heading_lineItem__gtuJF > h2")
        .first();
      const price = await priceLocator.innerText();

      const mileageLocator = page
        .locator(".vdp-heading_vehicleDetails__FNYDL > p")
        .nth(2)
        .filter({ hasText: "Mileage:" });
      const mileage = await mileageLocator
        .locator(".vdp-heading_detailValue__Ix4aU")
        .innerText();

      const daysOnMarketLocator = page
        .locator(".vdp-heading_vehicleDetails__FNYDL > p")
        .last()
        .filter({ hasText: "Days on Market:" });
      const daysOnMarketString = await daysOnMarketLocator
        .locator(".vdp-heading_detailValue__Ix4aU")
        .innerText();
      const daysOnMarket = Number.isNaN(Number(daysOnMarketString))
        ? undefined
        : Number(daysOnMarketString);

      this.vehicles.push(
        new Vehicle({
          exteriorColor: "", // TBD
          trim,
          year: Number(year),
          driveTrain,
          cab: "NA", // TBD
          price,
          mileage,
          vin,
          engine: "NA", // TBD
          stock,
          carFax: undefined, // TBD
          daysOnMarket,
        }),
      );
    } catch (err) {
      console.error(err);
    }
  }
}

export default new CarEdge({
  id: "CarEdge",
  baseUrl: "https://my.caredge.com",
  url: "https://my.caredge.com/buy?radius=50&rows=20&zip=92003&make=Toyota&inventoryType=used&model=Tundra&milesRange=-75000&yearRange=2015-2021&sortBy=price&sortOrder=asc&start=0",
});
