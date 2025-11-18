import { fetch } from 'expo/fetch'
import pkg from '../package.json'

export type ErrorResponse = {
  success: false
  message: string
}

export function isErrorResponse<T extends { success: boolean }>(
  res: ErrorResponse | T,
): res is ErrorResponse {
  return res.success === false
}

export async function getJSON(...params: Parameters<typeof fetch>) {
  params[1] = params[1] || {}
  params[1].headers = new Headers(params[1].headers || {})
  params[1].headers.set('Accept', 'application/json')
  params[1].headers.set('User-Agent', `${pkg.name}/${pkg.version}`)
  const res = await fetch(...params)
  if (!res.ok) {
    throw statusError(
      res.status,
      `HTTP Error Code ${res.status} \n${await res.text()}\nURL: ${params[0]}\n`,
    )
  }
  const json = await res.json()
  if (isErrorResponse(json)) {
    const msg = `API Error: ${json.message ? json.message : JSON.stringify(json)} \nURL: ${params[0]}`
    console.error(msg)
    throw statusError(500, msg)
  }
  return json
}

export type StatusError = Error & { status: number }

export function statusError(status: number, message: string) {
  const e = new Error(message)
  ;(e as StatusError).status = status
  return e as StatusError
}
