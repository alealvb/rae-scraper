import express from 'express';
import Rae from './components/rae';

const app = express();
let rae;

app.get('/search', async (req, res) => {
  const results = await rae.search(req.query.word);
  return res.send({ word: req.query.word, results });
});

export default browser => {
  if (!rae) rae = new Rae(browser);
  return app;
};