const express = require("express");

const app = express();
app.use(express.json());
app.get("/", (req, res) => {
  res.json({
    message: "Ticketing API is running!"
  });
});

let tickets = [];
let nextId = 1;

// Allowed values
const priorities = ["LOW", "MEDIUM", "HIGH"];
const statuses = ["OPEN", "IN_PROGRESS", "CLOSED"];
const categories = ["TECHNICAL", "BILLING", "GENERAL"];

// Validation
function validateTicket(req, res, next) {
  const { title, description, priority, status, category } = req.body;

  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "Title is required" });
  }

  if (!description || typeof description !== "string") {
    return res.status(400).json({ error: "Description is required" });
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

// POST /api/tickets
app.post("/api/tickets", validateTicket, (req, res) => {
  const ticket = {
    id: nextId++,
    title: req.body.title,
    description: req.body.description,
    priority: req.body.priority,
    status: req.body.status,
    category: req.body.category
  };

  tickets.push(ticket);

  res.status(201).json(ticket);
});

// GET /api/tickets
app.get("/api/tickets", (req, res) => {
  res.status(200).json(tickets);
});

// GET /api/tickets/:id
app.get("/api/tickets/:id", (req, res) => {
  const id = Number(req.params.id);

  const ticket = tickets.find(t => t.id === id);

  if (!ticket) {
    return res.status(404).json({
      error: "Ticket not found"
    });
  }

  res.status(200).json(ticket);
});

// PUT /api/tickets/:id
app.put("/api/tickets/:id", validateTicket, (req, res) => {
  const id = Number(req.params.id);

  const ticket = tickets.find(t => t.id === id);

  if (!ticket) {
    return res.status(404).json({
      error: "Ticket not found"
    });
  }

  ticket.title = req.body.title;
  ticket.description = req.body.description;
  ticket.priority = req.body.priority;
  ticket.status = req.body.status;
  ticket.category = req.body.category;

  res.status(200).json(ticket);
});

// DELETE /api/tickets/:id
app.delete("/api/tickets/:id", (req, res) => {
  const id = Number(req.params.id);

  const index = tickets.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: "Ticket not found"
    });
  }

  tickets.splice(index, 1);

  res.status(204).send();
});

// Start server
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});