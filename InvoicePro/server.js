import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from './backend/models/User.js';
dotenv.config();

const app = express();
const PORT = 4000;

// CORS configuration for production
const corsOptions = {
  origin: [
    'http://localhost:5173', // Development
    'http://localhost:3000', // Alternative dev port
    invoice-pro-git-main-raunaks-projects-2ec5b3d0.vercel.app
    'https://*.vercel.app', // All Vercel subdomains
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: String,
  clientName: String,
  clientEmail: String,
  clientAddress: String,
  issueDate: String,
  dueDate: String,
  items: [
    {
      description: String,
      quantity: Number,
      rate: Number,
      amount: Number,
    },
  ],
  status: String,
  amount: Number,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const businessSettingsSchema = new mongoose.Schema({
  type: { type: String, enum: ['individual', 'organization'], default: 'individual' },
  firstName: String,
  lastName: String,
  organizationName: String,
  companyName: String,
  email: String,
  phone: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
  taxId: String,
  currency: String,
  invoicePrefix: String,
  nextInvoiceNumber: String,
  paymentTerms: String,
  taxRate: String,
  lateFee: String,
  invoiceNotes: String,
  emailTemplate: String,
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
const BusinessSettings = mongoose.model('BusinessSettings', businessSettingsSchema);

const clientSchema = new mongoose.Schema({
  type: { type: String, enum: ['individual', 'organization'], default: 'individual' },
  firstName: String,
  lastName: String,
  organizationName: String,
  currency: String,
  language: String,
  email: { type: String, required: true },
  phone: String,
  address: {
    street1: String,
    street2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});
const Client = mongoose.model('Client', clientSchema);

// Utility function to determine invoice status
function getInvoiceStatus(invoice) {
  if (invoice.status === 'Paid') return 'Paid';
  const today = new Date();
  const dueDate = new Date(invoice.dueDate);
  // Zero out time for both dates
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  if (today > dueDate) return 'Overdue';
  return 'Unpaid';
}

// List all invoices (for the logged-in user)
app.get('/api/invoices', authenticateToken, async (req, res) => {
  const { startDate, endDate } = req.query;
  const query = { user: req.user.userId };
  if (startDate && endDate) {
    query.issueDate = { $gte: startDate, $lte: endDate };
  }
  let invoices = await Invoice.find(query);
  // Update status if needed
  const updates = [];
  invoices = invoices.map(inv => {
    const newStatus = getInvoiceStatus(inv);
    if (inv.status !== newStatus) {
      updates.push(Invoice.updateOne({ _id: inv._id }, { status: newStatus }));
      inv.status = newStatus;
    }
    return inv;
  });
  if (updates.length) await Promise.all(updates);
  res.json(invoices);
});

// Create a new invoice (for the logged-in user)
app.post('/api/invoices', authenticateToken, async (req, res) => {
  // Get business settings for the user
  let settings = await BusinessSettings.findOne();
  let nextNumber = 1;
  let prefix = 'INV-';
  if (settings) {
    prefix = settings.invoicePrefix || 'INV-';
    if (settings.nextInvoiceNumber && !isNaN(Number(settings.nextInvoiceNumber))) {
      nextNumber = Number(settings.nextInvoiceNumber);
    } else {
      // fallback: count existing invoices
      nextNumber = (await Invoice.countDocuments({ user: req.user.userId })) + 1;
    }
  }
  const invoiceNumber = `${prefix}${nextNumber}`;
  // Create invoice with generated number
  const invoice = new Invoice({ ...req.body, invoiceNumber, user: req.user.userId });
  await invoice.save();
  // Update nextInvoiceNumber in settings
  if (settings) {
    settings.nextInvoiceNumber = String(nextNumber + 1);
    await settings.save();
  }
  res.status(201).json(invoice);
});

// Delete an invoice (only if it belongs to the user)
app.delete('/api/invoices/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const invoice = await Invoice.findOneAndDelete({ _id: id, user: req.user.userId });
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found or not authorized' });
  }
  res.status(204).end();
});

// Update an invoice (only if it belongs to the user)
app.put('/api/invoices/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const updatedInvoice = await Invoice.findOneAndUpdate(
      { _id: id, user: req.user.userId },
      req.body,
      { new: true }
    );
    if (!updatedInvoice) {
      return res.status(404).json({ error: 'Invoice not found or not authorized' });
    }
    res.json(updatedInvoice);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// Get business settings
app.get('/api/business-settings', async (req, res) => {
  let settings = await BusinessSettings.findOne();
  if (!settings) {
    // If not found, create default settings
    settings = new BusinessSettings({});
    await settings.save();
  }
  res.json(settings);
});

// Update business settings
app.put('/api/business-settings', async (req, res) => {
  let settings = await BusinessSettings.findOne();
  if (!settings) {
    settings = new BusinessSettings(req.body);
  } else {
    Object.assign(settings, req.body);
  }
  await settings.save();
  res.json(settings);
});

// Send invoice email
app.post('/api/send-invoice-email', async (req, res) => {
  const { senderPassword, recipientEmail, subject, htmlContent } = req.body;
  // Get the current business settings for the sender email
  const businessSettings = await BusinessSettings.findOne();
  if (!businessSettings || !businessSettings.email) {
    return res.status(400).json({ error: 'Business email not set in settings.' });
  }
  const senderEmail = businessSettings.email;

  // Create a transporter
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
    auth: {
      user: senderEmail,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: senderEmail,
    to: recipientEmail,
    subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

// Register route
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    // Create initial business settings for this user
    const businessSettings = new BusinessSettings({ email, firstName: '', lastName: '', type: 'individual' });
    await businessSettings.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// Login route
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// List all clients for the logged-in user
app.get('/api/clients', authenticateToken, async (req, res) => {
  const clients = await Client.find({ user: req.user.userId });
  res.json(clients);
});

// Create a new client for the logged-in user
app.post('/api/clients', authenticateToken, async (req, res) => {
  const client = new Client({ ...req.body, user: req.user.userId });
  await client.save();
  res.status(201).json(client);
});

// Update a client (only if it belongs to the user)
app.put('/api/clients/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const updatedClient = await Client.findOneAndUpdate(
      { _id: id, user: req.user.userId },
      req.body,
      { new: true }
    );
    if (!updatedClient) {
      return res.status(404).json({ error: 'Client not found or not authorized' });
    }
    res.json(updatedClient);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// JWT middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Example protected route
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

app.listen(PORT, () => {
  console.log(`Invoice backend running on http://localhost:${PORT}`);
}); 
