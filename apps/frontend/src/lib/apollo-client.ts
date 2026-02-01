import { 
  ApolloClient, 
  InMemoryCache, 
  createHttpLink,
  from,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
// GraphQL endpoint: VITE_GRAPHQL_URL from .env, or /graphql (proxied via Vite - no CORS)
const graphqlUri = import.meta.env.VITE_GRAPHQL_URL || '/graphql';
if (import.meta.env.DEV) {
  console.log('[Apollo] GraphQL endpoint:', graphqlUri || '(proxy /graphql)');
}

const httpLink = createHttpLink({
  uri: graphqlUri,
  credentials: 'include',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach((error) => {
      const { message, locations, path, extensions } = error;
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`
      );
      // Handle authentication errors
      if (extensions?.code === 'UNAUTHENTICATED') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }

  return forward(operation);
});

export const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          shipments: {
            keyArgs: ['filter', 'sort'],
            merge(existing, incoming, { args }) {
              // For pagination, merge results
              if (args?.pagination?.page === 1 || !existing) {
                return incoming;
              }
              return {
                ...incoming,
                edges: [...(existing?.edges || []), ...incoming.edges],
              };
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

// Named export for use in main.tsx
export const apolloClient = client;
