import { useState, useEffect } from 'react';

function App() {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ event_name: '', holder_name: '', quantity: 1 });

  const API_URL = 'http://localhost:8000/tickets';

  const fetchTickets = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      console.error("Gagal mengambil data tiket:", err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ event_name: '', holder_name: '', quantity: 1 });
    fetchTickets();
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Pemesanan E-Ticket</h1>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
        <input
          type="text"
          placeholder="Nama Acara (Event)"
          value={form.event_name}
          onChange={(e) => setForm({ ...form, event_name: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Nama Pemesan"
          value={form.holder_name}
          onChange={(e) => setForm({ ...form, holder_name: e.target.value })}
          required
        />
        <input
          type="number"
          min="1"
          placeholder="Jumlah Tiket"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })}
          required
        />
        <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>Pesan Tiket</button>
      </form>

      <h2>Daftar Tiket Terbit</h2>
      <ul>
        {tickets.map((t) => (
          <li key={t.id} style={{ marginBottom: '8px' }}>
            <strong>{t.event_name}</strong> - Pemesan: {t.holder_name} ({t.quantity} tiket) [ID: #{t.id}]
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;