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
const IMG_EXTENSIONS = [
  'bmp',
  'gif',
  'ico',
  'jpeg',
  'jpg',
  'png',
  'svg',
  'webp'
]

export function isVideo(url: string) {
  return VIDEO_EXTENSIONS.some((ext) => url.endsWith(ext))
}
export function isAudio(url: string) {
  return AUDIO_EXTENSIONS.some((ext) => url.endsWith(ext))
}
export function isNotAV(url: string) {
  return !isVideo(url) && !isAudio(url) && !isImage(url)
}
export function isImage(url: string) {
  return IMG_EXTENSIONS.some((ext) => url.endsWith(ext))
}

export async function getRemoteAspectRatio(url: string) {
  return new Promise<number>((resolve, reject) => {
    Image.getSize(url, (width, height) => {
      if (width && height) {
        resolve(height / width)
      } else {
        resolve(1)
      }
    }, (error) => {
      console.error(`Error getting aspect ratio for image ${url}`, error)
      resolve(1)
    })
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
