import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Mail, Phone } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL + '/clients';

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then(res => res.json())
      .then((data) => {
        setClients(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load clients');
        setLoading(false);
      });
  }, []);

  // Listen for custom event to refresh clients
  useEffect(() => {
    const refreshClients = () => {
      setLoading(true);
      fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
        .then(res => res.json())
        .then((data) => {
          setClients(data);
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load clients');
          setLoading(false);
        });
    };
    window.addEventListener('client-added', refreshClients);
    return () => window.removeEventListener('client-added', refreshClients);
  }, []);

  const filteredClients = clients.filter((client) =>
    (client.organizationName || `${client.firstName} ${client.lastName}`)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <h1 className="text-3xl font-bold text-gray-800">Clients</h1>
      </div>
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients by name or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-500 py-8">Loading clients...</div>
        ) : error ? (
          <div className="col-span-full text-center text-red-500 py-8">{error}</div>
        ) : filteredClients.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-8">No clients found.</div>
        ) : filteredClients.map((client, idx) => (
          <div key={client._id || idx} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <Link
                  to={"#"}
                  className="text-lg font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  {client.type === 'organization' ? client.organizationName : `${client.firstName} ${client.lastName}`}
                </Link>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 ml-2 align-middle">
                  Active
                </span>
              </div>
              <div className="flex space-x-2">
                <button className="text-red-600 hover:text-red-800 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                {client.email}
              </div>
              {client.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {client.phone}
                </div>
              )}
            </div>
            <div className="text-sm text-gray-600 mb-4">
              {client.address?.street1 && <>{client.address.street1}<br /></>}
              {client.address?.street2 && <>{client.address.street2}<br /></>}
              {(client.address?.city || client.address?.state || client.address?.postalCode) && (
                <>{client.address.city}, {client.address.state} {client.address.postalCode}<br /></>
              )}
              {client.address?.country}
            </div>
            <div className="border-t pt-4 flex justify-between text-sm">
              <div>
                <p className="text-gray-500">Currency</p>
                <p className="font-semibold text-gray-800">{client.currency}</p>
              </div>
              <div>
                <p className="text-gray-500">Language</p>
                <p className="font-semibold text-gray-800">{client.language}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Clients;
