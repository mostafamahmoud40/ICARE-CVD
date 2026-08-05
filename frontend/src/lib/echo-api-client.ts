import axios from "axios"

const ECHO_BASE_URL =
  process.env.NEXT_PUBLIC_ECHO_API_URL?.trim() || "http://localhost:8080"

export const echoApiClient = axios.create({
  baseURL: ECHO_BASE_URL,
})
