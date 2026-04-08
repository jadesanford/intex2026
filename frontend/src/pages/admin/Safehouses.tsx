import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSafehouses, createSafehouse, updateSafehouse } from '../../lib/api'
import { Plus, MapPin } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CITY_COORDS: Record<string, [number, number]> = {
  'Manila': [14.5995, 120.9842], 'Quezon City': [14.6760, 121.0437], 'Makati': [14.5547, 121.0244],
  'Taguig': [14.5176, 121.0509], 'Pasig': [14.5764, 121.0851], 'Mandaluyong': [14.5794, 121.0359],
  'Caloocan': [14.6492, 120.9694], 'Valenzuela': [14.7011, 120.9830], 'Las Piñas': [14.4453, 120.9832],
  'Muntinlupa': [14.4081, 121.0415], 'Parañaque': [14.4793, 121.0198], 'Marikina': [14.6507, 121.1029],
  'Pasay': [14.5378, 121.0014], 'San Juan': [14.6019, 121.0355], 'Malabon': [14.6681, 120.9574],
  'Navotas': [14.6671, 120.9483], 'Antipolo': [14.5862, 121.1760], 'Cainta': [14.5775, 121.1252],
  'Taytay': [14.5565, 121.1326], 'Biñan': [14.3292, 121.0800], 'Calamba': [14.2116, 121.1653],
  'Santa Rosa': [14.3122, 121.1120], 'Bacoor': [14.4580, 120.9340], 'Imus': [14.4297, 120.9368],
  'Dasmariñas': [14.3294, 120.9367], 'Tagaytay': [14.1153, 120.9624], 'Lipa': [13.9411, 121.1638],
  'Batangas': [13.7565, 121.0584], 'Lucena': [13.9373, 121.6170], 'Naga': [13.6218, 123.1945],
  'Legazpi': [13.1391, 123.7437], 'Angeles': [15.1450, 120.5887], 'San Fernando': [15.0284, 120.6896],
  'Olongapo': [14.8319, 120.2846], 'Baguio': [16.4023, 120.5960], 'Dagupan': [16.0430, 120.3337],
  'Urdaneta': [15.9763, 120.5718], 'Vigan': [17.5747, 120.3869], 'Laoag': [18.1981, 120.5967],
  'Cabanatuan': [15.4848, 120.9644], 'Tarlac': [15.4822, 120.5979], 'Tuguegarao': [17.6132, 121.7270],
  'Santiago': [16.6868, 121.5497], 'Ilagan': [17.1497, 121.8894], 'Cauayan': [16.9350, 121.7726],
  'Cebu': [10.3157, 123.8854], 'Cebu City': [10.3157, 123.8854], 'Mandaue': [10.3236, 123.9223],
  'Lapu-Lapu': [10.3119, 123.9494], 'Talisay': [10.2450, 123.8484], 'Danao': [10.5221, 124.0259],
  'Iloilo': [10.7202, 122.5621], 'Iloilo City': [10.7202, 122.5621], 'Roxas': [11.5854, 122.7511],
  'Kalibo': [11.7050, 122.3639], 'Dumaguete': [9.3068, 123.3054], 'Tacloban': [11.2543, 125.0000],
  'Ormoc': [11.0060, 124.6075], 'Calbayog': [12.0673, 124.5966], 'Tagbilaran': [9.6500, 123.8575],
  'Davao': [7.1907, 125.4553], 'Davao City': [7.1907, 125.4553], 'Tagum': [7.4478, 125.8076],
  'Panabo': [7.3082, 125.6839], 'Digos': [6.7497, 125.3572], 'Mati': [6.9478, 126.2230],
  'Cotabato': [7.2236, 124.2456], 'Kidapawan': [7.0083, 125.0891],
  'General Santos': [6.1164, 125.1716], 'Koronadal': [6.5035, 124.8484],
  'Cagayan de Oro': [8.4542, 124.6319], 'Iligan': [8.2280, 124.2452],
  'Ozamiz': [8.1474, 123.8420], 'Pagadian': [7.8279, 123.4357],
  'Dipolog': [8.5870, 123.3360], 'Zamboanga': [6.9214, 122.0790],
  'Zamboanga City': [6.9214, 122.0790], 'Butuan': [8.9475, 125.5406],
  'Surigao': [9.7848, 125.4932], 'Malaybalay': [8.1575, 125.1281],
  'Valencia': [7.9062, 125.0937], 'Marawi': [7.9987, 124.2876],
}

type SafehouseType = {
  safehouseId: number; safehouseCode?: string; name: string; region: string; city: string;
  province: string; capacityGirls: number; capacityStaff: number; currentOccupancy: number;
  status: string; openDate: string; notes: string
}

export default function Safehouses() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({
    name: '', safehouseCode: '', region: 'Luzon', city: '', province: '',
    capacityGirls: '', capacityStaff: '', currentOccupancy: '0',
    status: 'Active', openDate: '', notes: ''
  })

  const { data: safehouses, isLoading } = useQuery({ queryKey: ['safehouses'], queryFn: getSafehouses })

  const create = useMutation({
    mutationFn: () => createSafehouse({
      name: form.name, safehouseCode: form.safehouseCode, region: form.region,
      city: form.city, province: form.province,
      capacityGirls: form.capacityGirls ? +form.capacityGirls : null,
      capacityStaff: form.capacityStaff ? +form.capacityStaff : null,
      currentOccupancy: form.currentOccupancy ? +form.currentOccupancy : 0,
      status: form.status, openDate: form.openDate || null, notes: form.notes
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['safehouses'] }); setShowModal(false); resetForm() }
  })

  const update = useMutation({
    mutationFn: () => updateSafehouse(editId!, {
      name: form.name, safehouseCode: form.safehouseCode, region: form.region,
      city: form.city, province: form.province,
      capacityGirls: form.capacityGirls ? +form.capacityGirls : null,
      capacityStaff: form.capacityStaff ? +form.capacityStaff : null,
      currentOccupancy: form.currentOccupancy ? +form.currentOccupancy : 0,
      status: form.status, openDate: form.openDate || null, notes: form.notes
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['safehouses'] }); setShowModal(false); setEditId(null); resetForm() }
  })

  function resetForm() {
    setForm({ name: '', safehouseCode: '', region: 'Luzon', city: '', province: '', capacityGirls: '', capacityStaff: '', currentOccupancy: '0', status: 'Active', openDate: '', notes: '' })
  }

  function openEdit(s: SafehouseType) {
    setEditId(s.safehouseId)
    setForm({
      name: s.name, safehouseCode: s.safehouseCode || '', region: s.region || 'Luzon',
      city: s.city || '', province: s.province || '',
      capacityGirls: String(s.capacityGirls || ''),
      capacityStaff: String(s.capacityStaff || ''),
      currentOccupancy: String(s.currentOccupancy || 0),
      status: s.status || 'Active', openDate: s.openDate || '', notes: s.notes || ''
    })
    setShowModal(true)
  }

  const totalCapacity = (safehouses ?? []).reduce((sum: number, s: SafehouseType) => sum + (s.capacityGirls || 0), 0)
  const totalOccupied = (safehouses ?? []).reduce((sum: number, s: SafehouseType) => sum + (s.currentOccupancy || 0), 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 28 }}>Safehouses</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            {totalOccupied} / {totalCapacity} girls across {(safehouses ?? []).length} locations
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setEditId(null); setShowModal(true) }}>
          <Plus size={16} /> Add Safehouse
        </button>
      </div>

      <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 28, height: 320, border: '1px solid var(--border)' }}>
        <MapContainer
          center={[12.0, 122.5]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {(safehouses ?? []).map((s: SafehouseType) => {
            const coords = CITY_COORDS[s.city] ?? CITY_COORDS[s.city?.split(' ')[0]]
            if (!coords) return null
            return (
              <Marker key={s.safehouseId} position={coords}>
                <Popup>
                  <strong>{s.name}</strong><br />
                  {s.city}{s.province ? `, ${s.province}` : ''}<br />
                  {s.currentOccupancy ?? 0} / {s.capacityGirls ?? 0} in care<br />
                  <span style={{ color: s.status === 'Active' ? 'green' : 'gray', fontSize: 12 }}>{s.status}</span>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

      {isLoading ? <div className="loading-center"><div className="spinner" /></div>
        : (
          <div className="grid-3">
            {(safehouses ?? []).map((s: SafehouseType) => {
              const occupancy = s.capacityGirls > 0 ? Math.round((s.currentOccupancy / s.capacityGirls) * 100) : 0
              return (
                <div key={s.safehouseId} className="card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{s.name}</div>
                      {s.safehouseCode && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: 4 }}>{s.safehouseCode}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 13 }}>
                        <MapPin size={12} /> {s.city}{s.province ? `, ${s.province}` : ''}
                      </div>
                    </div>
                    <span className={`badge ${s.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>{s.status}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 22, color: 'var(--terracotta)' }}>{s.currentOccupancy ?? 0}</div>
                      <div style={{ color: 'var(--text-muted)' }}>in care</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: 22, color: 'var(--navy)' }}>{s.capacityGirls ?? 0}</div>
                      <div style={{ color: 'var(--text-muted)' }}>capacity</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 22, color: 'var(--sage)' }}>{s.capacityStaff ?? 0}</div>
                      <div style={{ color: 'var(--text-muted)' }}>staff</div>
                    </div>
                  </div>

                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{
                      height: '100%', borderRadius: 3, transition: 'width 0.5s',
                      background: occupancy > 85 ? 'var(--danger)' : occupancy > 60 ? 'var(--warning)' : 'var(--sage)',
                      width: `${Math.min(100, occupancy)}%`
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                    {occupancy}% occupied · {s.region}
                  </div>

                  <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => openEdit(s)}>
                    Edit
                  </button>
                </div>
              )
            })}
          </div>
        )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? 'Edit Safehouse' : 'Add Safehouse'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="grid-2">
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Name *</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="form-group"><label>Code (e.g. SH-01)</label><input value={form.safehouseCode} onChange={e => setForm(p => ({ ...p, safehouseCode: e.target.value }))} placeholder="SH-01" /></div>
              <div className="form-group"><label>Region</label>
                <select value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))}>
                  {['Luzon', 'Visayas', 'Mindanao'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group"><label>City</label><input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></div>
              <div className="form-group"><label>Province</label><input value={form.province} onChange={e => setForm(p => ({ ...p, province: e.target.value }))} /></div>
              <div className="form-group"><label>Capacity (Girls)</label><input type="number" value={form.capacityGirls} onChange={e => setForm(p => ({ ...p, capacityGirls: e.target.value }))} /></div>
              <div className="form-group"><label>Capacity (Staff)</label><input type="number" value={form.capacityStaff} onChange={e => setForm(p => ({ ...p, capacityStaff: e.target.value }))} /></div>
              <div className="form-group"><label>Current Occupancy</label><input type="number" value={form.currentOccupancy} onChange={e => setForm(p => ({ ...p, currentOccupancy: e.target.value }))} /></div>
              <div className="form-group"><label>Open Date</label><input type="date" value={form.openDate} onChange={e => setForm(p => ({ ...p, openDate: e.target.value }))} /></div>
              <div className="form-group"><label>Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  {['Active', 'Inactive'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><label>Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ resize: 'vertical' }} /></div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => editId ? update.mutate() : create.mutate()}
                disabled={!form.name || create.isPending || update.isPending}>
                {(create.isPending || update.isPending) ? 'Saving...' : editId ? 'Save Changes' : 'Add Safehouse'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
