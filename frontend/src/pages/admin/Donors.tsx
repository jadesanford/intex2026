import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getSupporters, createSupporter } from '../../lib/api'
import { Plus, Heart, Search } from 'lucide-react'
import SupporterFormFields from './SupporterFormFields'
import {
  defaultSupporterForm,
  formToSupporterPayload,
  canSaveSupporterForm,
  SUPPORTER_STATUS_OPTIONS,
  type SupporterFormState
} from '../../lib/supporterForm'

function formatPHP(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(0)}K`
  return `₱${n.toLocaleString()}`
}

const TYPE_BADGE: Record<string, string> = {
  MonetaryDonor: 'badge badge-green',
  InKindDonor: 'badge badge-blue',
  Volunteer: 'badge badge-purple',
  SkillsContributor: 'badge badge-orange',
  SocialMediaAdvocate: 'badge badge-yellow',
  PartnerOrganization: 'badge badge-gray'
}

type SupporterRow = {
  supporterId: number
  supporterType: string
  displayName: string
  organizationName: string
  firstName: string
  lastName: string
  relationshipType: string
  country: string
  region: string
  email: string
  phone: string
  status: string
  firstDonationDate: string
  acquisitionChannel: string
  totalMonetary: number
  donationCount: number
  lastDonationDate: string
}

export default function Donors() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<SupporterFormState>(() => defaultSupporterForm())
  const [formError, setFormError] = useState('')

  const { data: supporters, isLoading } = useQuery({
    queryKey: ['supporters', typeFilter, statusFilter],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (typeFilter) params.type = typeFilter
      if (statusFilter) params.status = statusFilter
      return getSupporters(Object.keys(params).length ? params : undefined)
    }
  })

  const closeModal = () => {
    setShowModal(false)
    setForm(defaultSupporterForm())
    setFormError('')
  }

  const openAdd = () => {
    setForm(defaultSupporterForm())
    setFormError('')
    setShowModal(true)
  }

  const create = useMutation({
    mutationFn: () => createSupporter(formToSupporterPayload(form)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supporters'] })
      closeModal()
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || 'Unable to create supporter.')
    }
  })

  const filtered = (supporters ?? []).filter((s: SupporterRow) => {
    const name = s.displayName || s.organizationName || `${s.firstName} ${s.lastName}`
    return (
      !search ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
    )
  })

  const save = () => {
    setFormError('')
    if (!canSaveSupporterForm(form)) {
      setFormError('Enter a display name, organization name, or both first and last name.')
      return
    }
    create.mutate()
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 28 }}>Donors & Supporters</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{filtered.length} supporters</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Supporter
        </button>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                paddingLeft: 36,
                width: '100%',
                padding: '8px 8px 8px 36px',
                border: '1.5px solid var(--border)',
                borderRadius: 8,
                fontSize: 14
              }}
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'white' }}
          >
            <option value="">All Types</option>
            {[
              'MonetaryDonor',
              'InKindDonor',
              'Volunteer',
              'SkillsContributor',
              'SocialMediaAdvocate',
              'PartnerOrganization'
            ].map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'white' }}
          >
            <option value="">All Status</option>
            {SUPPORTER_STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {isLoading ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Heart size={40} />
            <h3>No supporters found</h3>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Relationship</th>
                  <th>Total Given</th>
                  <th>Donations</th>
                  <th>Last Donation</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s: SupporterRow) => {
                  const name =
                    s.displayName || s.organizationName || `${s.firstName || ''} ${s.lastName || ''}`.trim()
                  return (
                    <tr key={s.supporterId}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.email || s.country}</div>
                      </td>
                      <td>
                        <span className={TYPE_BADGE[s.supporterType] || 'badge badge-gray'}>{s.supporterType}</span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.relationshipType}</td>
                      <td style={{ fontWeight: 600, color: 'var(--sage)' }}>{formatPHP(s.totalMonetary || 0)}</td>
                      <td style={{ fontSize: 13 }}>{s.donationCount}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {s.lastDonationDate?.slice(0, 10) || 'Never'}
                      </td>
                      <td>
                        <span className={`badge ${s.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>{s.status}</span>
                      </td>
                      <td>
                        <Link
                          to={`/admin/donors/${s.supporterId}`}
                          style={{ color: 'var(--terracotta)', fontSize: 13, fontWeight: 500 }}
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2>Add Supporter</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={closeModal}>
                ✕
              </button>
            </div>
            <SupporterFormFields form={form} setForm={setForm} isEdit={false} />
            {formError && (
              <div
                style={{
                  marginTop: 12,
                  background: '#fee2e2',
                  color: '#b91c1c',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 13
                }}
              >
                {formError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={closeModal}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={save}
                disabled={!canSaveSupporterForm(form) || create.isPending}
              >
                {create.isPending ? 'Saving...' : 'Add Supporter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
