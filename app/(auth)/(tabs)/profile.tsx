import { useParsedToken } from '@/lib/contexts/AuthContext'
import { Redirect } from 'expo-router'

export default function Profile() {
  const me = useParsedToken()
  return <Redirect href={`/user/${me?.url}`} />
}
