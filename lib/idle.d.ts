/**
 * Schedule low-priority work so it does not compete with animation, scrolling or frame
 * composition. Returns a cancel function, which is also the useEffect cleanup.
 *
 * Native delegates to the `requestIdleCallback` global that React Native provides. Web uses
 * it when the browser has it and falls back to cooperative time-slicing where it doesn't —
 * Safari has never shipped it on iOS.
 */
export declare function requestIdle(callback: () => void): () => void
