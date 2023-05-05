const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mktyzg7.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// JWT Verify
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}

async function run(){
    try{
        await client.connect();
        const itemsCollection = client.db('street-smartz').collection('items');
        const userCollection = client.db('street-smartz').collection('users');

        // create inventory
        app.post('/inventory', async (req, res)=>{
          const addItem = req.body;
          const result = await itemsCollection.insertOne(addItem);
          res.send(result);
      });

        // get inventory
        app.get('/inventory',async(req,res)=>{
            const query = {};
            const cursor = itemsCollection.find(query);
            const items = await cursor.toArray();
            res.send(items);
        });

        // get single inventory
        app.get('/inventory/:id', async(req, res) =>{
          const id = req.params.id;
          const query = {_id: ObjectId(id)};
          const result = await itemsCollection.findOne(query);
          res.send(result);
      });

      // update inventory
      app.put('/inventory/:id', async(req, res) =>{
        const id = req.params.id;
        const updateItem = req.body;
        const filter = {_id: ObjectId(id)};
        const options = { upsert: true};
        const updateDoc = {
            $set: {
              name: updateItem.name,
              img: updateItem.img,
              details: updateItem.details,
              price: updateItem.price,
              quantity: updateItem.quantity,
              supplier: updateItem.supplier,
              brand: updateItem.brand,
              mileage: updateItem.mileage
            }
        };
        const result = await itemsCollection.updateOne(filter, updateDoc, options);
        res.send(result);
    });

    // delete inventory
    app.delete('/inventory/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const result = await itemsCollection.deleteOne(query);
      res.send(result);
    });

    // inventory collection api
    app.get('/my-inventory/', async(req, res)=>{
      const email = req.query.email;
      const query = {email: email};
      const cursor = itemsCollection.find(query);
      const items = await cursor.toArray();
      res.send(items);
    });

    // users
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1000000h' })
      res.send({ result, token });
    })

    }
    finally{

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello from backend')
})

app.listen(port, () => {
  console.log(`Street smartz listening on port ${port}`)
})