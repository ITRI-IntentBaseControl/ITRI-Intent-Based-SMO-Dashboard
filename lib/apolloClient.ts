// lib/apolloClient.ts
import { ApolloClient, InMemoryCache, split, HttpLink } from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";

const httpLink = new HttpLink({
  uri: "http://localhost:4001/graphql",
});

const wsLink =
  typeof window !== "undefined"
    ? new WebSocketLink({
        uri: "ws://localhost:4001/graphql",
        options: { reconnect: true },
      })
    : null;

const splitLink =
  typeof window !== "undefined"
    ? split(
        ({ query }) => {
          const def = getMainDefinition(query);
          return (
            def.kind === "OperationDefinition" &&
            def.operation === "subscription"
          );
        },
        wsLink as any, // 若 TypeScript 報錯，可自行轉型
        httpLink
      )
    : httpLink;

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
