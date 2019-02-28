const stream = require('stream');
const { StringDecoder } = require('string_decoder');
const path = require('path');
const fs = require('fs');

class FileReader {
  static defaultOptions = {
    encoding: 'utf8',
    skipEmptyLines: false
  }

  lines = []; 
  lineFragment = '';
  paused = false;
  end = false;
  ended = false;

  constructor(filePath, inputOptions = {}) {
    const options = { ...FileReader.defaultOptions, ...inputOptions };
    this.encoding = options.encoding;
    this.configFile(filePath, options);
    this.skipEmptyLines = options.skipEmptyLines;
    this.decoder = new StringDecoder(this.encoding);
  }

  configFile(filePath, options) {
    if (filePath instanceof stream.Readable) {
      this.readStream = filePath;
    } else {
      this.filePath = path.normalize(filePath);
      const { encoding, start, end } = options;
      this.streamOptions = { encoding, start, end };
    }
  }

  async initStream() {
    const readStream = this.readStream || fs.createReadStream(this.filePath, this.streamOptions);
    readStream.on('error', err => console.log(err));
    readStream.on('open', () => this.ready = true);
    readStream.on('data', data => {
      readStream.pause();
      let dataAsString = data;
      if (data instanceof Buffer) {
        dataAsString = this.decoder.write(data);
      }
      this.lines = this.lines.concat(dataAsString.split(/(?:\n|\r\n|\r)/g));
      this.lines[0] = this.lineFragment + this.lines[0];
      this.lineFragment = this.lines.pop() || '';
    });
    readStream.on('end', () => {
      this.end = true;
    });
    this.readStream = readStream;
    return await this.waitForOpenFile();
  }

  async waitForOpenFile() {
    while(!this.ready) await this.sleep(1000);
    return;
  }

  async* getLines() {
    await this.initStream();
    while (!this.ended) {
      if (this.lines.length === 0) {
        if (this.end) {
          if (this.lineFragment) {
            const fragment = this.lineFragment;
            this.lineFragment = '';
            yield fragment;
          }
          if (!this.paused) this.ended = true;
        } else {
          this.readStream.resume();
          await this.sleep();
        }
      } else {
        const line = this.lines.shift();
        if (!this.skipEmptyLines || this.length > 0) {
          yield line;
        }
      }
    }
  }

  sleep = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

  close() {
    this.readStream.destroy();
    this.end = true;
    this.lines = [];
  }
}

export default FileReader;
