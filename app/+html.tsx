import { ScrollViewStyleReset } from 'expo-router/html'
import type { PropsWithChildren } from 'react'
import { Colors } from '@/constants/Colors'

/**
 * Wraps every web page. Runs only in Node during static/server rendering.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root { color-scheme: dark; }
              body { background-color: ${Colors.dark.background}; }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
