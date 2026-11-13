import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  // === STATE AUTENTIKASI ===
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [authMode, setAuthMode] = useState('login'); // 'login' atau 'register'
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // === STATE DASHBOARD ===
  const [tickets, setTickets] = useState([]);
  const [formData, setFormData] = useState({ event_name: '', holder_name: '', quantity: 1 });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // === EFEK DASHBOARD ===
  useEffect(() => {
    if (token) {
      fetchTickets();
    }
  }, [token]);

  // === FUNGSI AUTENTIKASI ===
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'register') {
        const res = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(authForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Registrasi gagal');
        
        alert('Registrasi berhasil! Silakan login.');
        setAuthMode('login');
      } else {
        // Form URL Encoded dibutuhkan oleh FastAPI OAuth2PasswordRequestForm
        const urlEncodedData = new URLSearchParams();
        urlEncodedData.append('username', authForm.username);
        urlEncodedData.append('password', authForm.password);

        const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: urlEncodedData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Login gagal');

        setToken(data.access_token);
        localStorage.setItem('token', data.access_token);
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setTickets([]);
  };

  // === FUNGSI DASHBOARD (DENGAN AUTHORIZATION HEADER) ===
  const fetchAuth = async (endpoint, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    if (res.status === 401) {
      handleLogout(); // Token expired/invalid
      throw new Error('Sesi berakhir. Silakan login kembali.');
    }
    return res;
  };

  const fetchTickets = async () => {
    try {
      const res = await fetchAuth('/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await fetchAuth(`/tickets/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        setEditingId(null);
      } else {
        await fetchAuth('/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      setFormData({ event_name: '', holder_name: '', quantity: 1 });
      fetchTickets();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ticket) => {
    setEditingId(ticket.id);
    setFormData({
      event_name: ticket.event_name,
      holder_name: ticket.holder_name,
      quantity: ticket.quantity,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Hapus tiket #${id}?`)) return;
    try {
      const res = await fetchAuth(`/tickets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTickets();
      } else if (res.status === 403) {
        const data = await res.json();
        alert(data.detail); // Menampilkan pesan error RBAC (bukan admin)
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  // === RENDER TAMPILAN AUTENTIKASI ===
  if (!token) {
    return (
      <div style={styles.authWrapper}>
        <div style={styles.authCard}>
          <div style={styles.authHeader}>
            <h1 style={styles.authTitle}>E-Ticket Portal</h1>
            <p style={styles.authSubtitle}>
              {authMode === 'login' ? 'Masuk ke akun Anda' : 'Buat akun baru'}
            </p>
          </div>

          {authError && <div style={styles.errorBox}>{authError}</div>}

          <form onSubmit={handleAuthSubmit} style={styles.authForm}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                required
                style={styles.input}
                placeholder="Masukkan username"
                value={authForm.username}
                onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                required
                style={styles.input}
                placeholder="Masukkan password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              />
            </div>
            <button type="submit" style={styles.authButton} disabled={authLoading}>
              {authLoading ? 'Memproses...' : (authMode === 'login' ? 'Login' : 'Daftar')}
            </button>
          </form>

          <p style={styles.authToggleText}>
            {authMode === 'login' ? "Belum punya akun? " : "Sudah punya akun? "}
            <span 
              style={styles.authToggleLink} 
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthError('');
              }}
            >
              {authMode === 'login' ? 'Daftar di sini' : 'Login di sini'}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // === RENDER TAMPILAN DASHBOARD ===
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard E-Ticket</h1>
          <p style={styles.subtitle}>Kelola inventaris dan pemesanan tiket acara</p>
        </div>
        <button onClick={handleLogout} style={styles.btnLogout}>Logout</button>
      </header>

      {/* Form Input (Sama seperti sebelumnya) */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>{editingId ? `Edit Tiket #${editingId}` : 'Terbitkan Tiket Baru'}</h2>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setFormData({ event_name: '', holder_name: '', quantity: 1 }); }} style={styles.btnSecondary}>
              Batal Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} style={styles.formGrid}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nama Event</label>
            <input type="text" placeholder="Contoh: Java Jazz" value={formData.event_name} onChange={(e) => setFormData({ ...formData, event_name: e.target.value })} required style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Pemesan</label>
            <input type="text" placeholder="Contoh: Budi Santoso" value={formData.holder_name} onChange={(e) => setFormData({ ...formData, holder_name: e.target.value })} required style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Jumlah</label>
            <input type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })} required style={styles.input} />
          </div>
          <button type="submit" disabled={loading} style={{ ...styles.btnPrimary, backgroundColor: editingId ? '#0284c7' : '#16a34a' }}>
            {loading ? 'Menyimpan...' : editingId ? 'Update Tiket' : 'Terbitkan'}
          </button>
        </form>
      </div>

      {/* Tabel Tiket */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Daftar Tiket Terbit ({tickets.length})</h2>
        <div style={{ overflowX: 'auto', marginTop: '16px' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Kode Tiket</th>
                <th style={styles.th}>Event</th>
                <th style={styles.th}>Pemesan</th>
                <th style={styles.th}>Jumlah</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr><td colSpan="5" style={styles.emptyState}>Belum ada tiket yang terbit.</td></tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <span style={styles.badgeCode}>{ticket.ticket_code}</span>
                        <span style={styles.textSmall}>ID: #{ticket.id}</span>
                      </div>
                    </td>
                    <td style={{ ...styles.td, fontWeight: '600' }}>{ticket.event_name}</td>
                    <td style={styles.td}>{ticket.holder_name}</td>
                    <td style={styles.td}>
                      <span style={styles.badgeQty}>{ticket.quantity} Tiket</span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <div style={styles.actionGroup}>
                        <button onClick={() => handleEdit(ticket)} style={styles.btnEdit}>Edit</button>
                        <button onClick={() => handleDelete(ticket.id)} style={styles.btnDelete}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// === STYLING ===
const styles = {
  // Styles Khusus Auth Screen
  authWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  authCard: {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
    width: '100%',
    maxWidth: '400px',
  },
  authHeader: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  authTitle: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#111827',
    margin: '0 0 8px 0',
  },
  authSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  authForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  authButton: {
    padding: '12px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'background-color 0.2s',
  },
  authToggleText: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '24px',
  },
  authToggleLink: {
    color: '#0284c7',
    fontWeight: '600',
    cursor: 'pointer',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '16px',
    border: '1px solid #fecaca',
    textAlign: 'center',
  },

  // Styles Dashboard (Sama dengan sebelumnya + penambahan kecil)
  container: { maxWidth: '1000px', margin: '30px auto', padding: '0 20px', fontFamily: 'Inter, system-ui, sans-serif', color: '#1f2937' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' },
  title: { fontSize: '28px', fontWeight: '800', color: '#111827', margin: '0 0 6px 0' },
  subtitle: { fontSize: '14px', color: '#6b7280', margin: 0 },
  btnLogout: { padding: '8px 16px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', color: '#374151' },
  card: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  cardTitle: { fontSize: '18px', fontWeight: '700', margin: 0, color: '#1f2937' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#4b5563' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' },
  btnPrimary: { padding: '10px 18px', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', height: '42px' },
  btnSecondary: { padding: '6px 12px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  thRow: { backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' },
  th: { padding: '12px 16px', fontWeight: '600', color: '#4b5563' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '14px 16px', verticalAlign: 'middle' },
  emptyState: { textAlign: 'center', padding: '32px', color: '#9ca3af' },
  badgeCode: { backgroundColor: '#f0fdfa', color: '#0f766e', padding: '4px 8px', borderRadius: '6px', fontSize: '13px', fontWeight: '700', border: '1px solid #ccfbf1', display: 'inline-block' },
  textSmall: { fontSize: '11px', color: '#9ca3af' },
  badgeQty: { backgroundColor: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600' },
  actionGroup: { display: 'flex', gap: '8px', justifyContent: 'center' },
  btnEdit: { backgroundColor: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' },
  btnDelete: { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' },
};

export default App;