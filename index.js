const express = require('express');
const cors = require('cors');
require('dotenv').config();
const multer  = require('multer')
const bodyParser = require('body-parser');
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
const app = express();
const port = process.env.PORT || 8000;


app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads')
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now();
        const name = uniqueSuffix + '-' + file.originalname;
        cb(null, name);
        req.body.file_name = name;
    }
})
const upload = multer({ storage: storage })
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster.9zce0xe.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const eventCollection = client.db("dtJobTask").collection("events");

        app.get('/api/v3/app/events', async (req, res) => {
            const id = req?.query?.id;
            const type = req?.query?.type;
            const limit = req?.query?.limit ? parseInt(req?.query?.limit) : 0;
            const page = req?.query?.page ? parseInt(req?.query?.page) : 0;
            if(id){
                const query = {_id: new ObjectId(id)}
                const result = await eventCollection.findOne(query);
                return res.send(result);
            }else {
                const sortBy = type === "latest" ? -1 : 1;
                console.log(sortBy);
                const result = await eventCollection.find().sort({ createdAt: sortBy }).limit(limit).toArray();
                return res.send(result);
            }
        })

        app.post('/api/v3/app/events', upload.single('img'), async (req, res) => {
            req.body.createdAt = Date.now();
            const data = req.body;
            const result = await eventCollection.insertOne(data);
            console.log(data);
            res.send(result);
        })

        app.put('/api/v3/app/events/:id', upload.single('img'),  async (req, res) => {
            const data = req.body;
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)}
            const updateData = {
                $set: {
                    name: data.name,
                    type: data.type,
                    attendees: data.attendees,
                    file_name: data.file_name,
                    tagline: data.tagline,
                    schedule_date: data.schedule_date,
                    schedule_time: data.schedule_time,
                    moderator: data.moderator,
                    category: data.category,
                    sub_category: data.sub_category,
                    rigor_rank: data.rigor_rank,
                    description: data.description,
                },
            };
            const result = await eventCollection.updateOne(filter, updateData);
            res.send(result);
        })

        app.delete('/api/v3/app/events/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await eventCollection.deleteOne(query);
            res.send(result);
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('server is ok for use');
})

app.listen(port, () => {
    console.log('server is ok')
})