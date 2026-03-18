import { useState } from 'react';
import { Save, Bell, Shield, Globe, Palette, Database } from 'lucide-react';

export default function Settings() {
  const [siteName, setSiteName] = useState('TurfZone');
  const [supportEmail, setSupportEmail] = useState('support@turfzone.com');
  const [currency, setCurrency] = useState('INR');
  const [bookingBuffer, setBookingBuffer] = useState('30');
  const [notifications, setNotifications] = useState({ email: true, sms: false, push: true });

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h2 className="text-white font-display font-bold text-xl">Settings</h2>
        <p className="text-white/40 text-sm">Manage your platform configuration</p>
      </div>

      {/* General Settings */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-white/5">
          <div className="w-9 h-9 bg-primary-500/15 rounded-xl flex items-center justify-center">
            <Globe size={16} className="text-primary-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">General Settings</h3>
            <p className="text-white/40 text-xs">Basic platform configuration</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-white/50 text-xs font-medium uppercase tracking-wider block mb-2">Platform Name</label>
            <input className="input" value={siteName} onChange={e => setSiteName(e.target.value)} />
          </div>
          <div>
            <label className="text-white/50 text-xs font-medium uppercase tracking-wider block mb-2">Support Email</label>
            <input className="input" type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-white/50 text-xs font-medium uppercase tracking-wider block mb-2">Currency</label>
            <select className="input" value={currency} onChange={e => setCurrency(e.target.value)}>
              <option style={{ background: '#131c2e' }} value="INR">INR (₹)</option>
              <option style={{ background: '#131c2e' }} value="USD">USD ($)</option>
            </select>
          </div>
          <div>
            <label className="text-white/50 text-xs font-medium uppercase tracking-wider block mb-2">Booking Buffer (mins)</label>
            <input className="input" type="number" value={bookingBuffer} onChange={e => setBookingBuffer(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-white/5">
          <div className="w-9 h-9 bg-blue-500/15 rounded-xl flex items-center justify-center">
            <Bell size={16} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Notifications</h3>
            <p className="text-white/40 text-xs">Configure notification channels</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { key: 'email', label: 'Email Notifications', desc: 'Send booking confirmations via email' },
            { key: 'sms', label: 'SMS Notifications', desc: 'Send SMS alerts for bookings' },
            { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications' },
          ].map(n => (
            <div key={n.key} className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium text-sm">{n.label}</p>
                <p className="text-white/40 text-xs">{n.desc}</p>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key] }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${notifications[n.key] ? 'bg-primary-500' : 'bg-white/10'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${notifications[n.key] ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`}></span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-white/5">
          <div className="w-9 h-9 bg-red-500/15 rounded-xl flex items-center justify-center">
            <Shield size={16} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Security</h3>
            <p className="text-white/40 text-xs">Admin account security settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-white/50 text-xs font-medium uppercase tracking-wider block mb-2">Current Password</label>
            <input className="input" type="password" placeholder="••••••••" />
          </div>
          <div>
            <label className="text-white/50 text-xs font-medium uppercase tracking-wider block mb-2">New Password</label>
            <input className="input" type="password" placeholder="••••••••" />
          </div>
        </div>
        <button className="btn-ghost text-sm">Update Password</button>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button className="btn-primary px-6">
          <Save size={16} />
          Save All Changes
        </button>
      </div>
    </div>
  );
}
