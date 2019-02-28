import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost/rae-api', { useNewUrlParser: true });

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', console.log.bind(console, 'connected to mongodb'));

export default db;