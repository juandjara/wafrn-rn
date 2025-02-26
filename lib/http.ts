import { createUploadTask, FileSystemUploadOptions } from "expo-file-system"

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
    throw statusError(res.status, `${res.status} ${res.statusText} \n${await res.text()}\nURL: ${params[0]}`)
  }
  const json = await res.json()
  if (isErrorResponse(json)) {
    const msg = `${JSON.stringify(json)} \nURL: ${params[0]}`
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

export type UploadFilePayload = FileSystemUploadOptions & {
  uploadUrl: string
  fileUri: string
}

export async function uploadFile({
  uploadUrl,
  fileUri,
  ...options
}: UploadFilePayload) {
  const task = createUploadTask(uploadUrl, fileUri, options)
  const res = await task.uploadAsync()
  const status = res?.status || 500

  if (status >= 400) {
    throw statusError(status, `Network response not ok for url ${uploadUrl}: code ${status} \n${res?.body}`)
  }

  try {
    const json = JSON.parse(res?.body || '{}')
    if (isErrorResponse(json)) {
      const msg = `Error response for URL ${uploadUrl}: ${res?.body}`
      console.error(msg)
      throw statusError(500, msg)  
    }
    return json
  } catch (err) {
    console.error(err)
    throw statusError(500, `Error parsing response body for URL ${uploadUrl}: ${res?.body}`)
  }
}

