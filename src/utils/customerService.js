export function serviceToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(now)
}

export function serviceState(terms, today = serviceToday()) {
  if (!terms?.type) return 'unassigned'
  if (terms.start_date > today) return 'scheduled'
  if (terms.end_date && terms.end_date < today) return 'expired'
  return terms.type === 'Free' ? 'free' : 'paid'
}

export function serviceLabel(terms, today = serviceToday()) {
  const state = serviceState(terms, today)
  if (state === 'unassigned') return 'No service added'
  if (state === 'scheduled') return `${terms.type} service · Upcoming`
  if (state === 'expired') return `${terms.type} service · Expired`
  return `${terms.type} service`
}

export function serviceDate(value) {
  if (!value) return 'No end date'
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

export function serviceRate(terms) {
  if (terms?.hourly_rate == null) return 'Rate not set'
  return `${new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: terms.currency || 'INR', maximumFractionDigits: 2
  }).format(terms.hourly_rate)} / hour`
}

// The end date is inclusive: service beginning on 28 Oct for six months ends on 27 Apr.
export function freeServiceEnd(start, months) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || ![6, 12].includes(Number(months))) return ''
  const [year, month, day] = start.split('-').map(Number)
  const lastDay = new Date(Date.UTC(year, month - 1 + Number(months) + 1, 0)).getUTCDate()
  const end = new Date(Date.UTC(year, month - 1 + Number(months), Math.min(day - 1, lastDay)))
  return end.toISOString().slice(0, 10)
}
