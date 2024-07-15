import { BrowserContext } from "playwright";
import { Site, Scrapable, Vehicle } from "../models";

class TVToyotaSite extends Site implements Scrapable {
  constructor({ id, url }: { id: string; url: string }) {
    super({ id, url });
  }
  async scrape(context: BrowserContext) {
    try {
      await context.clearCookies();
      let page = await context.newPage();
      await page.goto(this.url);
      await page.locator("#hits").waitFor();

      const hits = await page.locator(".hit").all();

      for (const hit of hits) {
        const hitLocator = hit.locator(".hit-link");
        const numHits = await hitLocator.count();
        const hasHitLink = numHits > 0;
        if (!hasHitLink) {
          continue;
        }
        const hitLinkLocator = hitLocator.first();
        const attr = await hitLinkLocator.getAttribute("href");
        if (!attr) {
          continue;
        }
        await this.scrapeVehicle(context, attr);
      }
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
      const pageWaitLocator = page.locator("#whitewrap");
      await pageWaitLocator.waitFor();

      const infoLocator = page.locator(".vdp-title__vehicle-info > h1");
      const info = (await infoLocator.innerText())
        .replace(/^(GOLD|SILVER)/, "")
        .split(" ")
        .filter((word) => word.length > 0);
      const year = info[0];
      const trim = info[3];
      const driveTrain = info[4];
      const cab = info[5];

      const ids = await page.locator("#vin").all();
      let vin: string = "";
      let stock: string = "";
      if (ids.length === 2) {
        vin = await ids[0].innerText();
        stock = await ids[1].innerText();
      }
      const priceLocator = page.locator(".price");
      const price = await priceLocator.innerText();

      const mileageLocator = page
        .locator(".basic-info-item")
        .filter({ hasText: "Mileage:" });
      const mileage = await mileageLocator
        .locator(".basic-info-item__value")
        .innerText();

      const exteriorColorLocator = page
        .locator(".basic-info-item")
        .filter({ hasText: "Exterior:" });
      const exteriorColor = await exteriorColorLocator
        .locator(".basic-info-item__value")
        .innerText();

      const carFaxLocator = page.locator(".vdp-history-report__logo");
      const carFaxUrl = await carFaxLocator
        .getByRole("link")
        .getAttribute("href");

      this.vehicles.push(
        new Vehicle({
          exteriorColor,
          trim,
          year: Number(year),
          driveTrain,
          cab,
          price,
          mileage,
          vin,
          stock,
          carFax: carFaxUrl || undefined,
        }),
      );
    } catch (err) {
      console.error(err);
    }
  }
}

export default new TVToyotaSite({
  id: "TVToyota",
  url: "https://www.tvtoyota.com/used-vehicles/?_dFR%5Bmake%5D%5B0%5D=Toyota&_dFR%5Bmodel%5D%5B0%5D=Tundra&_dFR%5Btype%5D%5B0%5D=Used&_dFR%5Btype%5D%5B1%5D=Certified%2520Used&_dFR%5Byear%5D%5B0%5D=2017&_dFR%5Byear%5D%5B1%5D=2018&_dFR%5Byear%5D%5B2%5D=2021",
});
