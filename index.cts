import { firefox, BrowserContext } from "playwright";

type Vehicle = {
  model: "SR" | "SR5";
  year: number;
  driveTrain: "2WD" | "4WD";
  cab: "DC" | "CM";
  price: number;
  mileage: number;
  vin: string;
  carFax?: string;
};

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
      const ids = await page.locator("#vin").all();
      let vin: string;
      let stock: string;
      if (ids.length === 2) {
        vin = await ids[0].innerText();
        stock = await ids[1].innerText();
      }
      const priceLocator = page.locator(".price");
      const price = await priceLocator.innerText();
      console.log(vin, stock, price);
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
