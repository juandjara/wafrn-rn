import { createStore } from '@xstate/store'
import { useSelector } from '@xstate/store/react'

type PostLayoutState = {
  cwOpen?: boolean
  collapsed?: boolean
}

export const postStore = createStore({
  context: {
    layout: {} as Record<string, PostLayoutState | undefined>
  },
  on: {
    toggleCollapsed: {
      layout: (context, payload: { id: string }) => {
        const layout = context.layout[payload.id] || {} as PostLayoutState
        return {
          ...context.layout,
          [payload.id]: {
            ...layout,
            collapsed: !layout.collapsed
          }
        }
      }
    },
    toggleCwOpen: {
      layout: (context, payload: { id: string }) => {
        const layout = context.layout[payload.id] || {} as PostLayoutState
        return {
          ...context.layout,
          [payload.id]: {
            ...layout,
            cwOpen: !layout.cwOpen
          }
        }
      }
    },
  },
})

export function usePostLayout(postId: string) {
  const state = useSelector(postStore, (state) => state.context.layout[postId])
  return state || {}
}

export function useLayoutData() {
  return useSelector(postStore, (state) => state.context.layout)
}

export function toggleCollapsed(postId: string) {
  postStore.send({ type: 'toggleCollapsed', id: postId })
}

export function toggleCwOpen(postId: string) {
  postStore.send({ type: 'toggleCwOpen', id: postId })
}
