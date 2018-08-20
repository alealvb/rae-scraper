import mongoose, { Schema } from 'mongoose';

const wordSchema = new Schema({
  word: String,
  url: String,
  definitions: [String]
});

const Word = mongoose.model('word', wordSchema);

export default Word;