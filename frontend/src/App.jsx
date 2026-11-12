import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/tickets';

function App() {
  const [tickets, setTickets] = useState([]);
  const [formData, setFormData] = useState({ event_name: '', holder_name: '', quantity: 1 });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error('Gagal mengambil data:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        // Mode UPDATE (PUT)
        await fetch(`${API_URL}/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        setEditingId(null);
      } else {
        // Mode CREATE (POST)
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      setFormData({ event_name: '', holder_name: '', quantity: 1 });
      fetchTickets();
    } catch (err) {
      console.error('Operasi gagal:', err);
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

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ event_name: '', holder_name: '', quantity: 1 });
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Hapus tiket #${id}?`)) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTickets();
      }
    } catch (err) {
      console.error('Gagal menghapus tiket:', err);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>Dashboard E-Ticket</h1>
      </header>

      {/* Form Input */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>{editingId ? `Edit Tiket #${editingId}` : 'Terbitkan Tiket Baru'}</h2>
          {editingId && (
            <button type="button" onClick={handleCancelEdit} style={styles.btnSecondary}>
              Batal Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} style={styles.formGrid}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nama Event / Konser</label>
            <input
              type="text"
              placeholder="Contoh: Konser Kanye West"
              value={formData.event_name}
              onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Nama Pemesan</label>
            <input
              type="text"
              placeholder="Contoh: Ijal"
              value={formData.holder_name}
              onChange={(e) => setFormData({ ...formData, holder_name: e.target.value })}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Jumlah Tiket</label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              required
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.btnPrimary,
              backgroundColor: editingId ? '#0284c7' : '#16a34a',
            }}
          >
            {loading ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Terbitkan Tiket'}
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
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Event</th>
                <th style={styles.th}>Pemesan</th>
                <th style={styles.th}>Jumlah</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan="5" style={styles.emptyState}>
                    Belum ada tiket yang terbit.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={styles.badgeId}>#{ticket.id}</span>
                    </td>
                    <td style={{ ...styles.td, fontWeight: '600' }}>{ticket.event_name}</td>
                    <td style={styles.td}>{ticket.holder_name}</td>
                    <td style={styles.td}>
                      <span style={styles.badgeQty}>{ticket.quantity} Tiket</span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <div style={styles.actionGroup}>
                        <button onClick={() => handleEdit(ticket)} style={styles.btnEdit}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(ticket.id)} style={styles.btnDelete}>
                          Hapus
                        </button>
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

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '30px auto',
    padding: '0 20px',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    color: '#1f2937',
  },
  header: {
    marginBottom: '28px',
    textAlign: 'center',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#111827',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f3f4f6',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
    color: '#1f2937',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    alignItems: 'end',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#4b5563',
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none',
  },
  btnPrimary: {
    padding: '10px 18px',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    height: '42px',
  },
  btnSecondary: {
    padding: '6px 12px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '14px',
  },
  thRow: {
    backgroundColor: '#f9fafb',
    borderBottom: '2px solid #e5e7eb',
  },
  th: {
    padding: '12px 16px',
    fontWeight: '600',
    color: '#4b5563',
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
  },
  td: {
    padding: '14px 16px',
    verticalAlign: 'middle',
  },
  emptyState: {
    textAlign: 'center',
    padding: '32px',
    color: '#9ca3af',
  },
  badgeId: {
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
  },
  badgeQty: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: '600',
  },
  actionGroup: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
  },
  btnEdit: {
    backgroundColor: '#f0f9ff',
    color: '#0284c7',
    border: '1px solid #bae6fd',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '12px',
  },
  btnDelete: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '12px',
  },
};

export default App;