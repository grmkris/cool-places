import { isServer, MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        const message =
          (query.meta as { errorMessage?: string })?.errorMessage ??
          "Something went wrong"
        toast.error(message, { description: error.message })
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        const message =
          (mutation.meta as { errorMessage?: string })?.errorMessage ??
          "Something went wrong"
        toast.error(message, { description: error.message })
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
  if (isServer) return makeQueryClient()
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}
