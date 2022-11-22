const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');


//middle wares
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.zjh2ngr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    const servicesCollection = client.db('doctorsPortal').collection('services');
    const bookingCollection = client.db('doctorsPortal').collection('bookings');
    app.get('/services', async (req, res) => {
      const date = req.query.date;
      console.log(date);
      const query = {};
      const options = await servicesCollection.find(query).toArray();
      const bookingQuery = { appointmentDate: date }
      const alreadyBooked = await bookingCollection.find(bookingQuery).toArray();
      options.forEach(option => {
        const optionBooked = alreadyBooked.filter(book => book.treatmentName === option.name);
        const bookSlots = optionBooked.map(book => book.slot);
        const remainingSlots = option.slots.filter(slot => !bookSlots.includes(slot))
        console.log(date, option.name, remainingSlots.length);
        option.slots = remainingSlots;
      })
      res.send(options);
    });

    app.get('/bookings', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings)
    })



    app.post('/bookings', async (req, res) => {
      const booking = req.body
      console.log(booking);
      const query = {
        appointmentDate: booking.appointmentDate,
        treatmentName: booking.treatmentName,
        // email: booking.email
      };
      const alreadyBooked = await bookingCollection.find(query).toArray();
      if (alreadyBooked.length) {
        const message = `You already have an book on ${booking.appointmentDate}`
        res.send({ acknowledged: false, message })
      }

      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    })

  }
  finally {

  }
}
run().catch(e => console.error(e))

app.get('/', (req, res) => {
  res.send('Doctors portal server is running');
})

app.listen(port, () => {
  console.log(`Doctors portal service on ${port}`)
})
