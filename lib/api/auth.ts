import { API_URL } from "../config"
import { isErrorResponse, statusError } from "../http"

type TokenResponse = {
  success: true
  token: string
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    throw statusError(res.status, `Network response not ok: ${res.status} ${res.statusText} \n${await res.text()}`)
  }
  const json = await res.json()
  if (isErrorResponse(json)) {
    throw statusError(500, `Network response error in auth response: ${JSON.stringify(json)}`)
  }

  return (json as TokenResponse).token
}

export type ParsedToken = {
  birthDate: string // ISO date
  email: string
  exp: number // expiration date in seconds
  iat: number // issued at in seconds
  role: number // marks admin or user
  url: string // @ handle of the user
  userId: string
}

export function parseToken(token: string | null) {
  if (!token) return null
  
  try {
    const decoed = JSON.parse(atob(token.split('.')[1])) as ParsedToken
    const expMs = decoed.exp * 1000
    const now = Date.now()
    if (expMs < now) {
      console.warn('Token expired')
      return null
    }
    return decoed
  } catch (error) {
    console.error('Error parsing token', error)
    return null
  }
}
