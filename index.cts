import { firefox, BrowserContext } from "playwright";

type Unknown = "NA";
type Trim = Unknown | "SR" | "SR5";
type DriveTrain = Unknown | "2WD" | "4WD";
type Cab = Unknown | "DC" | "CM";
class Vehicle {
  color: string;
  trim: Trim;
  year: number;
  driveTrain: DriveTrain;
  cab: Cab;
  price: string;
  mileage: string;
  vin: string;
  carFax?: string;
  stock?: string;
  constructor(args: {
    color: string;
    trim: string;
    year: number;
    driveTrain: string;
    cab: string;
    price: string;
    mileage: string;
    vin: string;
    carFax?: string;
    stock?: string;
  }) {
    this.color = args.color.toUpperCase();
    this.trim = this.parseTrim(args.trim);
    this.year = Number(args.year);
    this.driveTrain = this.parseDriveTrain(args.driveTrain);
    this.cab = this.parseCab(args.cab);
    this.price = args.price;
    this.mileage = args.mileage;
    this.vin = args.vin;
    this.carFax = args.carFax;
    this.stock = args.stock;
  }

  parseTrim(trim: string): Trim {
    switch (trim.toUpperCase()) {
      case "SR5":
        return "SR5";
      case "SR":
        return "SR";
      default:
        return "NA";
    }
  }

  parseDriveTrain(driveTrain: string): DriveTrain {
    switch (driveTrain.toUpperCase()) {
      case "2WD":
        return "2WD";
      case "4WD":
        return "4WD";
      default:
        return "NA";
    }
  }

  parseCab(cab: string): Cab {
    switch (cab.toUpperCase()) {
      case "DC":
        return "DC";
      case "CM":
        return "CM";
      default:
        return "NA";
    }
  }
}

interface Scrapable {
  url: string;
  scrape: (context: BrowserContext) => void;
}

class Site {
  id: string;
  url: string;
  vehicles: Vehicle[];
  constructor({ id, url }: { id: string; url: string }) {
    this.id = id;
    this.url = url;
    this.vehicles = [];
  }
}

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

      this.vehicles.push(
        new Vehicle({
          color: "NA", // for now
          trim,
          year: Number(year),
          driveTrain,
          cab,
          price,
          mileage,
          vin,
          carFax: undefined, // for now
          stock: undefined, // for now
        }),
      );
    } catch (err) {
      console.error(err);
    }
  }
}

const sites: Scrapable[] = [
  new TVToyotaSite({
    id: "TVToyota",
    url: "https://www.tvtoyota.com/used-vehicles/?_dFR%5Bmake%5D%5B0%5D=Toyota&_dFR%5Bmodel%5D%5B0%5D=Tundra&_dFR%5Btype%5D%5B0%5D=Used&_dFR%5Btype%5D%5B1%5D=Certified%2520Used&_dFR%5Byear%5D%5B0%5D=2017&_dFR%5Byear%5D%5B1%5D=2018&_dFR%5Byear%5D%5B2%5D=2021",
  }),
];

(async () => {
  try {
    const browser = await firefox.launch({
      headless: true,
      // logger: {
      //   isEnabled: () => true,
      //   log: (name, severity, message, args) =>
      //     console.log(`${name} ${message}`),
      // },
    });
    const context = await browser.newContext();
    if (!browser) {
      console.log("no browser");
      return;
    }
    for (const site of sites) {
      await site.scrape(context);
    }
    await context.close();
    await browser.close();
  } catch (err) {
    console.error(err);
  }
})();
