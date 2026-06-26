"use client"

import { useState, useEffect } from "react"
import type { Dispatch, SetStateAction } from "react"

export function useLocalStorageState<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(defaultValue)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored !== null) setState(JSON.parse(stored) as T)
    } catch {
      // ignore
    }
   
  }, [key])

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // ignore
    }
  }, [key, state])

  return [state, setState]
}
