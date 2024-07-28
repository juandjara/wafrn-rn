export type ErrorResponse = {
  success: false
  errorMessage: string
}

export function isErrorResponse<T extends { success: boolean }>(res: ErrorResponse | T): res is ErrorResponse {
  return res.success === false
}

export async function getJSON(...params: Parameters<typeof fetch>) {
  const res = await fetch(...params)
  if (!res.ok) {
    throw new Error(`Network response not ok: ${res.status} ${res.statusText} \n${await res.text()}`)
  }
  const json = await res.json()
  if (isErrorResponse(json)) {
    throw new Error(json.errorMessage)
  }
  return json
}
