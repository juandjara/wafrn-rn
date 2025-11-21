import { toast } from '@backpackapp-io/react-native-toast'
import { QueryCache, QueryClient, onlineManager } from '@tanstack/react-query'
import ErrorCopyToast from '@/components/errors/ErrorCopyToast'
import { StatusError } from './http'
import { router } from 'expo-router'
import NetInfo from '@react-native-community/netinfo'

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected)
  })
})

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      throwOnError: false,
      // TODO: consider if we should control retry logic here or in the caller
      retry: (failureCount, error) => {
        // dont retry without internet connection
        if (!onlineManager.isOnline()) {
          return false
        }

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
          router.navigate('/sign-in?clear=true')
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
      const hasMoreRetries =
        typeof query.options.retry === 'function' &&
        query.options.retry(query.state.fetchFailureCount, error)

      // if the query is going to be retried, wait for the final try to show the error toast
      if (hasMoreRetries) {
        return
      }

      console.error(error)
      toast(error.message, {
        id: query.queryKey.join('|'),
        duration: 10000,
        customToast: (toast) => {
          return <ErrorCopyToast toast={toast} error={error} />
        },
      })
    },
  }),
})
