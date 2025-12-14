import { toast } from '@backpackapp-io/react-native-toast'
import { useMemo } from 'react'
import { useCSSVariable } from 'uniwind'

export function useToasts() {
  const green900 = useCSSVariable('--color-green-900') as string
  const green100 = useCSSVariable('--color-green-100') as string

  const red900 = useCSSVariable('--color-red-900') as string
  const red100 = useCSSVariable('--color-red-100') as string

  const blue900 = useCSSVariable('--color-blue-900') as string
  const white = useCSSVariable('--color-white') as string

  const red500 = useCSSVariable('--color-red-500') as string
  const black = useCSSVariable('--color-black') as string

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

    function showToastError(message: string) {
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

    function showToastInfo(message: string) {
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
