import { createStore } from '@xstate/store'
import { useSelector } from '@xstate/store/react'
import { DerivedPostData } from './api/content'

type PostLayoutState = {
  cwOpen?: boolean
  collapsed?: boolean
}

type StoreState = {
  layout: Record<string, PostLayoutState | undefined>
}

const derivedStateStore = createStore({
  context: {} as Record<string, DerivedPostData | undefined>,
  on: {
    setState: (context, payload: { id: string; state: DerivedPostData }) => {
      return {
        ...context,
        [payload.id]: payload.state,
      }
    },
  },
})

export function useDerivedPostState(postId: string) {
  const state = useSelector(derivedStateStore, (state) => state.context[postId])
  return state
}

export function setDerivedPostState(id: string, state: DerivedPostData) {
  derivedStateStore.send({ type: 'setState', id, state })
}

const postStore = createStore({
  context: {
    layout: {},
  } as StoreState,
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
