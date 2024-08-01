import { Image } from "react-native"
import { formatCachedUrl, formatMediaUrl } from "../formatters"
import { PostMedia } from "./posts.types"

const AUDIO_EXTENSIONS = [
  'aac',
  'm4a',
  'mp3',
  'oga',
  'ogg',
  'opus',
  'wav',
  'weba'
]
const VIDEO_EXTENSIONS = [
  'mp4',
  'webm'
]

export function isVideo(url: string) {
  return VIDEO_EXTENSIONS.some((ext) => url.endsWith(ext))
}
export function isAudio(url: string) {
  return AUDIO_EXTENSIONS.some((ext) => url.endsWith(ext))
}
export function isPDF(url: string) {
  return url.endsWith('pdf')
}
export function isImage(url: string) {
  return !isVideo(url) && !isAudio(url) && !isPDF(url)
}

export async function getRemoteAspectRatio(url: string) {
  return new Promise<number>((resolve, reject) => {
    Image.getSize(url, (width, height) => {
      if (width && height) {
        resolve(height / width)
      } else {
        resolve(1)
      }
    }, reject)
  })
}

export async function addSizesToMedias(medias: PostMedia[]) {
  return Promise.all(medias.map(async (media) => {
    const url = formatCachedUrl(formatMediaUrl(media.url))
    if (isImage(url)) {
      const aspectRatio = await getRemoteAspectRatio(url)
      return { ...media, aspectRatio }
    }
    return media
  }))
}
