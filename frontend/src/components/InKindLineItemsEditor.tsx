import { Plus, Trash2 } from 'lucide-react'
import {
  emptyInKindLine,
  IN_KIND_CATEGORIES,
  IN_KIND_CONDITIONS,
  IN_KIND_UNITS,
  IN_KIND_USES,
  type InKindLineForm
} from '../lib/inKindDonationItems'

export type InKindLineItemsLabels = {
  sectionTitle: string
  addItem: string
  itemN: (n: number) => string
  removeItemAria: string
  itemName: string
  itemNamePlaceholder: string
  category: string
  quantity: string
  unitOfMeasure: string
  estimatedUnitValue: string
  intendedUse: string
  receivedCondition: string
}

const defaultLabels: InKindLineItemsLabels = {
  sectionTitle: 'In-kind line items',
  addItem: 'Add item',
  itemN: n => `Item ${n}`,
  removeItemAria: 'Remove line item',
  itemName: 'Item name',
  itemNamePlaceholder: 'Description',
  category: 'Category',
  quantity: 'Quantity',
  unitOfMeasure: 'Unit of measure',
  estimatedUnitValue: 'Estimated unit value (₱)',
  intendedUse: 'Intended use',
  receivedCondition: 'Received condition'
}

type Props = {
  items: InKindLineForm[]
  onChange: (items: InKindLineForm[]) => void
  labels?: Partial<InKindLineItemsLabels>
  maxHeight?: number
}

export default function InKindLineItemsEditor({
  items,
  onChange,
  labels: labelOverrides,
  maxHeight = 360
}: Props) {
  const L = { ...defaultLabels, ...labelOverrides }

  const updateLine = (lineKey: string, patch: Partial<InKindLineForm>) => {
    onChange(items.map(row => (row.lineKey === lineKey ? { ...row, ...patch } : row)))
  }

  const addLine = () => onChange([...items, emptyInKindLine()])

  const removeLine = (lineKey: string) => {
    onChange(items.length <= 1 ? [emptyInKindLine()] : items.filter(r => r.lineKey !== lineKey))
  }

  return (
    <div style={{ marginTop: 8, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <label style={{ fontWeight: 600, margin: 0 }}>{L.sectionTitle}</label>
        <button type="button" className="btn btn-ghost btn-sm" onClick={addLine}>
          <Plus size={14} style={{ marginRight: 4 }} /> {L.addItem}
        </button>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxHeight,
          overflowY: 'auto',
          paddingRight: 4
        }}
      >
        {items.map((line, idx) => (
          <div
            key={line.lineKey}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 12,
              background: '#fafafa'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
                {L.itemN(idx + 1)}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => removeLine(line.lineKey)}
                aria-label={L.removeItemAria}
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="grid-2" style={{ gap: 10 }}>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label>{L.itemName}</label>
                <input
                  value={line.itemName}
                  onChange={e => updateLine(line.lineKey, { itemName: e.target.value })}
                  placeholder={L.itemNamePlaceholder}
                />
              </div>
              <div className="form-group">
                <label>{L.category}</label>
                <select
                  value={line.itemCategory}
                  onChange={e => updateLine(line.lineKey, { itemCategory: e.target.value })}
                >
                  {IN_KIND_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{L.quantity}</label>
                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={e => updateLine(line.lineKey, { quantity: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>{L.unitOfMeasure}</label>
                <select
                  value={line.unitOfMeasure}
                  onChange={e => updateLine(line.lineKey, { unitOfMeasure: e.target.value })}
                >
                  {IN_KIND_UNITS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{L.estimatedUnitValue}</label>
                <input
                  type="number"
                  step="any"
                  value={line.estimatedUnitValue}
                  onChange={e => updateLine(line.lineKey, { estimatedUnitValue: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>{L.intendedUse}</label>
                <select
                  value={line.intendedUse}
                  onChange={e => updateLine(line.lineKey, { intendedUse: e.target.value })}
                >
                  {IN_KIND_USES.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{L.receivedCondition}</label>
                <select
                  value={line.receivedCondition}
                  onChange={e => updateLine(line.lineKey, { receivedCondition: e.target.value })}
                >
                  {IN_KIND_CONDITIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
