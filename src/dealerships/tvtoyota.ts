import { BrowserContext } from "playwright";
import { Site, Scrapable, Vehicle, Dealership } from "../models";

class TVToyotaSite extends Site implements Scrapable {
  constructor(args: { id: string; url: string; dealership: Dealership }) {
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

      const nextPageLocator = page.getByTestId("pagination-next-link");
      const nextPageUrl = await nextPageLocator.getAttribute("href");
      if (!nextPageUrl || nextPageUrl.length === 0 || nextPageUrl === "#") {
        return;
      }
      await this.scrapePage(context, nextPageUrl);
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

      const engineLocator = page
        .locator(".basic-info-item")
        .filter({ hasText: "Engine:" });
      const engine = await engineLocator
        .locator(".basic-info-item__value")
        .innerText();

      const carFaxLocator = page.locator(".vdp-history-report__logo");
      const carFaxUrl = await carFaxLocator
        .getByRole("link")
        .getAttribute("href");

      this.vehicles.push(
        new Vehicle({
          url,
          exteriorColor,
          trim,
          year: Number(year),
          driveTrain,
          cab,
          price,
          mileage,
          vin,
          engine,
          stock,
          carFax: carFaxUrl || undefined,
          dealership: this.dealership!,
        }),
      );
    } catch (err) {
      console.error(err);
    }
  }
}

export default new TVToyotaSite({
  id: "TVToyota",
  url: "https://www.tvtoyota.com/used-vehicles/?_dFR[make][0]=Toyota&_dFR[model][0]=Tundra&_dFR[type][0]=Used&_dFR[type][1]=Certified%2520Used&_dFR[year][0]=2016&_dFR[year][1]=2017&_dFR[year][2]=2018&_dFR[year][3]=2019&_dFR[year][4]=2020&_dFR[year][5]=2021",
  dealership: new Dealership({
    name: "TVToyota",
    phone: "(951) 319-7911",
    location: "26631 Ynez Road, Temecula, CA 92591",
    url: "https://www.tvtoyota.com",
  }),
});
