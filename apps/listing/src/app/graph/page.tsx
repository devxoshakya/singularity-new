"use client"

import dynamic from "next/dynamic"

const GraphClientPage = dynamic(() => import("./graph-client"), {
  ssr: false,
  loading: () => (
    <div className="p-6 text-sm text-muted-foreground">Loading analytics charts...</div>
  ),
})

export default function GraphPage() {
  return <GraphClientPage />
}
