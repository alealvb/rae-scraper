import path from 'path';
import Rae from '../components/rae';
import puppeteer from 'puppeteer'
import FileReader from '../components/file_reader';
import wordsFile from './words.txt';

const sleep = async (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));


async function* browserFactory() {
  const browserLimit = 2;
  let browsers = [];
  while (true) {
    browsers = browsers.filter(brows => brows.process().signalCode === null)
    if (browsers.length >= browserLimit) {
      await sleep();
    } else {
      const newBrowser = await puppeteer.launch({
        // headless: false
      });
      browsers.push(newBrowser);
      yield newBrowser;
    }
  }
}


export async function loadWords() {
  const browsers = browserFactory();

  const fileReader = new FileReader(path.resolve(__dirname, wordsFile));

  for await (const line of fileReader.getLines()) {
    const word = line.trim();
    const { value: browser } = await browsers.next();
    const rae = new Rae(browser);
    rae.search(word).catch( error => {
      console.log(error.message)
      console.log(`Warning: word ${word} could not be found`);
    }).then( () => browser.close())
  }
  console.log('Done seeding words');
}