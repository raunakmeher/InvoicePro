import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, ChevronDown, Trash2, Edit } from 'lucide-react';

const amountRanges = [
  { label: 'Below ₹1,00,000', value: 'below-1l' },
  { label: '₹1,00,000 - ₹2,00,000', value: '1l-2l' },
  { label: '₹2,00,000 - ₹5,00,000', value: '2l-5l' },
  { label: 'Above ₹5,00,000', value: 'above-5l' },
];
const dateRanges = [
  { label: 'Older than a week', value: 'week' },
  { label: 'Older than a month', value: 'month' },
  { label: 'Older than three months', value: 'three-months' },
  { label: 'Older than six months', value: 'six-months' },
  { label: 'Older than a year', value: 'year' },
];

const API_URL = import.meta.env.VITE_API_URL + '/invoices';

const Invoices = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const navigate = useNavigate();
  const filterRef = useRef(null);

  // Fetch invoices from backend
  useEffect(() => {
    setLoading(true);
    fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setInvoices(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load invoices');
        setLoading(false);
      });
  }, []);

  // Delete invoice
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    setInvoices(invoices.filter(inv => inv.id !== id));
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    }
    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

  // Helper to parse amount string or number
  function parseAmount(amount) {
    if (typeof amount === 'number') return amount;
    return Number(amount.replace(/[^\d]/g, ''));
  }

  // Helper to check date range
  function isDateInRange(dateStr, range) {
    const now = new Date();
    const date = new Date(dateStr);
    switch (range) {
      case 'week':
        return now.getTime() - date.getTime() > 7 * 24 * 60 * 60 * 1000;
      case 'month':
        return now.getTime() - date.getTime() > 30 * 24 * 60 * 60 * 1000;
      case 'three-months':
        return now.getTime() - date.getTime() > 90 * 24 * 60 * 60 * 1000;
      case 'six-months':
        return now.getTime() - date.getTime() > 180 * 24 * 60 * 60 * 1000;
      case 'year':
        return now.getTime() - date.getTime() > 365 * 24 * 60 * 60 * 1000;
      default:
        return true;
    }
  }

  // Helper to determine if an invoice is overdue
  function isOverdue(invoice) {
    if (!invoice.dueDate) return false;
    const due = new Date(invoice.dueDate);
    const now = new Date();
    // Only consider as overdue if status is Pending or Unpaid
    return (invoice.status === 'Pending' || invoice.status === 'Unpaid') && due < now;
  }

  // Map filteredInvoices to override status for display if overdue
  const displayInvoices = invoices.filter((invoice) => {
    // Text filter
    const matchesClient = invoice.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || invoice.client?.toLowerCase().includes(searchTerm.toLowerCase());
    // Status filter
    const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter;
    // Amount filter
    let matchesAmount = true;
    const amt = parseAmount(invoice.amount);
    if (selectedAmount === 'below-1l') matchesAmount = amt < 100000;
    else if (selectedAmount === '1l-2l') matchesAmount = amt >= 100000 && amt <= 200000;
    else if (selectedAmount === '2l-5l') matchesAmount = amt > 200000 && amt <= 500000;
    else if (selectedAmount === 'above-5l') matchesAmount = amt > 500000;
    // Date filter
    let matchesDate = true;
    if (selectedDate) matchesDate = isDateInRange(invoice.issueDate || invoice.date, selectedDate);
    return matchesClient && matchesStatus && matchesAmount && matchesDate;
  }).map(inv => {
    if (isOverdue(inv)) {
      return { ...inv, status: 'Overdue' };
    }
    return inv;
  });

  // Edit invoice
  const handleEdit = async (updatedInvoice) => {
    try {
      const { _id, ...updateData } = updatedInvoice;
      const response = await fetch(`${API_URL}/${_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updateData),
      });
      
      if (response.ok) {
        setInvoices(invoices.map(inv => 
          inv._id === _id ? { ...updatedInvoice } : inv
        ));
        setShowEditDialog(false);
        setEditingInvoice(null);
      } else {
        alert('Failed to update invoice');
      }
    } catch (error) {
      alert('Error updating invoice');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <h1 className="text-3xl font-bold text-gray-800">Invoices</h1>
        <Link 
          to="/create-invoice" 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3 items-center relative" ref={filterRef}>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
              <option value="Draft">Draft</option>
            </select>
            <button
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
              onClick={() => setShowFilters((v) => !v)}
              type="button"
            >
              <Filter className="w-4 h-4 mr-2" />
              More Filters
              <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            {showFilters && (
              <div className="absolute right-0 top-12 z-20 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                <div className="mb-4">
                  <div className="font-semibold text-gray-700 mb-2">Amount</div>
                  <div className="flex flex-col gap-2">
                    {amountRanges.map((range) => (
                      <label key={range.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="amount"
                          value={range.value}
                          checked={selectedAmount === range.value}
                          onChange={() => setSelectedAmount(range.value)}
                        />
                        {range.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700 mb-2">Date</div>
                  <div className="flex flex-col gap-2">
                    {dateRanges.map((range) => (
                      <label key={range.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="date"
                          value={range.value}
                          checked={selectedDate === range.value}
                          onChange={() => setSelectedDate(range.value)}
                        />
                        {range.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading invoices...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayInvoices.map((invoice) => (
                <tr key={invoice._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <Link
                      to={`/invoices/${invoice._id}`}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      {invoice.invoiceNumber || invoice._id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.clientName || invoice.client}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">₹{parseAmount(invoice.amount).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.issueDate || invoice.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.dueDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center justify-center relative h-full min-h-[32px] space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-800 transition-colors rounded-full p-1 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        title="View Invoice"
                        onClick={() => navigate(`/invoices/${invoice._id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-800 transition-colors rounded-full p-1 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-200"
                        title="Edit Invoice"
                        onClick={() => {
                          setEditingInvoice(invoice);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 transition-colors rounded-full p-1 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                        title="Delete Invoice"
                        onClick={() => handleDelete(invoice._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Edit Invoice Dialog */}
      {showEditDialog && editingInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Edit Invoice</h2>
                <button
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingInvoice(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <EditInvoiceForm 
                invoice={editingInvoice}
                onSave={handleEdit}
                onCancel={() => {
                  setShowEditDialog(false);
                  setEditingInvoice(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add StatusBadge component
const StatusBadge = ({ status }) => {
  let colorClass = '';
  switch (status) {
    case 'Paid':
      colorClass = 'bg-green-100 text-green-800';
      break;
    case 'Unpaid':
      colorClass = 'bg-yellow-100 text-yellow-800';
      break;
    case 'Pending':
      colorClass = 'bg-yellow-100 text-yellow-800';
      break;
    case 'Overdue':
      colorClass = 'bg-red-100 text-red-800';
      break;
    default:
      colorClass = 'bg-gray-100 text-gray-800';
  }
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorClass}`}>
      {status}
    </span>
  );
};

// Edit Invoice Form Component
const EditInvoiceForm = ({ invoice, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    _id: invoice._id,
    invoiceNumber: invoice.invoiceNumber || invoice._id,
    clientName: invoice.clientName || invoice.client,
    amount: invoice.amount,
    status: invoice.status,
    issueDate: invoice.issueDate || invoice.date,
    dueDate: invoice.dueDate,
    description: invoice.description || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Invoice Number
        </label>
        <input
          type="text"
          value={formData.invoiceNumber}
          onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Client Name
        </label>
        <input
          type="text"
          value={formData.clientName}
          onChange={(e) => setFormData({...formData, clientName: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount (₹)
        </label>
        <input
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          min="0"
          step="0.01"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({...formData, status: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="Draft">Draft</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Issue Date
        </label>
        <input
          type="date"
          value={formData.issueDate}
          onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save Changes
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default Invoices; 