import { toast } from '@backpackapp-io/react-native-toast'
import { QueryCache, QueryClient } from '@tanstack/react-query'
import ErrorCopyToast from '@/components/errors/ErrorCopyToast'
import { StatusError } from './http'
import { router } from 'expo-router'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      throwOnError: false,
      // TODO: consider if we should control retry logic here or in the caller
      retry: (failureCount, error) => {
        // default react query logic, only retry 3 times max
        if (failureCount >= 3) {
          return false
        }

        const statusCode = (error as StatusError).status

        // dont retry when error is not an error response from the backend or is status code 0 (inner network layer error, probably due to malformed url)
        if (!statusCode) {
          return false
        }

        if (statusCode === 401) {
          router.navigate('/sign-in')
          return false
        }

        // retry on 404, 429 and 5xx status codes
        if (statusCode >= 404) {
          return true
        }

        // dont retry on 400, 401, 403 and 3xx status codes
        return false
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error(error)
      toast(error.message, {
        id: query.queryKey.join('|'),
        duration: Infinity,
        customToast: (toast) => {
          return <ErrorCopyToast toast={toast} error={error} />
        },
      })
    },
  }),
})
