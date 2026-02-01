import { 
  ApolloClient, 
  InMemoryCache, 
  createHttpLink,
  from,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { from as rxFrom, switchMap } from 'rxjs';
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

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  try {
    const res = await fetch(graphqlUri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        query: `mutation RefreshToken($token: String!) {
          refreshToken(token: $token) {
            accessToken
            refreshToken
            user { id email firstName lastName role isActive createdAt }
          }
        }`,
        variables: { token: refreshToken },
      }),
    });
    const json = await res.json();
    const data = json.data?.refreshToken;
    if (data?.accessToken && data?.refreshToken) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return true;
    }
  } catch (err) {
    console.warn('[Auth] Refresh token failed:', err);
  }
  return false;
}

function logoutAndRedirect() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

const errorLink = onError(({ error, operation, forward }) => {
  const hasAuthError =
    (CombinedGraphQLErrors.is(error) &&
      error.errors.some(
        (e: { extensions?: { code?: string }; message?: string }) =>
          e.extensions?.code === 'UNAUTHENTICATED' ||
          e.message?.includes('logged in')
      )) ||
    (!CombinedGraphQLErrors.is(error) && error?.message?.includes('logged in'));

  if (hasAuthError) {
    const opName = operation.operationName;
    if (opName === 'RefreshToken') {
      logoutAndRedirect();
      return forward(operation);
    }

    return rxFrom(tryRefreshToken()).pipe(
      switchMap((refreshed) => {
        if (!refreshed) logoutAndRedirect();
        return forward(operation);
      })
    );
  }

  if (CombinedGraphQLErrors.is(error)) {
    error.errors.forEach((e: { message?: string; locations?: unknown; path?: unknown }) => {
      console.error(
        `[GraphQL error]: Message: ${e.message}, Location: ${JSON.stringify(e.locations)}, Path: ${e.path}`
      );
    });
  } else {
    console.error(`[Network error]: ${error}`);
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
