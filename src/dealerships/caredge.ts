import { BrowserContext, Page } from "playwright";
import { Site, Scrapable, Vehicle, Dealership, Inventory } from "../models";

class CarEdge extends Site implements Scrapable {
  page: number = 1;
  constructor(args: { id: string; baseUrl: string; url: string }) {
    super(args);
  }
  async scrape(context: BrowserContext, inventory: Inventory) {
    await context.clearCookies();
    let page = await context.newPage();
    await page.goto(this.url);
    await this.scrapePage(context, page, inventory);
    inventory.addMany(this.vehicles);
  }

  async scrapePage(context: BrowserContext, page: Page, inventory: Inventory) {
    try {
      await context.clearCookies();
      const welcomeModalLocator = page.getByText("Got it! Take me to listings");
      if ((await welcomeModalLocator.count()) === 1) {
        welcomeModalLocator.click();
      }
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
        await this.scrapeVehicle(context, `${this.baseUrl}${attr}`, inventory);
      }

      const paginationLocator = page.getByTestId("pagination");
      const pageLinkLocator = paginationLocator
        .locator("a")
        .filter({ hasText: String(this.page + 1) });
      const foundNextPage = (await pageLinkLocator.count()) === 1;
      if (!foundNextPage) {
        return;
      }
      this.page += 1;
      await pageLinkLocator.click();
      await page.waitForLoadState();
      await this.scrapePage(context, page, inventory);
    } catch (err) {
      console.error(err);
    }
  }

  async scrapeVehicle(
    context: BrowserContext,
    url: string,
    inventory: Inventory,
  ) {
    try {
      await context.clearCookies();
      let page = await context.newPage();
      await page.goto(url, { waitUntil: "load" });
      const pageWaitLocator = page.locator("#ceWideMain");
      await pageWaitLocator.waitFor();

      const vinParentLocator = page
        .locator(".vdp-heading_vehicleDetails__FNYDL > p")
        .first()
        .filter({ hasText: "VIN:" });

      const vin = await vinParentLocator
        .locator(".vdp-heading_detailValue__Ix4aU")
        .innerText();

      if (inventory.hasVehicleByVIN(vin)) {
        // console.log(`Vehicle with VIN ${vin} has already been scraped`);
        return;
      }
      console.log(`New vehicle with VIN ${vin} found`);

      const infoLocator = page.locator(
        ".vdp-heading_detailsContainer__sFJv1 > h1",
      );
      const info = (await infoLocator.innerText()).split(" ");
      const year = info[0];
      const trim = info[3];
      const driveTrain = info[4];

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

      const dealershipLocator = page.locator(
        ".seller-details_sellerContactInfo__QA4Aq",
      );
      const dealershipNameLocator = dealershipLocator.locator(
        "#vdpSellerDetailsUrl",
      );
      const dealershipUrl =
        (await dealershipNameLocator.getAttribute("href")) || "Unknown";
      const dealershipName = await dealershipNameLocator
        .getByRole("paragraph")
        .innerText();
      const dealershipLocation = await dealershipLocator
        .locator("p:nth-child(2)")
        .innerText();
      const dealershipPhone = await dealershipLocator
        .locator("p:nth-child(3)")
        .innerText();

      const exteriorColorLocator = page
        .locator("#overview-and-features")
        .getByRole("listitem")
        .filter({ hasText: "Exterior:" });
      const exteriorColorParts = (await exteriorColorLocator.innerText()).split(
        ":",
      );
      const exteriorColor =
        exteriorColorParts[exteriorColorParts.length - 1].trim();

      const dealership = new Dealership({
        name: dealershipName,
        location: dealershipLocation,
        url: dealershipUrl,
        phone: dealershipPhone,
      });

      this.vehicles.push(
        new Vehicle({
          url,
          exteriorColor,
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
          dealership,
          dateFound: new Date(),
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
