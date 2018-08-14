class Rae {
  static baseUrl = 'http://dle.rae.es/srv/search';

  constructor(browser) {
    this.browser = browser;
  }

  async search(word) {
    let definitions;
    const page = await this.resolveLink(`${Rae.baseUrl}?w=${word}`);
    const [hasArticle, otherLink] = await page.evaluate(() => {
      return [document.querySelector('article'),
      document.querySelector('#enclave + div a')]
    });
    if (hasArticle) {
      definitions = await page.evaluate(this.scrapeDefinitions);
    } else if (otherLink) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.click('#enclave + div a'),
      ]);
      definitions = await page.evaluate(this.scrapeDefinitions);
    }
    page.close();
    if (definitions) return definitions;
    return 'Error: word not found';
  }

  // visits a url and return
  async resolveLink(url) {
    const page = await this.browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    return page;
  }

  scrapeDefinitions = () => {
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