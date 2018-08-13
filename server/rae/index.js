import puppeteer from 'puppeteer';

class Rae {
  static baseUrl = 'http://dle.rae.es/srv/search';

  constructor() {
    puppeteer.launch({ headless: false }).then(browser => this.browser = browser);
  }

  async search(word) {
    const page = await this.browser.newPage();
    await page.goto(`${Rae.baseUrl}?w=${word}`, { waitUntil: 'networkidle2' });
    const definitions = await page.evaluate(() => {
      const defs = document.querySelectorAll('article p');
      return [...defs].map(el => el.innerText);
    });
    page.close();
    return definitions;
  }
}

export default Rae;