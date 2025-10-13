import parseIncomingPath from '@/lib/parseIncomingPath'
import { NativeIntent } from 'expo-router'

type RedirectFn = NativeIntent['redirectSystemPath']
type RedirectFnParams = Parameters<NonNullable<RedirectFn>>[0]

export function redirectSystemPath({
  path,
}: RedirectFnParams): Promise<string> | string {
  return parseIncomingPath(path)
}
