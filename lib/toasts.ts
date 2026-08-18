import { toast, ToastOptions } from '@backpackapp-io/react-native-toast'
import { useMemo } from 'react'
import { useCSSString } from '@/lib/cssVariables'

export function useToasts() {
  const green900 = useCSSString('--color-green-900')
  const green100 = useCSSString('--color-green-100')

  const red900 = useCSSString('--color-red-900')
  const red100 = useCSSString('--color-red-100')

  const blue900 = useCSSString('--color-blue-900')
  const white = useCSSString('--color-white')

  const red500 = useCSSString('--color-red-500')
  const black = useCSSString('--color-black')

  return useMemo(() => {
    function showToastSuccess(message: string) {
      toast.success(message, {
        styles: {
          text: {
            color: green900,
          },
          view: {
            backgroundColor: green100,
            borderRadius: 8,
          },
        },
      })
    }

    function showToastError(message: string, options?: ToastOptions) {
      toast.error(message, {
        styles: {
          text: {
            color: red900,
          },
          view: {
            backgroundColor: red100,
            borderRadius: 8,
          },
        },
        ...options,
      })
    }

    function showToastDarkSouls(message: string) {
      toast(message.toUpperCase(), {
        duration: 3000,
        styles: {
          text: {
            color: red500,
            fontSize: 24,
          },
          view: {
            backgroundColor: black,
            borderRadius: 8,
          },
        },
      })
    }

    function showToastInfo(message: string, options?: ToastOptions) {
      toast(message, {
        styles: {
          text: {
            color: blue900,
          },
          view: {
            backgroundColor: white,
            borderRadius: 8,
          },
        },
        ...options,
      })
    }

    return {
      showToastSuccess,
      showToastError,
      showToastDarkSouls,
      showToastInfo,
    }
  }, [green100, green900, red100, red500, red900, blue900, black, white])
}
