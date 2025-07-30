import React, { useState, useEffect } from 'react';
import { FileText, DollarSign, Clock, TrendingUp } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import CurrencySelector from '../components/CurrencySelector';
import { convertCurrency, formatCurrency } from '../utils/currency';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL + '/invoices';
const CLIENTS_API_URL = import.meta.env.VITE_API_URL + '/clients';

const Dashboard = () => {
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientType, setClientType] = useState('individual');
  const [clientForm, setClientForm] = useState({
    firstName: '',
    lastName: '',
    organizationName: '',
    currency: 'USD',
    language: 'en-US',
    email: '',
    phone: '',
    address: {
      street1: '',
      street2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
  });
  const [clientError, setClientError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(API_URL, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(res => res.json()),
      fetch(CLIENTS_API_URL, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(res => res.json()),
    ])
      .then(([invoiceData, clientData]) => {
        setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
        setClients(Array.isArray(clientData) ? clientData : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load dashboard data');
        setLoading(false);
      });
  }, []);

  // Helper to determine if an invoice is overdue (same as Invoices.tsx)
  function isOverdue(inv) {
    if (!inv.dueDate) return false;
    const due = new Date(inv.dueDate);
    const now = new Date();
    return (inv.status === 'Pending' || inv.status === 'Unpaid') && due < now;
  }

  // At a Glance
  const outstanding = invoices.filter(inv => inv.status === 'Unpaid' || inv.status === 'Overdue').reduce((sum, inv) => sum + (inv.amount || 0), 0);
  // Updated overdue logic
  const overdue = invoices.filter(inv => inv.status === 'Overdue' || isOverdue(inv)).reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const collectedThisYear = invoices.filter(inv => inv.status === 'Paid' && new Date(inv.issueDate || inv.date).getFullYear() === new Date().getFullYear()).reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const clientCount = clients.length;

  // Recent Activity (last 5 events)
  const recentActivity = [...invoices]
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.issueDate || a.date).getTime();
      const dateB = new Date(b.updatedAt || b.issueDate || b.date).getTime();
      return dateB - dateA;
    })
    .slice(0, 5)
    .map(inv => {
      let action = 'Invoice created';
      if (inv.status === 'Paid') action = 'Payment received';
      else if (inv.updatedAt && inv.updatedAt !== inv.issueDate && inv.updatedAt !== inv.date) action = 'Invoice modified';
      return {
        date: inv.updatedAt || inv.issueDate || inv.date,
        action,
        client: inv.clientName,
        amount: inv.amount,
        currency: inv.currency || selectedCurrency,
      };
    });

  // Invoice Summary (Donut)
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalReceived = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalOutstanding = outstanding;
  const summaryData = [
    { name: 'Invoiced', value: totalInvoiced, color: '#3B82F6' },
    { name: 'Received', value: totalReceived, color: '#10B981' },
    { name: 'Outstanding', value: totalOutstanding, color: '#F59E0B' },
  ];

  // Invoiced/Received Chart (Bar)
  const monthlyMap = new Map();
  invoices.forEach(inv => {
    const date = new Date(inv.issueDate || inv.date);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyMap.has(month)) monthlyMap.set(month, { month, invoiced: 0, received: 0 });
    const entry = monthlyMap.get(month);
    entry.invoiced += inv.amount || 0;
    if (inv.status === 'Paid') entry.received += inv.amount || 0;
  });
  const monthlyChartData = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));

  // Accounts Receivable
  const receivableMap = new Map();
  invoices.forEach(inv => {
    if (inv.status === 'Unpaid' || inv.status === 'Overdue') {
      if (!receivableMap.has(inv.clientName)) receivableMap.set(inv.clientName, 0);
      receivableMap.set(inv.clientName, receivableMap.get(inv.clientName) + (inv.amount || 0));
    }
  });
  const receivableList = Array.from(receivableMap.entries()).map(([client, amount]) => ({ client, amount }));

  // Client modal logic (from CreateInvoice)
  const handleClientFormChange = (field, value) => {
    if ([
      'street1', 'street2', 'city', 'state', 'postalCode', 'country',
    ].includes(field)) {
      setClientForm(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
    } else {
      setClientForm(prev => ({ ...prev, [field]: value }));
    }
  };
  const handleClientSave = async (e) => {
    e.preventDefault();
    setClientError('');
    if (clientType === 'individual') {
      if (!clientForm.firstName || !clientForm.lastName || !clientForm.email) {
        setClientError('First name, last name, and email are required.');
        return;
      }
    } else {
      if (!clientForm.organizationName || !clientForm.email) {
        setClientError('Organization name and email are required.');
        return;
      }
    }
    const res = await fetch(import.meta.env.VITE_API_URL + '/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ ...clientForm, type: clientType }),
    });
    if (res.ok) {
      setShowClientModal(false);
      setClientForm({
        firstName: '', lastName: '', organizationName: '', currency: 'USD', language: 'en-US', email: '', phone: '',
        address: { street1: '', street2: '', city: '', state: '', postalCode: '', country: '' },
      });
    } else {
      const data = await res.json().catch(() => ({}));
      setClientError(data.error || data.message || 'Failed to save client.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white flex items-center justify-between px-8 py-4 shadow-sm border-b">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <div className="relative">
          <button
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-lg shadow transition-colors"
            onClick={() => setShowDropdown(v => !v)}
          >
            Add New <span className="ml-1">▼</span>
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-30">
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  setShowDropdown(false);
                  setShowClientModal(true);
                }}
              >Client</button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/create-invoice');
                }}
              >Invoice</button>
            </div>
          )}
        </div>
      </div>
      {/* Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={() => setShowClientModal(false)}><X /></button>
            <h2 className="text-2xl font-bold mb-4">New Client</h2>
            <div className="mb-4">
              <div className="flex gap-2 mb-2">
                <button type="button" className={`px-4 py-2 rounded border ${clientType === 'individual' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setClientType('individual')}>Individual</button>
                <button type="button" className={`px-4 py-2 rounded border ${clientType === 'organization' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setClientType('organization')}>Organization</button>
              </div>
              <div className="space-y-3">
                {clientType === 'individual' && (
                  <div className="flex gap-2">
                    <input type="text" placeholder="First Name" className="w-1/2 px-3 py-2 border rounded" value={clientForm.firstName} onChange={e => handleClientFormChange('firstName', e.target.value)} required />
                    <input type="text" placeholder="Last Name" className="w-1/2 px-3 py-2 border rounded" value={clientForm.lastName} onChange={e => handleClientFormChange('lastName', e.target.value)} required />
                  </div>
                )}
                {clientType === 'organization' && (
                  <input type="text" placeholder="Organization Name" className="w-full px-3 py-2 border rounded" value={clientForm.organizationName} onChange={e => handleClientFormChange('organizationName', e.target.value)} required />
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select className="w-full px-3 py-2 border rounded" value={clientForm.currency} onChange={e => handleClientFormChange('currency', e.target.value)}>
                    <option value="USD">United States Dollar - USD</option>
                    <option value="INR">Indian Rupee - INR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select className="w-full px-3 py-2 border rounded" value={clientForm.language} onChange={e => handleClientFormChange('language', e.target.value)}>
                    <option value="en-US">English (US)</option>
                  </select>
                </div>
                <input type="email" placeholder="Email Address" className="w-full px-3 py-2 border rounded" value={clientForm.email} onChange={e => handleClientFormChange('email', e.target.value)} required />
                <input type="text" placeholder="Phone Number" className="w-full px-3 py-2 border rounded" value={clientForm.phone} onChange={e => handleClientFormChange('phone', e.target.value)} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input type="text" placeholder="Street Line 1" className="w-full px-3 py-2 border rounded mb-2" value={clientForm.address.street1} onChange={e => handleClientFormChange('street1', e.target.value)} />
                  <input type="text" placeholder="Street Line 2" className="w-full px-3 py-2 border rounded mb-2" value={clientForm.address.street2} onChange={e => handleClientFormChange('street2', e.target.value)} />
                  <div className="flex gap-2 mb-2">
                    <input type="text" placeholder="City" className="w-1/3 px-3 py-2 border rounded" value={clientForm.address.city} onChange={e => handleClientFormChange('city', e.target.value)} />
                    <input type="text" placeholder="State" className="w-1/3 px-3 py-2 border rounded" value={clientForm.address.state} onChange={e => handleClientFormChange('state', e.target.value)} />
                    <input type="text" placeholder="Postal Code" className="w-1/3 px-3 py-2 border rounded" value={clientForm.address.postalCode} onChange={e => handleClientFormChange('postalCode', e.target.value)} />
                  </div>
                  <select className="w-full px-3 py-2 border rounded" value={clientForm.address.country} onChange={e => handleClientFormChange('country', e.target.value)}>
                    <option value="">Select Country</option>
                    <option value="US">United States</option>
                    <option value="IN">India</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
                {clientError && <div className="text-red-600 text-sm text-center">{clientError}</div>}
                <button type="button" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors font-semibold" onClick={handleClientSave}>Save Client</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto py-8 px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Activity, Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6 min-h-[200px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
            </div>
            <ul className="divide-y divide-gray-100">
              {recentActivity.length === 0 ? (
                <li className="py-2 text-gray-500">No recent activity.</li>
              ) : recentActivity.map((act, idx) => (
                <li key={idx} className="py-2 flex items-center justify-between">
                  <span className="text-gray-700 text-sm">
                    <span className="font-semibold">{new Date(act.date).toLocaleDateString()}:</span> {act.action} for <span className="font-semibold">{act.client}</span> {act.amount ? `- ${formatCurrency(act.amount, act.currency)}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {/* Invoiced / Received Chart */}
          <div className="bg-white rounded-lg shadow p-6 min-h-[300px]">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Invoiced / Received</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="invoiced" fill="#3B82F6" name="Invoiced" />
                <Bar dataKey="received" fill="#10B981" name="Received" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Right column: At a Glance, Summary, Receivable */}
        <div className="space-y-6">
          {/* At a Glance */}
          <div className="bg-white rounded-lg shadow p-6 min-h-[200px]">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">At a Glance</h2>
            <ul className="space-y-2">
              <li className="flex justify-between"><span>Total Outstanding:</span> <span>{formatCurrency(outstanding, selectedCurrency)}</span></li>
              <li className="flex justify-between"><span>Total Overdue:</span> <span>{formatCurrency(overdue, selectedCurrency)}</span></li>
              <li className="flex justify-between"><span>Total Collected this Year:</span> <span>{formatCurrency(collectedThisYear, selectedCurrency)}</span></li>
              <li className="flex justify-between"><span>Clients:</span> <span>{clientCount}</span></li>
            </ul>
          </div>
          {/* Invoice Summary Donut */}
          <div className="bg-white rounded-lg shadow p-6 min-h-[300px] flex flex-col items-center justify-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Invoice Summary</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={summaryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {summaryData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              {summaryData.map((d, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className="text-xs text-gray-500">{d.name}</span>
                  <span className="font-bold text-gray-800">{formatCurrency(d.value, selectedCurrency)}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Accounts Receivable */}
          <div className="bg-white rounded-lg shadow p-6 min-h-[200px]">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Accounts Receivable</h2>
            <ul className="divide-y divide-gray-100">
              {receivableList.length === 0 ? (
                <li className="py-2 text-gray-500">No outstanding balances.</li>
              ) : receivableList.map((r, idx) => (
                <li key={idx} className="py-2 flex justify-between">
                  <span>{r.client}</span>
                  <span className="font-semibold">{formatCurrency(r.amount, selectedCurrency)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 