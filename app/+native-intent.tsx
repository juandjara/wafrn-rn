import { OIDC_REDIRECT_URL } from '@/lib/api/auth'
import parseIncomingPath from '@/lib/parseIncomingPath'
import { NativeIntent } from 'expo-router'

type RedirectFn = NativeIntent['redirectSystemPath']
type RedirectFnParams = Parameters<NonNullable<RedirectFn>>[0]

export function redirectSystemPath({
  path,
}: RedirectFnParams): Promise<string | null> | string | null {
  // On Android the OIDC redirect also arrives as a system link
  // the auth session that is waiting for it handles it, and returning null skips navigation
  if (path.startsWith(OIDC_REDIRECT_URL)) {
    return null
  }
  const pathRewrite = parseIncomingPath(path)
  return pathRewrite ?? path
}
