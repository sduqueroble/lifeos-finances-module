import { DAY, HOUR } from '@/lib/today/time'
import { addMonths, daysInMonth, startOfDay, startOfMonth } from './format'
import { effectOn } from './selectors'
import type {
  Account,
  Budget,
  CategoryId,
  FinanceData,
  FinanceScenario,
  Frequency,
  Recurring,
  Transaction,
  TxType,
} from './types'

function seeded(seed: number) {
  let t = seed
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

type Draft = Omit<Transaction, 'id'>

/** Opening balances are solved so each account lands on a realistic present-day balance. */
function finalize(accounts: (Omit<Account, 'openingBalance'> & { target: number })[], drafts: Draft[]) {
  const transactions = drafts
    .sort((a, b) => b.date - a.date)
    .map((t, i) => ({ ...t, id: `tx-${i}` }))
  const out: Account[] = accounts.map(({ target, ...a }) => {
    const delta = transactions.reduce((s, tx) => s + effectOn(tx, a.id), 0)
    return { ...a, openingBalance: target - delta }
  })
  return { accounts: out, transactions }
}

function nextMonthly(now: number, day: number) {
  const thisMonth = startOfMonth(now)
  const today = new Date(now).getDate()
  const base = day > today ? thisMonth : startOfMonth(now, 1)
  return base + (Math.min(day, daysInMonth(base)) - 1) * DAY + 9 * HOUR
}

function buildPopulated(now: number): FinanceData {
  const rand = seeded(20261020)
  const between = (min: number, max: number, step = 100) => Math.round((min + rand() * (max - min)) / step) * step
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)]
  const drafts: Draft[] = []

  const add = (date: number, description: string, amount: number, type: TxType, category: CategoryId, accountId: string, extra: Partial<Draft> = {}) => {
    if (date > now) return
    drafts.push({ date, description, amount, type, category, accountId, ...extra })
  }

  for (let offset = -5; offset <= 0; offset++) {
    const monthStart = startOfMonth(now, offset)
    const length = daysInMonth(monthStart)
    const at = (d: number, h = 9, m = 0) => monthStart + (d - 1) * DAY + h * HOUR + m * 60_000
    const current = offset === 0

    add(at(1, 8), 'Arriendo · Laureles', 2_850_000, 'expense', 'housing', 'bancolombia', { recurringId: 'rent' })
    add(at(2, 10), 'Nequi top-up', 300_000, 'transfer', 'transfer', 'bancolombia', { toAccountId: 'nequi' })
    add(at(3, 7), 'Bodytech', 199_900, 'expense', 'health', 'davivienda', { recurringId: 'gym' })
    add(at(4, 13), 'ATM withdrawal', 200_000, 'transfer', 'transfer', 'bancolombia', { toAccountId: 'cash' })
    add(at(5, 6), 'Netflix', 44_900, 'expense', 'subscriptions', 'davivienda', { recurringId: 'netflix' })
    add(at(8, 11), 'EPM · Energía y agua', between(248_000, 312_000), 'expense', 'utilities', 'bancolombia', { recurringId: 'epm' })
    add(at(9, 6), 'Spotify', 16_900, 'expense', 'subscriptions', 'davivienda', { recurringId: 'spotify' })
    add(at(10, 9), 'Sura · Medicina prepagada', 389_000, 'expense', 'health', 'bancolombia', { recurringId: 'sura' })
    add(at(12, 9), 'Claro Hogar · Fibra', 115_900, 'expense', 'utilities', 'bancolombia', { recurringId: 'claro' })
    add(at(15, 9), 'Quincena · Ritmo Labs', 4_950_000, 'income', 'salary', 'bancolombia')
    add(at(16, 10), 'Monthly saving', 1_500_000, 'transfer', 'transfer', 'bancolombia', { toAccountId: 'nu', note: 'Into the Cajita' })
    add(at(17, 6), 'iCloud+', 11_900, 'expense', 'subscriptions', 'davivienda', { recurringId: 'icloud' })
    add(at(18, 12), 'Card payment · Davivienda', between(2_100_000, 2_900_000, 1000), 'transfer', 'transfer', 'bancolombia', { toAccountId: 'davivienda' })
    add(at(21, 10), 'Index contribution', 800_000, 'transfer', 'transfer', 'bancolombia', { toAccountId: 'trii' })
    add(at(24, 6), 'Creative Cloud', 89_000, 'expense', 'subscriptions', 'davivienda', { recurringId: 'adobe' })
    add(at(length, 9), 'Quincena · Ritmo Labs', 4_950_000, 'income', 'salary', 'bancolombia')
    add(at(length, 23), 'Rendimientos Cajita', between(146_000, 172_000), 'income', 'interest', 'nu')
    if (offset === -2) add(at(14, 8), 'Seguro de hogar · Sura', 162_000, 'expense', 'utilities', 'bancolombia', { recurringId: 'home-insurance' })
    if (offset <= -1 && offset >= -3) add(at(27, 6), 'Disney+', 38_900, 'expense', 'subscriptions', 'davivienda', { recurringId: 'disney' })

    if (current) {
      add(at(6, 15), 'Invoice paid · Estudio Pino', 2_400_000, 'income', 'freelance', 'bancolombia', { note: 'Brand system, phase 2' })
      add(at(12, 21, 10), 'El Cielo · Tasting menu', 486_000, 'expense', 'dining', 'davivienda', { note: "Mamá's birthday" })
      add(at(13, 17), 'Flores Bulevar', 145_000, 'expense', 'gifts', 'nequi')
    } else if (rand() > 0.3) {
      add(at(23, 15), pick(['Invoice paid · Estudio Pino', 'Invoice paid · Casa Nómada']), between(1_600_000, 3_400_000, 50_000), 'income', 'freelance', 'bancolombia')
    }

    for (let d = 1; d <= length; d++) {
      const weekday = new Date(at(d)).getDay()
      if (weekday === 6) add(at(d, 10), 'Lavamás', 32_000, 'expense', 'utilities', 'cash', { recurringId: 'laundry' })
      if (rand() < 0.2) add(at(d, 18, 20), pick(['Carulla', 'Éxito', 'D1', 'Ara', 'Euro Supermercados']), between(68_000, 310_000), 'expense', 'groceries', pick(['davivienda', 'bancolombia']))
      if (rand() < 0.3) add(at(d, 13, 30), pick(['Juan Valdez', 'Pergamino Café', 'Crepes & Waffles', 'Rappi', 'Hacienda', 'Café Velvet']), between(16_000, 118_000), 'expense', 'dining', pick(['davivienda', 'nequi']))
      if (rand() < 0.34) add(at(d, 8, 15), pick(['Uber', 'DiDi', 'Cívica · Metro']), between(8_000, 34_000), 'expense', 'transport', 'nequi')
      if (rand() < 0.05) add(at(d, 16), pick(['Falabella', 'Amazon', 'Arturo Calle', 'Homecenter']), between(60_000, 420_000), 'expense', 'shopping', 'davivienda')
      if (rand() < 0.06) add(at(d, 20), pick(['Cine Colombia', 'Teatro Pablo Tobón', 'Parque Arví', 'Steam']), between(24_000, 150_000), 'expense', 'leisure', pick(['davivienda', 'nequi']))
      if (rand() < 0.04) add(at(d, 11), pick(['Farmatodo', 'Cruz Verde']), between(22_000, 96_000), 'expense', 'health', 'nequi')
      if (rand() < 0.03) add(at(d, 17), pick(['Librería Panamericana', 'Udemy']), between(45_000, 180_000), 'expense', 'education', 'davivienda')
      if (rand() < 0.08) add(at(d, 9, 40), pick(['Tienda La Esquina', 'Mercado campesino']), between(8_000, 42_000), 'expense', 'groceries', 'cash')
    }
  }

  const { accounts, transactions } = finalize(
    [
      { id: 'bancolombia', name: 'Everyday', institution: 'Bancolombia', kind: 'checking', last4: '4821', tone: '#E2B87A', target: 8_640_250 },
      { id: 'nu', name: 'Cajita', institution: 'Nu Colombia', kind: 'savings', tone: '#A7A2DA', target: 21_380_000 },
      { id: 'trii', name: 'Index portfolio', institution: 'trii', kind: 'investment', tone: '#46C7B7', target: 19_780_000 },
      { id: 'davivienda', name: 'Visa Signature', institution: 'Davivienda', kind: 'credit', last4: '0937', creditLimit: 12_000_000, tone: '#D49DB0', target: -2_184_600 },
      { id: 'nequi', name: 'Nequi', institution: 'Nequi', kind: 'wallet', tone: '#7FA6D9', target: 412_900 },
      { id: 'cash', name: 'Cash on hand', institution: 'Wallet', kind: 'cash', tone: '#94A8BC', target: 186_000 },
    ],
    drafts,
  )

  const nextSaturday = startOfDay(now) + (((6 - new Date(now).getDay() + 7) % 7) || 7) * DAY + 10 * HOUR
  const r = (id: string, name: string, amount: number, category: CategoryId, accountId: string, frequency: Frequency, nextDate: number, kind: Recurring['kind'], paused?: boolean): Recurring => ({
    id, name, amount, category, accountId, frequency, nextDate, kind, paused,
  })

  const recurring: Recurring[] = [
    r('rent', 'Arriendo · Laureles', 2_850_000, 'housing', 'bancolombia', 'monthly', nextMonthly(now, 1), 'bill'),
    r('epm', 'EPM · Energía y agua', 285_000, 'utilities', 'bancolombia', 'monthly', nextMonthly(now, 8), 'bill'),
    r('sura', 'Sura · Medicina prepagada', 389_000, 'health', 'bancolombia', 'monthly', nextMonthly(now, 10), 'bill'),
    r('claro', 'Claro Hogar · Fibra', 115_900, 'utilities', 'bancolombia', 'monthly', nextMonthly(now, 12), 'bill'),
    r('home-insurance', 'Seguro de hogar · Sura', 162_000, 'utilities', 'bancolombia', 'quarterly', addMonths(startOfMonth(now, -2) + 13 * DAY + 8 * HOUR, 3), 'bill'),
    r('laundry', 'Lavamás', 32_000, 'utilities', 'cash', 'weekly', nextSaturday, 'bill'),
    r('gym', 'Bodytech', 199_900, 'health', 'davivienda', 'monthly', nextMonthly(now, 3), 'subscription'),
    r('netflix', 'Netflix', 44_900, 'subscriptions', 'davivienda', 'monthly', nextMonthly(now, 5), 'subscription'),
    r('spotify', 'Spotify', 16_900, 'subscriptions', 'davivienda', 'monthly', nextMonthly(now, 9), 'subscription'),
    r('icloud', 'iCloud+', 11_900, 'subscriptions', 'davivienda', 'monthly', nextMonthly(now, 17), 'subscription'),
    r('adobe', 'Creative Cloud', 89_000, 'subscriptions', 'davivienda', 'monthly', nextMonthly(now, 24), 'subscription'),
    r('platzi', 'Platzi Expert', 949_000, 'education', 'davivienda', 'yearly', addMonths(startOfMonth(now, -8) + 2 * DAY + 9 * HOUR, 12), 'subscription'),
    r('disney', 'Disney+', 38_900, 'subscriptions', 'davivienda', 'monthly', nextMonthly(now, 27), 'subscription', true),
  ]

  const budgets: Budget[] = [
    { id: 'b-housing', category: 'housing', limit: 2_850_000 },
    { id: 'b-groceries', category: 'groceries', limit: 1_250_000 },
    { id: 'b-dining', category: 'dining', limit: 1_100_000 },
    { id: 'b-transport', category: 'transport', limit: 320_000 },
    { id: 'b-subscriptions', category: 'subscriptions', limit: 200_000 },
    { id: 'b-health', category: 'health', limit: 700_000 },
    { id: 'b-leisure', category: 'leisure', limit: 300_000 },
    { id: 'b-shopping', category: 'shopping', limit: 360_000 },
  ]

  return { accounts, transactions, budgets, recurring }
}

function buildSparse(now: number): FinanceData {
  const today = startOfDay(now)
  const at = (daysAgo: number, h: number, m = 0) => Math.min(today - daysAgo * DAY + h * HOUR + m * 60_000, now - (daysAgo === 0 ? 60_000 : 0))
  const drafts: Draft[] = [
    { date: at(6, 9), description: 'Quincena · Ritmo Labs', amount: 4_200_000, type: 'income', category: 'salary', accountId: 'bancolombia' },
    { date: at(5, 19, 10), description: 'Carulla', amount: 186_400, type: 'expense', category: 'groceries', accountId: 'bancolombia' },
    { date: at(4, 6), description: 'Spotify', amount: 16_900, type: 'expense', category: 'subscriptions', accountId: 'bancolombia', recurringId: 'spotify' },
    { date: at(2, 8, 20), description: 'Uber', amount: 21_300, type: 'expense', category: 'transport', accountId: 'bancolombia' },
    { date: at(1, 9, 40), description: 'Tienda La Esquina', amount: 12_000, type: 'expense', category: 'groceries', accountId: 'cash' },
    { date: at(0, 8, 5), description: 'Juan Valdez', amount: 14_500, type: 'expense', category: 'dining', accountId: 'bancolombia' },
  ]
  const { accounts, transactions } = finalize(
    [
      { id: 'bancolombia', name: 'Everyday', institution: 'Bancolombia', kind: 'checking', last4: '4821', tone: '#E2B87A', target: 3_420_000 },
      { id: 'cash', name: 'Cash on hand', institution: 'Wallet', kind: 'cash', tone: '#94A8BC', target: 168_000 },
    ],
    drafts,
  )
  return {
    accounts,
    transactions,
    budgets: [{ id: 'b-groceries', category: 'groceries', limit: 900_000 }],
    recurring: [
      { id: 'spotify', name: 'Spotify', amount: 16_900, category: 'subscriptions', accountId: 'bancolombia', frequency: 'monthly', nextDate: addMonths(at(4, 6), 1), kind: 'subscription' },
    ],
  }
}

export function buildFinanceScenario(scenario: FinanceScenario, now: number): FinanceData | null {
  if (scenario === 'loading') return null
  if (scenario === 'empty') return { accounts: [], transactions: [], budgets: [], recurring: [] }
  if (scenario === 'sparse') return buildSparse(now)
  return buildPopulated(now)
}
