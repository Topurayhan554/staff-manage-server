const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 3000;

// middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster5656.l9idbez.mongodb.net/?appName=Cluster5656`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("staff_manage");

    const noticeCollection = db.collection("notices");

    // notice api
    app.get("/notices", async (req, res) => {
      const query = {};

      const cursor = noticeCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/notices", async (req, res) => {
      const notice = req.body;
      notice.status = "Unpublished";
      const result = await noticeCollection.insertOne(notice);
      res.send(result);
    });

    // Toggle notice status
    app.patch("/notices/:id/toggle-status", async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };

        // Get current notice
        const notice = await noticeCollection.findOne(filter);

        if (!notice) {
          return res.status(404).send({ message: "Notice not found" });
        }

        // Toggle status
        const newStatus =
          notice.status === "Published" ? "Unpublished" : "Published";

        const updateDoc = {
          $set: {
            status: newStatus,
            updatedAt: new Date(),
          },
        };

        const result = await noticeCollection.updateOne(filter, updateDoc);
        res.send({
          success: true,
          newStatus: newStatus,
          result,
        });
      } catch (error) {
        res
          .status(500)
          .send({ message: "Error toggling status", error: error.message });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("app is running");
});

app.listen(port, () => {
  console.log(`Example app listening on the port ${port}`);
});
