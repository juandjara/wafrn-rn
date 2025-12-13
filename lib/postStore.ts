import { createStore } from '@xstate/store'
import { useSelector } from '@xstate/store/react'

type PostLayoutState = {
  cwOpen?: boolean
  collapsed?: boolean
}

type PostState = {
  layout: Record<string, PostLayoutState | undefined>
}

const postStore = createStore({
  context: {
    layout: {},
  } as PostState,
  on: {
    toggleCollapsed: (context, payload: { id: string; flag: boolean }) => {
      const layout = context.layout[payload.id] || ({} as PostLayoutState)
      const newLayout = {
        ...context.layout,
        [payload.id]: {
          ...layout,
          collapsed: payload.flag,
        },
      }
      return { layout: newLayout }
    },
    toggleCwOpen: (context, payload: { id: string; flag: boolean }) => {
      const layout = context.layout[payload.id] || ({} as PostLayoutState)
      const newLayout = {
        ...context.layout,
        [payload.id]: {
          ...layout,
          cwOpen: payload.flag,
        },
      }
      return { layout: newLayout }
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

export function toggleCollapsed(postId: string, flag: boolean) {
  postStore.send({ type: 'toggleCollapsed', id: postId, flag })
}

export function toggleCwOpen(postId: string, flag: boolean) {
  postStore.send({ type: 'toggleCwOpen', id: postId, flag })
}
