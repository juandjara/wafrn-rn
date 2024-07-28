import { CACHE_URL, MEDIA_URL } from "./config"
import { PostUser } from "./api/posts.types"

export function formatCachedUrl(url: string) {
  return `${CACHE_URL}${encodeURIComponent(url)}`
}

export function formatMediaUrl(url: string) {
  if (url.startsWith("http")) {
    return url
  }
  return `${MEDIA_URL}/${url.startsWith('/') ? url.slice(1) : url}`
}

export function formatAvatarUrl(user?: PostUser) {
  if (!user?.avatar) {
    return ''
  }
  return user.url.startsWith("@")
    ? formatCachedUrl(user.avatar)
    : formatCachedUrl(formatMediaUrl(user.avatar))
}

export function formatDate(date: string) {
  return new Date(date).toLocaleString()
}

export function formatUserUrl(user?: PostUser) {
  if (!user?.url) {
    return ''
  }
  return user.url.startsWith("@") ? user.url : `@${user.url}`
}
