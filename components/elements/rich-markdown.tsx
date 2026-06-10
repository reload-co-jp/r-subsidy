"use client"

import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import { FlowDiagram } from "./flow-diagram"

export function RichMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeRaw]}
      components={{
        code({ className, children }) {
          if (/language-flow-diagram/.test(className ?? "")) {
            return <FlowDiagram id={String(children).trim()} />
          }
          return <code className={className}>{children}</code>
        },
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
