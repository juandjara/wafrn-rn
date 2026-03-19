import { createStore } from '@xstate/store'
import { useSelector } from '@xstate/store/react'

const imageRetriesStore = createStore({
  context: {} as Record<string, number>,
  on: {
    bump: (context, payload: { url: string }) => ({
      ...context,
      [payload.url]: (context[payload.url] || 0) + 1,
    }),
  },
})

export function useImageRetries(url: string) {
  return useSelector(imageRetriesStore, (state) => state.context[url] || 0)
}

export function bumpImageRetries(url: string) {
  imageRetriesStore.send({ type: 'bump', url })
}
