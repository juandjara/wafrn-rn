export type ErrorResponse = {
  success: false
  errorMessage: string
}

export function isErrorResponse<T extends { success: boolean }>(res: ErrorResponse | T): res is ErrorResponse {
  return res.success === false
}

export async function getJSON(...params: Parameters<typeof fetch>) {
  params[1] = params[1] || {}
  params[1].headers = new Headers(params[1].headers || {})
  params[1].headers.set('Accept', 'application/json')
  const res = await fetch(...params)
  if (!res.ok) {
    throw statusError(res.status, `Network response not ok for url ${params[0]}: ${res.status} ${res.statusText} \n${await res.text()}`)
  }
  const json = await res.json()
  if (isErrorResponse(json)) {
    const msg = `Error response for URL ${params[0]}: ${JSON.stringify(json)}`
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
