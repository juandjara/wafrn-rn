import { CACHE_URL, MEDIA_URL } from "./config"
import dayjs from "dayjs"
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export function unfurlCacheUrl(url: string) {
  if (!url.startsWith(CACHE_URL)) {
    return url
  }
  return decodeURIComponent(url.replace(CACHE_URL, ''))
}

export function formatCachedUrl(url: string) {
  return `${CACHE_URL}${encodeURIComponent(url)}`
}

export function formatMediaUrl(url: string) {
  if (url.startsWith("http")) {
    return url
  }
  if (url.startsWith("?")) {
    return url
  }
  return `${MEDIA_URL}/${url.startsWith('/') ? url.slice(1) : url}`
}

export function formatSmallAvatar(link?: string) {
  if (!link) {
    return ''
  }
  const url = formatCachedUrl(formatMediaUrl(link))
  const small = `${url}&avatar=true`
  return small
}

export function formatDate(date: string) {
  return new Date(date).toLocaleString()
}

export function formatUserUrl(user?: { url: string }) {
  if (!user?.url) {
    return ''
  }
  return user.url.startsWith("@") ? user.url : `@${user.url}`
}

export function timeAgo(date: string) {
  const day = dayjs(new Date(date))
  const timeAgo = day.fromNow()
    .replace(/ years?/, 'y')
    .replace(/ months?/, 'mo')
    .replace(/ days?/, 'd')
    .replace(/ hours?/, 'h')
    .replace(/ minutes?/, 'm')
    .replace(/ seconds?/, 's')
    .replace(/^one|^an|^a/, '1')

  return timeAgo
}
