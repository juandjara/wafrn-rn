import { NativeIntent } from 'expo-router';

type RedirectFn = NativeIntent['redirectSystemPath'];
type RedirectFnParams = Parameters<NonNullable<RedirectFn>>[0];

export function redirectSystemPath({ path }: RedirectFnParams): Promise<string> | string {
  try {
    if (path.includes('fediverse/')) {
      path = path.replace('fediverse/', '')
    }
    if (path.includes('blog/')) {
      path = path.replace('blog/', 'user/')
    }
  } catch (e) {
    console.error(e)
  }
  return path
}
