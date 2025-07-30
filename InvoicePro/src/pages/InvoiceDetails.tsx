import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL + '/invoices';
const BUSINESS_EMAIL = 'admin@invoicepro.com'; // For demo, match your settings
const EMAIL_TEMPLATE = 'Dear {{clientName}},<br><br>Please find attached your invoice <b>#{{invoiceNumber}}</b> for ₹{{amount}}.<br><br>Thank you for your business!<br><br>Best regards,<br>InvoicePro';

const InvoiceDetails = () => {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Remove handleSendInvoice and related state
  const [businessSettings, setBusinessSettings] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        const found = data.find((inv: any) => inv._id === invoiceId);
        setInvoice(found);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load invoice');
        setLoading(false);
      });
  }, [invoiceId]);

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL+'/business-settings')
      .then(res => res.json())
      .then(data => setBusinessSettings(data));
  }, []);

  // Remove handleSendInvoice and related state

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

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading invoice...</div>;
  }

  if (error || !invoice) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Invoice Not Found</h2>
        <Link to="/invoices" className="text-blue-600 hover:underline">Back to Invoices</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6 mt-6">
      <h2 className="text-2xl font-bold mb-4">Invoice Details</h2>
      <div className="mb-4">
        <div><span className="font-semibold">Invoice ID:</span> {invoice.invoiceNumber || invoice.id}</div>
        <div><span className="font-semibold">Client Name:</span> {invoice.clientName}</div>
        <div><span className="font-semibold">Client Email:</span> {invoice.clientEmail}</div>
        <div><span className="font-semibold">Client Address:</span> {invoice.clientAddress}</div>
        <div><span className="font-semibold">Issue Date:</span> {invoice.issueDate}</div>
        <div><span className="font-semibold">Due Date:</span> {invoice.dueDate}</div>
        <div><span className="font-semibold">Status:</span> <StatusBadge status={invoice.status} /></div>
        <div><span className="font-semibold">Total Amount:</span> ₹{invoice.amount?.toLocaleString()}</div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Items</h3>
        <table className="w-full border rounded">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-left">Quantity</th>
              <th className="p-2 text-left">Rate</th>
              <th className="p-2 text-left">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item: any, idx: number) => (
              <tr key={idx}>
                <td className="p-2">{item.description}</td>
                <td className="p-2">{item.quantity}</td>
                <td className="p-2">₹{item.rate?.toLocaleString()}</td>
                <td className="p-2">₹{item.amount?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex gap-4">
        <Link to="/invoices" className="text-blue-600 hover:underline">Back to Invoices</Link>
      </div>
    </div>
  );
};

export default InvoiceDetails; 