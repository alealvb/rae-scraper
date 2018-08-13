import express from 'express';
import Rae from './rae';

const app = express();
const rae = new Rae;

app.get('/search', async (req, res) => {
  const results = await rae.search(req.query.word);
  return res.send({ word: req.query.word, results });
});

export default app;