"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { getQueryClient } from "@/lib/query-client"
import { ThemeProvider } from "@/components/theme-provider"
import { Web3Provider } from "@/components/web3-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <ThemeProvider>
          <Web3Provider>{children}</Web3Provider>
        </ThemeProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  )
}
