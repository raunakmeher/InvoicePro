import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Settings, X } from 'lucide-react';

const languages = [
  { label: 'English (US)', value: 'en-US' },
  // Add more languages as needed
];
const currencies = [
  { label: 'United States Dollar - USD', value: 'USD' },
  { label: 'Indian Rupee - INR', value: 'INR' },
  // Add more currencies as needed
];
const dueOptions = [
  { label: 'Due on Receipt', value: 'Due on Receipt' },
  { label: '3 days after', value: '3 days after' },
  { label: '7 days after', value: '7 days after' },
  { label: '15 days after', value: '15 days after' },
  { label: '1 month', value: '1 month' },
];

const CreateInvoice = () => {
  const [status, setStatus] = useState('Draft');
  const [title, setTitle] = useState('Invoice');
  const [description, setDescription] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('INV-2');
  const [language, setLanguage] = useState('en-US');
  const [currency, setCurrency] = useState('USD');
  const [from, setFrom] = useState('User Name');
  const [fromEmail, setFromEmail] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [due, setDue] = useState('Due on Receipt');
  const [poNumber, setPoNumber] = useState('');
  const [items, setItems] = useState([
    { description: '', quantity: 1, rate: 0, amount: 0, unit: 'Unit' },
  ]);
  const [note, setNote] = useState('');
  const [footer, setFooter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
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
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isEditClient, setIsEditClient] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL + '/invoices';

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + '/clients', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => res.json())
      .then(setClients);
  }, [showClientModal]);

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + '/business-settings')
      .then(res => res.json())
      .then(data => {
        if (data.firstName || data.lastName) {
          setFrom(`${data.firstName || ''} ${data.lastName || ''}`.trim());
        }
        if (data.email) {
          setFromEmail(data.email);
        }
      });
  }, []);

  const handleItemChange = (index, field, value) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updated.amount = (Number(updated.quantity) || 0) * (Number(updated.rate) || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems(prev => [...prev, { description: '', quantity: 1, rate: 0, amount: 0, unit: 'Unit' }]);
  };

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const tax = 0; // You can add tax logic here
  const total = subtotal + tax;

  const handleClientSelect = (e) => {
    const clientId = e.target.value;
    setSelectedClientId(clientId);
    const client = clients.find(c => c._id === clientId);
    if (client) setTo(client.type === 'organization' ? client.organizationName : `${client.firstName} ${client.lastName}`);
  };

  const openClientModal = (edit = false) => {
    setClientError('');
    setIsEditClient(edit);
    if (edit && selectedClientId) {
      const client = clients.find(c => c._id === selectedClientId);
      if (client) {
        setClientType(client.type);
        setClientForm({
          firstName: client.firstName || '',
          lastName: client.lastName || '',
          organizationName: client.organizationName || '',
          currency: client.currency || 'USD',
          language: client.language || 'en-US',
          email: client.email || '',
          phone: client.phone || '',
          address: {
            street1: client.address?.street1 || '',
            street2: client.address?.street2 || '',
            city: client.address?.city || '',
            state: client.address?.state || '',
            postalCode: client.address?.postalCode || '',
            country: client.address?.country || '',
          },
        });
      }
    } else {
      setClientType('individual');
      setClientForm({
        firstName: '', lastName: '', organizationName: '', currency: 'USD', language: 'en-US', email: '', phone: '',
        address: { street1: '', street2: '', city: '', state: '', postalCode: '', country: '' },
      });
    }
    setShowClientModal(true);
  };

  const handleClientFormChange = (field, value) => {
    if (['street1', 'street2', 'city', 'state', 'postalCode', 'country'].includes(field)) {
      setClientForm(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
    } else {
      setClientForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleClientSave = async (e) => {
    e.preventDefault();
    setClientError('');
    // Validation
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
    let res, newClient;
    if (isEditClient && selectedClientId) {
      res = await fetch(import.meta.env.VITE_API_URL + `/clients/${selectedClientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ ...clientForm, type: clientType }),
      });
      if (res.ok) {
        newClient = await res.json();
      }
    } else {
      res = await fetch(import.meta.env.VITE_API_URL + '/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ ...clientForm, type: clientType }),
      });
      if (res.ok) {
        newClient = await res.json();
      }
    }
    if (res.ok) {
      setShowClientModal(false);
      window.dispatchEvent(new Event('client-added'));
      setSelectedClientId(newClient._id);
      setTo(newClient.type === 'organization' ? newClient.organizationName : `${newClient.firstName} ${newClient.lastName}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setClientError(data.error || data.message || 'Failed to save client.');
    }
  };

  const calculateDueDate = (baseDate, dueOption) => {
    const date = new Date(baseDate);
    switch (dueOption) {
      case 'Due on Receipt':
        return date.toISOString().split('T')[0];
      case '3 days after':
        date.setDate(date.getDate() + 3);
        return date.toISOString().split('T')[0];
      case '7 days after':
        date.setDate(date.getDate() + 7);
        return date.toISOString().split('T')[0];
      case '15 days after':
        date.setDate(date.getDate() + 15);
        return date.toISOString().split('T')[0];
      case '1 month':
        date.setMonth(date.getMonth() + 1);
        return date.toISOString().split('T')[0];
      default:
        return date.toISOString().split('T')[0];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const calculatedDueDate = calculateDueDate(date, due);
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          invoiceNumber,
          clientName: to,
          clientAddress: '', // You can add a field for this if needed
          clientEmail: '', // You can add a field for this if needed
          issueDate: date,
          dueDate: calculatedDueDate,
          items: items.map(({ description, quantity, rate, amount }) => ({ description, quantity, rate, amount })),
          status,
          amount: total,
          // Add any other fields needed by the backend schema
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create invoice');
      }
      navigate('/invoices');
    } catch (err) {
      setError(err.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/invoices" className="text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">New Invoice</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Status and Title */}
        <div className="flex items-center gap-4 mb-2">
          <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full font-semibold">{status}</span>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="text-2xl font-bold border-b border-gray-300 focus:outline-none focus:border-blue-500 flex-1"
            style={{ minWidth: 120 }}
          />
        </div>
        {/* Description */}
        <input
          type="text"
          placeholder="Add Description ..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mb-4"
        />
        {/* Invoice Info Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice No.</label>
            <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full px-3 py-2 border rounded">
              {languages.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-3 py-2 border rounded">
              {currencies.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>
        {/* From/To Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">From</span>
              <Link to="/settings" className="text-blue-600 hover:underline text-sm">Edit Business Profile</Link>
            </div>
            <div className="text-gray-800">{from}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">To</span>
              {selectedClientId ? (
                <button type="button" className="text-blue-600 hover:underline text-sm" onClick={() => openClientModal(true)}>Edit Client</button>
              ) : (
                <button type="button" className="text-blue-600 hover:underline text-sm" onClick={() => openClientModal(false)}>New Client</button>
              )}
            </div>
            <select className="w-full px-3 py-2 border rounded" onChange={handleClientSelect} value={selectedClientId}>
              <option value="">Select Existing Client</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>
                  {client.type === 'organization' ? client.organizationName : `${client.firstName} ${client.lastName}`} ({client.email})
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* New Client Modal */}
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
        {/* Date, Due, PO Number */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Due</label>
            <select value={due} onChange={e => setDue(e.target.value)} className="w-full px-3 py-2 border rounded">
              {dueOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Order Number</label>
            <input type="text" value={poNumber} onChange={e => setPoNumber(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </div>
        </div>
        {/* Items Table */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Description</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border rounded">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Item Name & Description</th>
                  <th className="p-2 text-left">Quantity</th>
                  <th className="p-2 text-left">Rate</th>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2 text-left">Unit</th>
                  <th className="p-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={e => handleItemChange(idx, 'description', e.target.value)}
                        className="w-full px-2 py-1 border rounded"
                        placeholder="Item Name & Description"
                        required
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.quantity}
                        min={1}
                        onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-20 px-2 py-1 border rounded"
                        required
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.rate}
                        min={0}
                        step={0.01}
                        onChange={e => handleItemChange(idx, 'rate', e.target.value)}
                        className="w-24 px-2 py-1 border rounded"
                        required
                      />
                    </td>
                    <td className="p-2 font-semibold">{item.amount.toFixed(2)}</td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.unit}
                        onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                        className="w-20 px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="p-2">
                      <button type="button" onClick={() => removeItem(idx)} className="text-red-600 hover:text-red-800 transition-colors" disabled={items.length === 1}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={addItem} className="mt-2 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 flex items-center text-sm">
            <Plus className="w-4 h-4 mr-1" /> New Line
          </button>
        </div>
        {/* Totals */}
        <div className="flex flex-col md:flex-row md:justify-end gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-4 w-full md:w-1/3">
            <div className="flex justify-between mb-2">
              <span className="text-gray-700">Sub Total</span>
              <span>{subtotal.toFixed(2)} {currency}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-700">Total ({currency})</span>
              <span>{total.toFixed(2)} {currency}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Balance</span>
              <span>{total.toFixed(2)} {currency}</span>
            </div>
            {/* Taxes and other controls can be added here */}
          </div>
        </div>
        {/* Invoice Note */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Note</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Add a note to this invoice"
          />
        </div>
        {/* Footer and Email */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            {fromEmail && (
              <div className="mb-2 text-gray-700 font-medium">Email: {fromEmail}</div>
            )}
            {/* Email removed */}
            <button type="button" className="text-blue-600 hover:underline text-sm" onClick={() => setFooter('')}>Edit Default Footer</button>
            <div className="mt-2">
              <textarea
                value={footer}
                onChange={e => setFooter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Footer text"
              />
            </div>
          </div>
        </div>
        {error && <div className="text-red-600 font-semibold mb-2">{error}</div>}
        <div className="flex justify-end">
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold" disabled={loading}>
            {loading ? 'Saving...' : 'Save Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoice;
