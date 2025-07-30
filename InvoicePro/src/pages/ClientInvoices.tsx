import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL + '/invoices';

const ClientInvoices = () => {
  const { clientName, clientEmail } = useParams();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(API_URL)
      .then(res => res.json())
      .then((data) => {
        setInvoices(
          data.filter(
            (inv) =>
              (inv.clientName || '').toLowerCase() === decodeURIComponent(clientName || '').toLowerCase() &&
              (inv.clientEmail || '').toLowerCase() === decodeURIComponent(clientEmail || '').toLowerCase()
          )
        );
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load invoices');
        setLoading(false);
      });
  }, [clientName, clientEmail]);

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 mt-6">
      <h2 className="text-2xl font-bold mb-4">Invoices for {decodeURIComponent(clientName || '')}</h2>
      <div className="mb-4 text-gray-600">Email: {decodeURIComponent(clientEmail || '')}</div>
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading invoices...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No invoices found for this client.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice: any) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    <Link to={`/invoices/${invoice.id}`} className="hover:underline">{invoice.invoiceNumber || invoice.id}</Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">₹{invoice.amount?.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      invoice.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.issueDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-6">
        <Link to="/clients" className="text-blue-600 hover:underline">Back to Clients</Link>
      </div>
    </div>
  );
};

export default ClientInvoices; 