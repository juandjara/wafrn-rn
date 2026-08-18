export type UploadableFile = {
  uri: string
  name?: string
  type?: string
}

function triggerBrowserDownload(objectUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Defer revocation so the browser has a moment to start the download.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function inferFilename(url: string, mime: string): string {
  let basename: string
  try {
    basename = new URL(url).pathname.split('/').at(-1) || 'download'
  } catch {
    basename = 'download'
  }
  if (basename.includes('.')) return basename
  const ext =
    mime
      .split('/')
      .pop()
      ?.replace('jpeg', 'jpg')
      .replace('svg+xml', 'svg')
      .replace('x-icon', 'ico') || ''
  return ext ? `${basename}.${ext}` : basename
}

export async function getUploadableFile({
  uri,
  name,
  type,
}: UploadableFile): Promise<Blob> {
  const res = await fetch(uri)
  if (!res.ok) {
    throw new Error(`Failed to read file URI (HTTP ${res.status})`)
  }
  const blob = await res.blob()
  const finalName = name ?? uri.split('/').pop() ?? 'file'
  const finalType = type ?? blob.type
  return new File([blob], finalName, { type: finalType })
}

export async function writeBase64ToCache(
  _filename: string,
  base64: string,
  mimeType: string,
): Promise<string> {
  const blob = new Blob([base64ToBytes(base64).buffer as ArrayBuffer], {
    type: mimeType,
  })
  return URL.createObjectURL(blob)
}

export async function saveTextToDevice(
  filename: string,
  text: string,
  mimeType: string,
): Promise<void> {
  const blob = new Blob([text], { type: mimeType })
  triggerBrowserDownload(URL.createObjectURL(blob), filename)
}

export async function fetchToLocalUri(
  url: string,
  _filename: string,
): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url} (HTTP ${res.status})`)
  }
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

export async function downloadToDevice(
  url: string,
  mime: string,
): Promise<void> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to download (HTTP ${res.status})`)
  }
  const blob = await res.blob()
  const filename = inferFilename(url, mime || blob.type)
  triggerBrowserDownload(URL.createObjectURL(blob), filename)
}
