const { MongoClient } = require('mongodb');
const serverless = require('serverless-http');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let cachedDb = null;
const MONGODB_URI = process.env.MONGODB_URI;

const ObjectId = require('mongodb').ObjectId;


async function connectToDatabase() {
  if (cachedDb) {
    return Promise.resolve(cachedDb);
  }
  const client = await MongoClient.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = client.db('elliotbabyshower');
  cachedDb = db;
  return cachedDb;
}

// Endpoints

app.get('/babyshower/guest/check', async (req, res) => {
  const db = await connectToDatabase();
  const guestCollection = db.collection('guests');
  const guestId = req.query.id;

  try {
    const guest = await guestCollection.findOne({ _id: new ObjectId(guestId) });
    if (guest) {
      res.json({ success: true, guest });
    } else {
      res.json({ success: false, message: 'Guest not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error occurred while checking guest', error });
  }
});

app.post('/babyshower/guest/create', async (req, res) => {
  const db = await connectToDatabase();
  const guestCollection = db.collection('guests');
  const guestData = req.body;

  try {
    const result = await guestCollection.insertOne(guestData);
    res.json({ success: true, message: 'Guest created', guestId: result.insertedId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error occurred while creating guest', error });
  }
});

app.post('/babyshower/gift/create', async (req, res) => {
  const db = await connectToDatabase();
  const giftCollection = db.collection('gifts');
  const giftData = req.body;

  try {
    const result = await giftCollection.insertOne(giftData);
    res.json({ success: true, message: 'Gift created', giftId: result.insertedId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error occurred while creating gift', error });
  }
});

app.put('/babyshower/guest/update', async (req, res) => {
  const db = await connectToDatabase();
  const guestCollection = db.collection('guests');
  const guestData = req.body;
  const guestId = new ObjectId(guestData._id);
  delete guestData._id;

  try {
    await guestCollection.updateOne({ _id: guestId }, { $set: guestData });
    // Agregar los encabezados CORS a la respuesta
    res.setHeader('Access-Control-Allow-Origin', 'https://elliotbabyshower.com');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,PUT');

    res.json({ success: true, message: 'Guest updated' });
  } catch (error) {
    console.log(error);

    // Agregar los encabezados CORS a la respuesta
    res.setHeader('Access-Control-Allow-Origin', 'https://elliotbabyshower.com');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,PUT');

    res.status(500).json({ success: false, message: 'Error occurred while updating guest', error });
  }

});

app.put('/babyshower/gift/update', async (req, res) => {
  const db = await connectToDatabase();
  const giftCollection = db.collection('gifts');
  const giftData = req.body;
  const giftId = new ObjectId(giftData._id);
  delete giftData._id;

  try {
    await giftCollection.updateOne({ _id: giftId }, { $set: giftData });
    res.json({ success: true, message: 'Gift updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error occurred while updating gift', error });
  }
});

app.get('/babyshower/gift/list', async (req, res) => {
  const db = await connectToDatabase();
  const giftCollection = db.collection('gifts');

  try {
    const gifts = await giftCollection.find().toArray();
    res.json({ success: true, gifts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error occurred while retrieving gift list', error });
  }
});

app.get('/babyshower/event/:idEvent', async (req, res) => {
  const db = await connectToDatabase();
  const eventCollection = db.collection('events');
  const eventId = req.params.idEvent;

  try {
    const event = await eventCollection.findOne({ _id: new ObjectId(eventId) });
    if (event) {
      res.json({ success: true, event });
    } else {
      res.json({ success: false, message: 'Event not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error occurred while retrieving event', error });
  }
});

// Export the serverless-http wrapped app
module.exports = {
  app,
  checkGuest: serverless(app),
  createGuest: serverless(app),
  createGift: serverless(app),
  updateGuest: serverless(app),
  updateGift: serverless(app),
  listGifts: serverless(app),
  getEvent: serverless(app),
};

