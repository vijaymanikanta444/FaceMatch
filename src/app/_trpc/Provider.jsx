"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import React, { useState, useEffect } from "react";

import { trpc } from "./client";

export default function Provider({ children }) {
  const [queryClient] = useState(() => new QueryClient({}));
  const [trpcClient, setTrpcClient] = useState(null);

  useEffect(() => {
    // Check if we are running on the client side
    if (typeof window !== "undefined") {
      // Create trpc client with the correct URL
      const client = trpc.createClient({
        links: [
          httpBatchLink({
            url: `${window.location.href}api/trpc`,
          }),
        ],
      });
      setTrpcClient(client);
    }
  }, []); // Run this effect only once on component mount

  // Render the component only if the trpcClient is available
  if (!trpcClient) {
    return null;
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
