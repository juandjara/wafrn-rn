export type UploadableFile = {
  uri: string
  name?: string
  type?: string
}

/**
 * Convert an arbitrary URI (file://, content://, blob:) into a FormData-
 * appendable Blob. Always returns a fresh Blob/File — does not stream.
 */
export declare function getUploadableFile(file: UploadableFile): Promise<Blob>

/**
 * Persist base64-encoded bytes to a URI suitable for later upload via
 * `getUploadableFile`. On native this writes to the app cache directory and
 * returns a file:// URI; on web it returns a blob: URL backed by an in-memory
 * Blob.
 */
export declare function writeBase64ToCache(
  filename: string,
  base64: string,
  mimeType: string,
): Promise<string>

/**
 * User-initiated "save this to my device" — `text` is plain UTF-8 (e.g. an
 * SVG QR code). On native, persists to the cache then saves to the media
 * library. On web, triggers a browser download.
 */
export declare function saveTextToDevice(
  filename: string,
  text: string,
  mimeType: string,
): Promise<void>

/**
 * User-initiated "save this remote URL to my device". On native, downloads
 * to cache then saves to the media library. On web, fetches as a blob and
 * triggers a browser download.
 */
export declare function downloadToDevice(
  url: string,
  mime: string,
): Promise<void>

/**
 * Fetch a remote URL into a local URI suitable for `getUploadableFile`. Used
 * when content from a third-party (e.g. a Tenor GIF) needs to be attached to
 * a post: download once, then upload to our server. On native, writes the
 * response body to the app cache and returns a file:// URI. On web, returns
 * a blob: URL — caller is responsible for letting it be garbage-collected
 * after the upload completes.
 */
export declare function fetchToLocalUri(
  url: string,
  filename: string,
): Promise<string>
