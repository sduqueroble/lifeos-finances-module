import type { Category, CategoryId, TxType } from './types'

export const CATEGORIES: Category[] = [
  { id: 'housing', label: 'Housing', kind: 'expense', color: '#E2B87A' },
  { id: 'groceries', label: 'Groceries', kind: 'expense', color: '#8FC4A0' },
  { id: 'dining', label: 'Dining out', kind: 'expense', color: '#D49DB0' },
  { id: 'transport', label: 'Transport', kind: 'expense', color: '#7FA6D9' },
  { id: 'utilities', label: 'Utilities', kind: 'expense', color: '#6B8BAA' },
  { id: 'health', label: 'Health', kind: 'expense', color: '#46C7B7' },
  { id: 'subscriptions', label: 'Subscriptions', kind: 'expense', color: '#A7A2DA' },
  { id: 'education', label: 'Education', kind: 'expense', color: '#9FC1DF' },
  { id: 'leisure', label: 'Leisure', kind: 'expense', color: '#C9A27E' },
  { id: 'shopping', label: 'Shopping', kind: 'expense', color: '#B892C0' },
  { id: 'gifts', label: 'Gifts', kind: 'expense', color: '#D8A48F' },
  { id: 'salary', label: 'Salary', kind: 'income', color: '#46C7B7' },
  { id: 'freelance', label: 'Freelance', kind: 'income', color: '#7FD6CA' },
  { id: 'interest', label: 'Interest', kind: 'income', color: '#8FC4A0' },
  { id: 'other-income', label: 'Other income', kind: 'income', color: '#94A8BC' },
  { id: 'transfer', label: 'Transfer', kind: 'transfer', color: '#7D92A8' },
]

const BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, Category>

export const category = (id: CategoryId) => BY_ID[id]

export const categoriesFor = (type: TxType) => CATEGORIES.filter((c) => c.kind === type)

export const EXPENSE_CATEGORIES = categoriesFor('expense')
