import React, { useState, useEffect } from 'react';
import { Save, Upload, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Settings = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [businessInfo, setBusinessInfo] = useState({
    type: 'individual',
    firstName: '',
    lastName: '',
    organizationName: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    taxId: '',
    currency: ''
  });

  const [invoiceSettings, setInvoiceSettings] = useState({
    invoicePrefix: '',
    nextInvoiceNumber: '',
    paymentTerms: '',
    taxRate: '',
    lateFee: '',
    invoiceNotes: '',
    emailTemplate: '',
    currency: ''
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL+'/business-settings')
      .then(res => res.json())
      .then(data => {
        // Try to get email from backend, fallback to localStorage
        let email = data.email || localStorage.getItem('registeredEmail') || '';
        setBusinessInfo({
          type: data.type || 'individual',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          organizationName: data.organizationName || '',
          companyName: data.companyName || '',
          email,
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zipCode: data.zipCode || '',
          country: data.country || '',
          taxId: data.taxId || '',
          currency: data.currency || ''
        });
        setInvoiceSettings({
          invoicePrefix: data.invoicePrefix || '',
          nextInvoiceNumber: data.nextInvoiceNumber || '',
          paymentTerms: data.paymentTerms || '',
          taxRate: data.taxRate || '',
          lateFee: data.lateFee || '',
          invoiceNotes: data.invoiceNotes || '',
          emailTemplate: data.emailTemplate || '',
          currency: data.currency || ''
        });
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...businessInfo, ...invoiceSettings };
    const res = await fetch(import.meta.env.VITE_API_URL+'/business-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      toast({ title: 'Changes saved', description: 'Business settings have been updated.' });
    } else {
      alert('Failed to save settings.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <h1 className="text-3xl font-bold text-gray-800">Business Settings</h1>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Business Information */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">Business Information</h2>
          
          <div className="space-y-4">
            {/* Toggle for Individual/Organization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <div className="flex gap-4">
                <button type="button" className={`px-4 py-2 rounded-lg border ${businessInfo.type === 'individual' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setBusinessInfo({ ...businessInfo, type: 'individual' })}>Individual</button>
                <button type="button" className={`px-4 py-2 rounded-lg border ${businessInfo.type === 'organization' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setBusinessInfo({ ...businessInfo, type: 'organization' })}>Organization</button>
              </div>
            </div>
            {/* Fields for Individual */}
            {businessInfo.type === 'individual' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={businessInfo.firstName} onChange={e => setBusinessInfo({ ...businessInfo, firstName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={businessInfo.lastName} onChange={e => setBusinessInfo({ ...businessInfo, lastName: e.target.value })} />
                </div>
              </div>
            )}
            {/* Fields for Organization */}
            {businessInfo.type === 'organization' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={businessInfo.organizationName} onChange={e => setBusinessInfo({ ...businessInfo, organizationName: e.target.value })} />
              </div>
            )}
            {/* Email and Address fields (common) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={businessInfo.email} onChange={e => setBusinessInfo({ ...businessInfo, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={businessInfo.address} onChange={e => setBusinessInfo({ ...businessInfo, address: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={businessInfo.city}
                  onChange={(e) => setBusinessInfo({...businessInfo, city: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={businessInfo.state}
                  onChange={(e) => setBusinessInfo({...businessInfo, state: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={businessInfo.zipCode}
                  onChange={(e) => setBusinessInfo({...businessInfo, zipCode: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={businessInfo.taxId}
                  onChange={(e) => setBusinessInfo({...businessInfo, taxId: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={businessInfo.currency}
                onChange={e => setBusinessInfo({ ...businessInfo, currency: e.target.value })}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoice Settings */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">Invoice Settings</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={invoiceSettings.invoicePrefix}
                  onChange={(e) => setInvoiceSettings({...invoiceSettings, invoicePrefix: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Invoice Number</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={invoiceSettings.nextInvoiceNumber}
                  onChange={(e) => setInvoiceSettings({...invoiceSettings, nextInvoiceNumber: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms (days)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={invoiceSettings.paymentTerms}
                  onChange={(e) => setInvoiceSettings({...invoiceSettings, paymentTerms: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={invoiceSettings.taxRate}
                  onChange={(e) => setInvoiceSettings({...invoiceSettings, taxRate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Late Fee (%)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={invoiceSettings.lateFee}
                  onChange={(e) => setInvoiceSettings({...invoiceSettings, lateFee: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={invoiceSettings.currency}
                onChange={e => setInvoiceSettings({ ...invoiceSettings, currency: e.target.value })}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Invoice Notes</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={invoiceSettings.invoiceNotes}
                onChange={(e) => setInvoiceSettings({...invoiceSettings, invoiceNotes: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Template</label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={invoiceSettings.emailTemplate}
                onChange={(e) => setInvoiceSettings({...invoiceSettings, emailTemplate: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
