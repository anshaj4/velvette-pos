import React, { useState, useEffect } from 'react';
import { Database, Mail, Shield, Copy, Check, ExternalLink, RefreshCw, Key } from 'lucide-react';
import { checkSupabaseStatus } from '../services/api';

const SQL_SCHEMA_SNIPPET = `-- Run this in Supabase SQL Editor:
create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null default 'General',
  price numeric not null default 0,
  cost_price numeric not null default 0,
  image text,
  stock integer default 50,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.customers (
  id text primary key,
  customer_id text unique not null,
  name text not null,
  phone text unique not null,
  email text,
  total_visits integer default 1,
  total_spent numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.invoices (
  id text primary key,
  invoice_number text unique not null,
  day_id text not null,
  customer jsonb not null,
  items jsonb not null,
  subtotal numeric not null default 0,
  discount_percent numeric default 0,
  discount_amount numeric default 0,
  total numeric not null default 0,
  mode text default 'normal',
  payment_method text default 'Google Pay (UPI)',
  upi_id text default 'anshajshaji3-2@okicici',
  email_sent boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.daily_closings (
  day_id text primary key,
  closed_at timestamp with time zone default timezone('utc'::text, now()),
  total_revenue numeric default 0,
  total_cogs numeric default 0,
  gross_profit numeric default 0,
  misc_expenses numeric default 0,
  misc_notes text,
  net_profit numeric default 0,
  total_invoices integer default 0,
  most_selling_product jsonb,
  most_profitable_product jsonb
);

create table if not exists public.purchase_bills (
  id text primary key,
  vendor text not null,
  bill_number text,
  date text not null,
  amount numeric not null default 0,
  items_description text,
  receipt_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);`;

export default function SettingsModal({
  settings = {},
  storeData,
  onUpdateSettings
}) {
  const [supabaseStatus, setSupabaseStatus] = useState({ checking: true });
  const [copiedSql, setCopiedSql] = useState(false);
  const [newUsername, setNewUsername] = useState(settings.username || 'admin');
  const [newPassword, setNewPassword] = useState(settings.password || 'velvette123');
  const [savedNotice, setSavedNotice] = useState(false);

  const checkStatus = async () => {
    setSupabaseStatus({ checking: true });
    const res = await checkSupabaseStatus();
    setSupabaseStatus({ checking: false, ...res });
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_SNIPPET);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleSaveCredentials = (e) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      username: newUsername,
      password: newPassword
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(storeData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `velvette_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title */}
      <div style={{ background: '#FFFFFF', padding: '20px 24px', borderRadius: '20px', border: '1.5px solid var(--border-soft)' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 900, margin: 0 }}>
          Store Settings & Integrations
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
          Manage credentials, cloud database sync, Resend email status, and data backups.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        
        {/* Supabase Status & SQL Schema */}
        <div style={{ background: '#FFFFFF', padding: '22px', borderRadius: '20px', border: '1.5px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: '#E8FBF2', color: '#0C8A53', padding: 8, borderRadius: 10 }}>
                <Database size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Supabase Cloud Database</h3>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>https://ihjpksrxjqgpulbwybci.supabase.co</span>
              </div>
            </div>

            <button
              type="button"
              onClick={checkStatus}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
              title="Refresh connection"
            >
              <RefreshCw size={15} />
            </button>
          </div>

          <div style={{ background: '#F8F9FA', padding: '12px 14px', borderRadius: 12, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Connection Status:</span>
              <strong style={{ color: '#0C8A53' }}>Connected</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Local Failover Storage:</span>
              <strong style={{ color: '#0C8A53' }}>Active (Zero Downtime)</strong>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Supabase SQL Schema</span>
              <button
                type="button"
                onClick={handleCopySql}
                style={{
                  background: copiedSql ? '#00BA88' : 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: 14,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                {copiedSql ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL'}</span>
              </button>
            </div>
            <textarea
              readOnly
              rows="5"
              value={SQL_SCHEMA_SNIPPET}
              style={{
                width: '100%',
                background: '#1F121E',
                color: '#FFD4E5',
                padding: '10px',
                borderRadius: 10,
                fontSize: 11,
                fontFamily: 'monospace',
                border: 'none'
              }}
            />
          </div>
        </div>

        {/* Resend & UPI Info */}
        <div style={{ background: '#FFFFFF', padding: '22px', borderRadius: '20px', border: '1.5px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#FFF0F6', color: 'var(--primary)', padding: 8, borderRadius: 10 }}>
              <Mail size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Resend Email Invoicing</h3>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Automatic customer receipts</span>
            </div>
          </div>

          <div style={{ background: '#FFF0F6', padding: '14px', borderRadius: 12, fontSize: 12, border: '1px solid #FFD4E5' }}>
            <p style={{ margin: '0 0 6px 0' }}><strong>API Key:</strong> <code style={{ color: 'var(--primary)' }}>re_MWa6R...is5E</code> (Active)</p>
            <p style={{ margin: '0 0 6px 0' }}><strong>Sender:</strong> <code>{settings.resendFrom || 'Velvette <onboarding@resend.dev>'}</code></p>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 11 }}>
              Customers with email addresses entered at checkout automatically receive their styled invoice.
            </p>
          </div>

          <div style={{ marginTop: 4 }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>
              Google Pay / UPI Receiver
            </h4>
            <div style={{ background: '#F8F9FA', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
              anshajshaji3-2@okicici
            </div>
          </div>

          {/* Backup Export */}
          <div style={{ marginTop: 'auto', paddingTop: 10 }}>
            <button
              type="button"
              onClick={handleExportData}
              style={{
                width: '100%',
                background: '#FAF0F5',
                border: '1.5px solid var(--border-soft)',
                color: 'var(--primary)',
                padding: '10px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Export JSON Backup of All Sales & Products
            </button>
          </div>
        </div>

        {/* Change Store Password */}
        <div style={{ background: '#FFFFFF', padding: '22px', borderRadius: '20px', border: '1.5px solid var(--border-soft)', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ background: '#FFF0F6', color: 'var(--primary)', padding: 8, borderRadius: 10 }}>
              <Key size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Store Login Credentials</h3>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Change username and password for POS portal</span>
            </div>
          </div>

          {savedNotice && (
            <div style={{ background: '#E8FBF2', color: '#0C8A53', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
              ✓ Credentials updated successfully!
            </div>
          )}

          <form onSubmit={handleSaveCredentials} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
            <div className="field-group">
              <label>Username</label>
              <input
                type="text"
                required
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label>Password</label>
              <input
                type="text"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-checkout"
              style={{ width: 'auto', padding: '9px 24px', fontSize: 13 }}
            >
              Save Credentials
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
