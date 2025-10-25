// API utility functions with authentication

export interface ApiRequestOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function apiRequest(url: string, options: ApiRequestOptions = {}) {
  const { requireAuth = true, ...fetchOptions } = options;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add authentication header if required
  if (requireAuth) {
    const token = localStorage.getItem('auth-token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Handle authentication errors
  if (response.status === 401 && requireAuth) {
    // Token is invalid, remove it and redirect to login
    localStorage.removeItem('auth-token');
    window.location.href = '/auth';
    throw new Error('Authentication required');
  }

  return response;
}

// Convenience methods
export const api = {
  get: (url: string, options: ApiRequestOptions = {}) =>
    apiRequest(url, { ...options, method: 'GET' }),
    
  post: (url: string, data?: any, options: ApiRequestOptions = {}) =>
    apiRequest(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  put: (url: string, data?: any, options: ApiRequestOptions = {}) =>
    apiRequest(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  delete: (url: string, options: ApiRequestOptions = {}) =>
    apiRequest(url, { ...options, method: 'DELETE' }),
};
