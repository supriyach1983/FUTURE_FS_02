// ============================================================
//  Mini CRM - Backend Server (Node.js + Express)
//  File: server.js  |  Run: node server.js
// ============================================================

const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const app = express();
const PORT = 3000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ─── In-Memory Database ──────────────────────────────────────
let db = {
  users: [
    // Default admin account — username: admin, password: admin123
    {
      id: uuidv4(),
      name: "Admin User",
      email: "admin@nexcrm.com",
      password: "admin123",
      createdAt: new Date().toISOString(),
    },
  ],
  contacts: [
    {
      id: uuidv4(),
      name: "Priya Sharma",
      email: "priya@example.com",
      phone: "9876543210",
      company: "Infosys",
      status: "Active",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: "Rahul Mehta",
      email: "rahul@techcorp.in",
      phone: "9123456789",
      company: "TechCorp",
      status: "Lead",
      createdAt: new Date().toISOString(),
    },
  ],
  leads: [
    {
      id: uuidv4(),
      title: "Website Redesign",
      contactName: "Priya Sharma",
      value: 50000,
      stage: "Proposal",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      title: "Mobile App Dev",
      contactName: "Rahul Mehta",
      value: 120000,
      stage: "Negotiation",
      createdAt: new Date().toISOString(),
    },
  ],
  tasks: [
    {
      id: uuidv4(),
      title: "Follow up with Priya",
      dueDate: "2025-08-10",
      priority: "High",
      done: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      title: "Send proposal to Rahul",
      dueDate: "2025-08-12",
      priority: "Medium",
      done: false,
      createdAt: new Date().toISOString(),
    },
  ],
};

// ════════════════════════════════════════════════════════════
//  AUTH API — LOGIN & SIGNUP
// ════════════════════════════════════════════════════════════

// POST /api/auth/signup — Register new user
app.post("/api/auth/signup", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  // Check if email already exists
  const existing = db.users.find((u) => u.email === email);
  if (existing) {
    return res.status(400).json({ success: false, message: "Email already registered! Please login." });
  }

  const newUser = {
    id: uuidv4(),
    name,
    email,
    password, // Note: In real apps, always hash passwords!
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);

  res.status(201).json({
    success: true,
    message: "Account created successfully!",
    user: { id: newUser.id, name: newUser.name, email: newUser.email },
  });
});

// POST /api/auth/login — Login user
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  const user = db.users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ success: false, message: "Wrong email or password!" });
  }

  res.json({
    success: true,
    message: "Login successful!",
    user: { id: user.id, name: user.name, email: user.email },
  });
});

// ════════════════════════════════════════════════════════════
//  CONTACTS API
// ════════════════════════════════════════════════════════════

// GET all contacts
app.get("/api/contacts", (req, res) => {
  res.json({ success: true, data: db.contacts });
});

// GET single contact
app.get("/api/contacts/:id", (req, res) => {
  const contact = db.contacts.find((c) => c.id === req.params.id);
  if (!contact) return res.status(404).json({ success: false, message: "Contact not found" });
  res.json({ success: true, data: contact });
});

// POST create contact
app.post("/api/contacts", (req, res) => {
  const { name, email, phone, company, status } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, message: "Name and Email are required" });
  }
  const newContact = {
    id: uuidv4(),
    name,
    email,
    phone: phone || "",
    company: company || "",
    status: status || "Lead",
    createdAt: new Date().toISOString(),
  };
  db.contacts.push(newContact);
  res.status(201).json({ success: true, data: newContact, message: "Contact created!" });
});

// PUT update contact (includes status update)
app.put("/api/contacts/:id", (req, res) => {
  const index = db.contacts.findIndex((c) => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: "Contact not found" });
  db.contacts[index] = { ...db.contacts[index], ...req.body };
  res.json({ success: true, data: db.contacts[index], message: "Contact updated!" });
});

// PATCH update only status of a contact
app.patch("/api/contacts/:id/status", (req, res) => {
  const { status } = req.body;
  const validStatuses = ["Active", "Inactive", "Lead"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status. Use: Active, Inactive, or Lead" });
  }

  const index = db.contacts.findIndex((c) => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: "Contact not found" });

  db.contacts[index].status = status;
  res.json({ success: true, data: db.contacts[index], message: `Status updated to ${status}!` });
});

// DELETE contact
app.delete("/api/contacts/:id", (req, res) => {
  const index = db.contacts.findIndex((c) => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: "Contact not found" });
  db.contacts.splice(index, 1);
  res.json({ success: true, message: "Contact deleted!" });
});

// ════════════════════════════════════════════════════════════
//  LEADS API
// ════════════════════════════════════════════════════════════

app.get("/api/leads", (req, res) => {
  res.json({ success: true, data: db.leads });
});

app.post("/api/leads", (req, res) => {
  const { title, contactName, value, stage } = req.body;
  if (!title) return res.status(400).json({ success: false, message: "Title is required" });
  const newLead = {
    id: uuidv4(),
    title,
    contactName: contactName || "",
    value: value || 0,
    stage: stage || "New",
    createdAt: new Date().toISOString(),
  };
  db.leads.push(newLead);
  res.status(201).json({ success: true, data: newLead, message: "Lead created!" });
});

app.put("/api/leads/:id", (req, res) => {
  const index = db.leads.findIndex((l) => l.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: "Lead not found" });
  db.leads[index] = { ...db.leads[index], ...req.body };
  res.json({ success: true, data: db.leads[index], message: "Lead updated!" });
});

app.delete("/api/leads/:id", (req, res) => {
  const index = db.leads.findIndex((l) => l.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: "Lead not found" });
  db.leads.splice(index, 1);
  res.json({ success: true, message: "Lead deleted!" });
});

// ════════════════════════════════════════════════════════════
//  TASKS API
// ════════════════════════════════════════════════════════════

app.get("/api/tasks", (req, res) => {
  res.json({ success: true, data: db.tasks });
});

app.post("/api/tasks", (req, res) => {
  const { title, dueDate, priority } = req.body;
  if (!title) return res.status(400).json({ success: false, message: "Title is required" });
  const newTask = {
    id: uuidv4(),
    title,
    dueDate: dueDate || "",
    priority: priority || "Medium",
    done: false,
    createdAt: new Date().toISOString(),
  };
  db.tasks.push(newTask);
  res.status(201).json({ success: true, data: newTask, message: "Task created!" });
});

app.put("/api/tasks/:id", (req, res) => {
  const index = db.tasks.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: "Task not found" });
  db.tasks[index] = { ...db.tasks[index], ...req.body };
  res.json({ success: true, data: db.tasks[index], message: "Task updated!" });
});

app.delete("/api/tasks/:id", (req, res) => {
  const index = db.tasks.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: "Task not found" });
  db.tasks.splice(index, 1);
  res.json({ success: true, message: "Task deleted!" });
});

// ════════════════════════════════════════════════════════════
//  DASHBOARD STATS API
// ════════════════════════════════════════════════════════════

app.get("/api/stats", (req, res) => {
  const totalContacts = db.contacts.length;
  const totalLeads = db.leads.length;
  const totalTasks = db.tasks.length;
  const pendingTasks = db.tasks.filter((t) => !t.done).length;
  const totalValue = db.leads.reduce((sum, l) => sum + Number(l.value), 0);
  const activeContacts = db.contacts.filter((c) => c.status === "Active").length;
  const inactiveContacts = db.contacts.filter((c) => c.status === "Inactive").length;
  const leadContacts = db.contacts.filter((c) => c.status === "Lead").length;

  res.json({
    success: true,
    data: {
      totalContacts,
      totalLeads,
      totalTasks,
      pendingTasks,
      totalValue,
      activeContacts,
      inactiveContacts,
      leadContacts,
    },
  });
});

// ─── Serve frontend ───────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ Mini CRM Server running at http://localhost:${PORT}`);
  console.log(`\n🔐 Default Login:`);
  console.log(`   Email:    admin@nexcrm.com`);
  console.log(`   Password: admin123`);
  console.log(`\nAPI Endpoints:`);
  console.log(`  POST /api/auth/login`);
  console.log(`  POST /api/auth/signup`);
  console.log(`  GET/POST /api/contacts`);
  console.log(`  PATCH /api/contacts/:id/status  ← update status only`);
  console.log(`  GET/POST /api/leads`);
  console.log(`  GET/POST /api/tasks`);
  console.log(`  GET /api/stats\n`);
});