import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL + '/invoices';
const CLIENTS_API_URL = import.meta.env.VITE_API_URL + '/clients';

const periodOptions = [
  { label: 'All Time', value: 'all' },
  { label: 'Last 30 Days', value: 'last-30-days' },
  { label: 'Last 3 Months', value: 'last-3-months' },
  { label: 'Last 6 Months', value: 'last-6-months' },
  { label: 'Last Year', value: 'last-year' },
];
const statusOptions = [
  { label: 'All', value: 'All' },
  { label: 'Unpaid', value: 'Unpaid' },
  { label: 'Paid', value: 'Paid' },
];

const Reports = () => {
  const [period, setPeriod] = useState('all');
  const [status, setStatus] = useState('All');
  const [client, setClient] = useState('all');
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportReady, setReportReady] = useState(false);

  useEffect(() => {
    fetch(CLIENTS_API_URL, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => res.json())
      .then(setClients)
      .catch(() => setClients([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    let url = API_URL;
    if (period !== 'all') {
      let fromDate = new Date();
      const now = new Date();
      if (period === 'last-30-days') fromDate.setDate(now.getDate() - 30);
      else if (period === 'last-3-months') fromDate.setMonth(now.getMonth() - 2);
      else if (period === 'last-6-months') fromDate.setMonth(now.getMonth() - 5);
      else if (period === 'last-year') fromDate.setFullYear(now.getFullYear() - 1);
      const start = fromDate.toISOString().split('T')[0];
      const end = now.toISOString().split('T')[0];
      url += `?startDate=${start}&endDate=${end}`;
    }
    fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
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
  }, [period]);

  useEffect(() => {
    let data = invoices;
    if (status !== 'All') data = data.filter(inv => inv.status === status);
    if (client !== 'all') {
      const selected = clients.find(c => c._id === client);
      if (selected) {
        const name = selected.type === 'organization' ? selected.organizationName : `${selected.firstName} ${selected.lastName}`;
        data = data.filter(inv => inv.clientName === name);
      }
    }
    setFiltered(data);
  }, [invoices, status, client, clients]);

  const handleGenerateReport = (e) => {
    e.preventDefault();
    let data = invoices;
    if (status !== 'All') data = data.filter(inv => inv.status === status);
    if (client !== 'all') {
      const selected = clients.find(c => c._id === client);
      if (selected) {
        const name = selected.type === 'organization' ? selected.organizationName : `${selected.firstName} ${selected.lastName}`;
        data = data.filter(inv => inv.clientName === name);
      }
    }
    setFiltered(data);
    setReportReady(true);
  };

  const handleDownloadPDF = async () => {
    if (!reportReady || filtered.length === 0) return;
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default;
    const autoTableModule = await import('jspdf-autotable');
    const autoTable = autoTableModule.default || autoTableModule;
    const doc = new jsPDF();
    doc.text('Invoice Report', 14, 16);
    if (typeof autoTable === 'function') {
      autoTable(doc, {
        startY: 24,
        head: [[
          'Invoice ID', 'Client', 'Date Issued', 'Date Due', 'Date Paid', 'Status', 'Currency', 'Amount'
        ]],
        body: filtered.map(inv => [
          inv.invoiceNumber || inv._id,
          inv.clientName,
          inv.issueDate,
          inv.dueDate,
          inv.datePaid || '',
          inv.status,
          inv.currency || 'INR',
          inv.amount?.toLocaleString() || '',
        ]),
      });
      doc.save('invoice_report.pdf');
    } else {
      alert('PDF export failed: autoTable is not a function.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
      <div className="bg-gray-100 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Generate Report</h2>
        <form onSubmit={handleGenerateReport}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select className="w-full px-3 py-2 border rounded" value="Invoices" disabled>
                <option value="Invoices">Invoices</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <select className="w-full px-3 py-2 border rounded" value={period} onChange={e => setPeriod(e.target.value)}>
                {periodOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full px-3 py-2 border rounded" value={status} onChange={e => setStatus(e.target.value)}>
                {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select className="w-full px-3 py-2 border rounded" value={client} onChange={e => setClient(e.target.value)}>
                <option value="all">All Clients</option>
                {clients.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.type === 'organization' ? c.organizationName : `${c.firstName} ${c.lastName}`} ({c.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded shadow transition-colors"
          >
            Generate Report
          </button>
        </form>
        <button
          className="bg-gray-700 hover:bg-gray-900 text-white font-semibold px-6 py-2 rounded shadow transition-colors mt-4"
          onClick={handleDownloadPDF}
          disabled={!reportReady || filtered.length === 0}
        >
          Download Report
        </button>
      </div>
      {reportReady && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading invoices...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No invoices found for the selected filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Issued</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Due</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Paid</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map(inv => (
                    <tr key={inv._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inv.invoiceNumber || inv._id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inv.clientName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inv.issueDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inv.dueDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inv.datePaid || ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          inv.status === 'Paid' ? 'bg-green-100 text-green-800' :
                          inv.status === 'Unpaid' ? 'bg-yellow-100 text-yellow-800' :
                          inv.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inv.currency || 'INR'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inv.amount?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
