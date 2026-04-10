"use client"

import { AddStaff } from "./AddStaff"
import { useAddStaff } from "./useAddStaff"

export function AddStaffPageContainer() {
  const state = useAddStaff()
  return <AddStaff {...state} />
}
