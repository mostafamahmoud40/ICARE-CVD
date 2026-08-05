import type { DoctorAccountApiProfile } from "./doctor-account/doctorAccount.api"

const CACHE_KEY = "ICARE_CVD_DOCTOR_HEADER_PROFILE"

const listeners = new Set<() => void>()

export function subscribeDoctorHeaderProfile(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notifyDoctorHeaderProfileListeners() {
  listeners.forEach((listener) => listener())
}

let profileSnapshotRaw: string | null | undefined
let profileSnapshot: DoctorAccountApiProfile | null = null

export function getDoctorHeaderProfileSnapshot(): DoctorAccountApiProfile | null {
  if (typeof window === "undefined") return null

  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY)
    if (raw === profileSnapshotRaw) {
      return profileSnapshot
    }

    profileSnapshotRaw = raw
    if (!raw) {
      profileSnapshot = null
      return null
    }

    profileSnapshot = JSON.parse(raw) as DoctorAccountApiProfile
    return profileSnapshot
  } catch {
    profileSnapshotRaw = null
    profileSnapshot = null
    return null
  }
}

export function readDoctorHeaderProfileCache(): DoctorAccountApiProfile | null {
  return getDoctorHeaderProfileSnapshot()
}

export function writeDoctorHeaderProfileCache(profile: DoctorAccountApiProfile) {
  if (typeof window === "undefined") return
  try {
    const nextRaw = JSON.stringify(profile)
    window.sessionStorage.setItem(CACHE_KEY, nextRaw)
    profileSnapshotRaw = nextRaw
    profileSnapshot = profile
    notifyDoctorHeaderProfileListeners()
  } catch {
    // ignore quota / private mode
  }
}

export function clearDoctorHeaderProfileCache() {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.removeItem(CACHE_KEY)
    profileSnapshotRaw = null
    profileSnapshot = null
    notifyDoctorHeaderProfileListeners()
  } catch {
    // ignore
  }
}
