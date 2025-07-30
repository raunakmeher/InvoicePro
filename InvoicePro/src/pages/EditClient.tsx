import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

const mockClients = [
  {
    id: 1,
    name: 'Acme Corp',
    email: 'contact@acmecorp.com',
    phone: '+91 98765 43210',
    address: '123 Business St, Mumbai, MH 400001',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Tech Solutions Inc',
    email: 'info@techsolutions.com',
    phone: '+91 87654 32109',
    address: '456 Tech Ave, Bangalore, KA 560001',
    status: 'Active',
  },
  {
    id: 3,
    name: 'Creative Studio',
    email: 'hello@creativestudio.com',
    phone: '+91 76543 21098',
    address: '789 Design Blvd, Pune, MH 411001',
    status: 'Active',
  },
  {
    id: 4,
    name: 'Digital Agency',
    email: 'contact@digitalagency.com',
    phone: '+91 65432 10987',
    address: '321 Marketing St, Delhi, DL 110001',
    status: 'Inactive',
  },
];

const EditClient = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const client = mockClients.find(c => String(c.id) === clientId);
  const [form, setForm] = useState(client || {
    name: '', email: '', phone: '', address: '', status: 'Active'
  });
  const [success, setSuccess] = useState(false);

  if (!client) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Client Not Found</h2>
        <Link to="/clients" className="text-blue-600 hover:underline">Back to Clients</Link>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => navigate('/clients'), 1200);
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-lg shadow-md p-6 mt-6">
      <h2 className="text-2xl font-bold mb-4">Edit Client</h2>
      {success && <div className="mb-4 text-green-600 font-semibold">Client updated successfully!</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Link to="/clients" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</Link>
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Save Changes</button>
        </div>
      </form>
    </div>
  );
};

export default EditClient; 