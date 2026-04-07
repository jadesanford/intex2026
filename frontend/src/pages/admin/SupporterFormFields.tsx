import type { Dispatch, SetStateAction } from 'react'
import type { SupporterFormState } from '../../lib/supporterForm'
import {
  SUPPORTER_ACQUISITION_OPTIONS,
  SUPPORTER_RELATIONSHIP_OPTIONS,
  SUPPORTER_STATUS_OPTIONS,
  SUPPORTER_TYPE_OPTIONS
} from '../../lib/supporterForm'

type Props = {
  form: SupporterFormState
  setForm: Dispatch<SetStateAction<SupporterFormState>>
  isEdit?: boolean
}

export default function SupporterFormFields({ form, setForm, isEdit }: Props) {
  return (
    <div className="grid-2">
      {isEdit && (
        <p style={{ gridColumn: '1 / -1', fontSize: 13, color: 'var(--text-muted)', margin: '0 0 4px' }}>
          Timestamps such as created_at are set by the database and are not editable here.
        </p>
      )}
      <div className="form-group">
        <label>Supporter type</label>
        <select
          value={form.supporterType}
          onChange={e => setForm(p => ({ ...p, supporterType: e.target.value }))}
        >
          {SUPPORTER_TYPE_OPTIONS.map(t => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Relationship type</label>
        <select
          value={form.relationshipType}
          onChange={e => setForm(p => ({ ...p, relationshipType: e.target.value }))}
        >
          {SUPPORTER_RELATIONSHIP_OPTIONS.map(t => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Display name</label>
        <input
          value={form.displayName}
          onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
          placeholder="Name shown in communications"
        />
      </div>
      <div className="form-group">
        <label>Organization name</label>
        <input
          value={form.organizationName}
          onChange={e => setForm(p => ({ ...p, organizationName: e.target.value }))}
          placeholder="For organizations; leave blank for individuals"
        />
      </div>
      <div className="form-group">
        <label>First name</label>
        <input
          value={form.firstName}
          onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
          placeholder="Individual first name"
        />
      </div>
      <div className="form-group">
        <label>Last name</label>
        <input
          value={form.lastName}
          onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
          placeholder="Individual last name"
        />
      </div>
      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
        />
      </div>
      <div className="form-group">
        <label>Phone</label>
        <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
      </div>
      <div className="form-group">
        <label>Region</label>
        <input value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} />
      </div>
      <div className="form-group">
        <label>Country</label>
        <input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} />
      </div>
      <div className="form-group">
        <label>Status</label>
        <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
          {SUPPORTER_STATUS_OPTIONS.map(t => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Acquisition channel</label>
        <select
          value={form.acquisitionChannel}
          onChange={e => setForm(p => ({ ...p, acquisitionChannel: e.target.value }))}
        >
          {SUPPORTER_ACQUISITION_OPTIONS.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>First donation date</label>
        <input
          type="date"
          value={form.firstDonationDate}
          onChange={e => setForm(p => ({ ...p, firstDonationDate: e.target.value }))}
        />
      </div>
    </div>
  )
}
