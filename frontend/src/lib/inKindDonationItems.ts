export const IN_KIND_CATEGORIES = [
  'Food', 'Supplies', 'Clothing', 'SchoolMaterials', 'Hygiene', 'Furniture', 'Medical'
] as const

export const IN_KIND_UNITS = ['pcs', 'boxes', 'kg', 'sets', 'packs'] as const

export const IN_KIND_USES = ['Meals', 'Education', 'Shelter', 'Hygiene', 'Health'] as const

export const IN_KIND_CONDITIONS = ['New', 'Good', 'Fair'] as const

export type InKindLineForm = {
  lineKey: string
  itemName: string
  itemCategory: string
  quantity: string
  unitOfMeasure: string
  estimatedUnitValue: string
  intendedUse: string
  receivedCondition: string
}

function newLineKey() {
  return `lk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function emptyInKindLine(): InKindLineForm {
  return {
    lineKey: newLineKey(),
    itemName: '',
    itemCategory: 'Food',
    quantity: '1',
    unitOfMeasure: 'pcs',
    estimatedUnitValue: '',
    intendedUse: 'Meals',
    receivedCondition: 'New'
  }
}

export function donationTypeIsInKind(t?: string | null) {
  if (!t) return false
  return t.replace(/[\s_-]/g, '').toLowerCase() === 'inkind'
}

export function inKindLinesToPayload(lines: InKindLineForm[]) {
  return lines.filter(isInKindLineComplete).map(l => ({
    itemName: l.itemName.trim(),
    itemCategory: l.itemCategory,
    quantity: Number(l.quantity),
    unitOfMeasure: l.unitOfMeasure,
    estimatedUnitValue: Number(l.estimatedUnitValue),
    intendedUse: l.intendedUse,
    receivedCondition: l.receivedCondition
  }))
}

export function isInKindLineComplete(l: InKindLineForm): boolean {
  if (!l.itemName.trim()) return false
  if (!l.itemCategory) return false
  const q = Number(l.quantity)
  if (!Number.isFinite(q) || q < 1) return false
  if (!l.unitOfMeasure) return false
  if (l.estimatedUnitValue.trim() === '' || !Number.isFinite(Number(l.estimatedUnitValue))) return false
  if (!l.intendedUse) return false
  if (!l.receivedCondition) return false
  return true
}

export function computeInKindLineSum(lines: InKindLineForm[]): number {
  return lines.filter(isInKindLineComplete).reduce((sum, l) => {
    return sum + Number(l.quantity) * Number(l.estimatedUnitValue)
  }, 0)
}

/** Map API inKindItems array into form lines (from getDonation). */
export function inKindApiToFormLines(raw: unknown): InKindLineForm[] {
  if (!Array.isArray(raw) || raw.length === 0) return [emptyInKindLine()]
  return raw.map((row): InKindLineForm => {
    const o = row as Record<string, unknown>
    const str = (v: unknown) => (v == null ? '' : String(v))
    const num = (v: unknown) => (v == null || v === '' ? '' : String(v))
    return {
      lineKey: newLineKey(),
      itemName: str(o.itemName ?? o.item_name),
      itemCategory: str(o.itemCategory ?? o.item_category) || 'Food',
      quantity: num(o.quantity) || '1',
      unitOfMeasure: str(o.unitOfMeasure ?? o.unit_of_measure) || 'pcs',
      estimatedUnitValue: num(o.estimatedUnitValue ?? o.estimated_unit_value),
      intendedUse: str(o.intendedUse ?? o.intended_use) || 'Meals',
      receivedCondition: str(o.receivedCondition ?? o.received_condition) || 'New'
    }
  })
}
