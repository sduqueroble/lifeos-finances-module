export type AccountKind = 'checking' | 'savings' | 'credit' | 'wallet' | 'cash' | 'investment'

export const ACCOUNT_KIND_LABEL: Record<AccountKind, string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit: 'Credit card',
  wallet: 'Digital wallet',
  cash: 'Cash',
  investment: 'Investments',
}

export const ACCOUNT_TONES = ['#46C7B7', '#7FA6D9', '#E2B87A', '#A7A2DA', '#8FC4A0', '#D49DB0', '#94A8BC'] as const

export interface Account {
  id: string
  name: string
  institution: string
  kind: AccountKind
  /** Balance before the first recorded transaction. Current balance is derived from it. Negative for money owed. */
  openingBalance: number
  creditLimit?: number
  last4?: string
  tone: string
  archived?: boolean
}

export type TxType = 'income' | 'expense' | 'transfer'

export type CategoryId =
  | 'housing'
  | 'groceries'
  | 'dining'
  | 'transport'
  | 'utilities'
  | 'health'
  | 'subscriptions'
  | 'education'
  | 'leisure'
  | 'shopping'
  | 'gifts'
  | 'salary'
  | 'freelance'
  | 'interest'
  | 'other-income'
  | 'transfer'

export interface Category {
  id: CategoryId
  label: string
  kind: TxType
  color: string
}

export interface Transaction {
  id: string
  date: number
  description: string
  /** Always positive. Direction comes from `type`. */
  amount: number
  type: TxType
  category: CategoryId
  accountId: string
  /** Destination account for transfers. */
  toAccountId?: string
  note?: string
  recurringId?: string
}

export interface Budget {
  id: string
  category: CategoryId
  /** Monthly limit. */
  limit: number
}

export type Frequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
}

export interface Recurring {
  id: string
  name: string
  amount: number
  category: CategoryId
  accountId: string
  frequency: Frequency
  nextDate: number
  kind: 'subscription' | 'bill'
  paused?: boolean
}

export interface FinanceData {
  accounts: Account[]
  transactions: Transaction[]
  budgets: Budget[]
  recurring: Recurring[]
}

export type FinanceScenario = 'populated' | 'sparse' | 'empty' | 'loading'
