import Word from '../../models/word';

class Rae {
  static baseUrl = 'http://dle.rae.es/srv/search';
  static linkSelector = '#enclave + div a';

  constructor(browser) {
    this.browser = browser;
  }

  async saveWord(word, definitions, url) {
    const wordExists = await Word.findOne({ word });
    if (wordExists) return wordExists;
    const newWord = await Word.create({ word, definitions, url });
    console.log(`word "${word}" created with ${definitions.length} definitions`);
    return newWord;
  }

  async search(word) {
    const wordExists = await Word.findOne({word});
    if (wordExists) return wordExists.definitions;
    const page = await this.resolveLink(`${Rae.baseUrl}?w=${word}`);
    const [hasArticle, otherLink] = await Promise.all([page.$('article'), page.$(Rae.linkSelector)]);
    let definitions = [];
    if (hasArticle) {
      definitions = await page.evaluate(this.scrapeDefinitions);
    } else if (otherLink) {
      const links = await this.getPageLinks(page);
      for (const link of links) {
        const linkPage = await this.resolveLink(link);
        const linkWords = await this.getPageWords(linkPage);
        if (linkWords.includes(word)) {
          const linkDefinitions = await linkPage.evaluate(this.scrapeDefinitions);
          definitions = [...definitions, ...linkDefinitions];
        } else {
          try {
            await this.search(linkWords[0]);
          } catch (error) {
            console.log(err)
          }
        }
        // linkPage.close();
      }
    }
    // await page.close();
    if (definitions.length) {
      this.saveWord(word, definitions, page.url())
        .catch(err => console.log(err));
    }
    if (definitions) return definitions;
    return 'Error: word not found';
  }

  async getPageWords(page) {
    let words = await page.evaluate(() => {
      const header = document.querySelector('header.f');
      const sup = header.querySelector('sup');
      if (sup) header.removeChild(sup);
      return header.innerText.split(',');
    });
    const word = words[0];
    words = words.map(text => text.trim() === word ? word : this.mergeWord(word, text.trim()));
    return words;
  }

  mergeWord(word, ending) {
    const result = `${word.slice(0, word.length - ending.length)}${ending}`;
    return result
  }

  async getPageLinks(page) {
    const linkElements = await page.$$(Rae.linkSelector);
    const links = [];
    for (const linkElement of linkElements) {
      const href = await (await linkElement.getProperty('href')).jsonValue();
      links.push(href);
    }
    return links;
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
    return defs.filter(el => el.querySelector('abbr')).map(el => el.innerText);
  }
}

export default Rae;