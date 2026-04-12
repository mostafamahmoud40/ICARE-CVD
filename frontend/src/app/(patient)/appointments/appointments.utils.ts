export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))
}

export function formatDateOnly(iso: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(new Date(iso))
}

export function formatTimeOnly(iso: string) {
  return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(iso))
}

export function computeFeeTotal(fees: { amount: string }[]): number {
  return fees.reduce((sum, f) => {
    const val = parseFloat(f.amount.replace(/[^0-9.]/g, ""))
    return f.amount.startsWith("-") ? sum - val : sum + val
  }, 0)
}
