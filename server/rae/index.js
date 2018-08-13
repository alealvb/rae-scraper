class Rae {
  static baseUrl = 'http://dle.rae.es/srv/search';

  constructor(browser) {
    this.browser = browser;
  }

  async search(word) {
    const page = await this.browser.newPage();
    await page.goto(`${Rae.baseUrl}?w=${word}&m=30`, { waitUntil: 'networkidle2' });
    const definitions = await page.evaluate(this.scrape);
    page.close();
    return definitions;
  }

  scrape = () => {
    const defs = [...document.querySelectorAll('article p')];
    defs.forEach(p => {
      p.querySelectorAll('abbr').forEach(abbr => {
        abbr.innerText = `(${abbr.title})`
      });
      const index = p.querySelector('.n_acep');
      if (index) index.remove();
    });
    return defs.map(el => el.innerText);
  }
}

export default Rae;