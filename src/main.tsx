import React from "react";
import ReactDOM from "react-dom/client";
import { routeTree } from './routeTree.gen';
import "./styles/index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient.js";
import { RouteErrorPage, RoutePendingPage } from "./shared/components/RouteStates";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  ScrollRestoration,
} from "@tanstack/react-router";

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: "intent",
  defaultErrorComponent: RouteErrorPage,
  defaultPendingComponent: RoutePendingPage,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);
