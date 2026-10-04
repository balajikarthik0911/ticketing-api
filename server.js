const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set");
  process.exit(1);
}

const client = new MongoClient(MONGODB_URI);

let ticketsCollection;

// Allowed values
const priorities = ["LOW", "MEDIUM", "HIGH"];
const statuses = ["OPEN", "IN_PROGRESS", "CLOSED"];
const categories = ["TECHNICAL", "BILLING", "GENERAL"];

// Home / health check
app.get("/", (req, res) => {
  res.json({
    message: "Ticketing API is running!"
  });
});

// Validation
function validateTicket(req, res, next) {
  const { title, description, priority, status, category } = req.body;

  if (!title || typeof title !== "string") {
    return res.status(400).json({
      error: "Title is required"
    });
  }

  if (!description || typeof description !== "string") {
    return res.status(400).json({
      error: "Description is required"
    });
  }

  if (!priorities.includes(priority)) {
    return res.status(400).json({
      error: "Priority must be LOW, MEDIUM, or HIGH"
    });
  }

  if (!statuses.includes(status)) {
    return res.status(400).json({
      error: "Status must be OPEN, IN_PROGRESS, or CLOSED"
    });
  }

  if (!categories.includes(category)) {
    return res.status(400).json({
      error: "Category must be TECHNICAL, BILLING, or GENERAL"
    });
  }

  next();
}

// CREATE ticket
app.post("/api/tickets", validateTicket, async (req, res) => {
  try {
    const ticket = {
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority,
      status: req.body.status,
      category: req.body.category,
      createdAt: new Date()
    };

    const result = await ticketsCollection.insertOne(ticket);

    res.status(201).json({
      id: result.insertedId,
      ...ticket
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to create ticket"
    });
  }
});

// GET all tickets
app.get("/api/tickets", async (req, res) => {
  try {
    const tickets = await ticketsCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json(
      tickets.map(ticket => ({
        ...ticket,
        id: ticket._id
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch tickets"
    });
  }
});

// GET one ticket
app.get("/api/tickets/:id", async (req, res) => {
  try {
    const ticket = await ticketsCollection.findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found"
      });
    }

    res.status(200).json({
      ...ticket,
      id: ticket._id
    });
  } catch (error) {
    res.status(400).json({
      error: "Invalid ticket ID"
    });
  }
});

// UPDATE ticket
app.put("/api/tickets/:id", validateTicket, async (req, res) => {
  try {
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority,
      status: req.body.status,
      category: req.body.category,
      updatedAt: new Date()
    };

    const result = await ticketsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        error: "Ticket not found"
      });
    }

    const updatedTicket = await ticketsCollection.findOne({
      _id: new ObjectId(req.params.id)
    });

    res.status(200).json({
      ...updatedTicket,
      id: updatedTicket._id
    });
  } catch (error) {
    res.status(400).json({
      error: "Invalid ticket ID"
    });
  }
});

// DELETE ticket
app.delete("/api/tickets/:id", async (req, res) => {
  try {
    const result = await ticketsCollection.deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: "Ticket not found"
      });
    }

    res.status(204).send();
  } catch (error) {
    res.status(400).json({
      error: "Invalid ticket ID"
    });
  }
});

// Connect MongoDB and start server
async function startServer() {
  try {
    await client.connect();

    const database = client.db("ticketing");

    ticketsCollection = database.collection("tickets");

    console.log("Connected to MongoDB Atlas");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}

startServer();