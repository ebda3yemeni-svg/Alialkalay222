const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const isLocalDev =
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
      window.location.port === '3000';

    if (isLocalDev) {
      return '';
    }
  }

  return 'https://service-9582.ai.studio';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Diagnostic fetch wrapper for Android / web API calls
 */
export async function safeApiFetch(endpointOrUrl: string, init?: RequestInit): Promise<Response> {
  const method = init?.method || 'GET';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'N/A';
  const finalUrl = endpointOrUrl.startsWith('http')
    ? endpointOrUrl
    : `${API_BASE_URL}${endpointOrUrl.startsWith('/') ? '' : '/'}${endpointOrUrl}`;

  console.log('[ANDROID API REQUEST]', {
    'window.location.origin': origin,
    'API_BASE_URL': API_BASE_URL,
    'complete final request URL': finalUrl,
    'HTTP method': method,
  });

  try {
    const response = await fetch(finalUrl, init);
    const contentType = response.headers.get('content-type') || 'N/A';

    console.log('[ANDROID API RESPONSE]', {
      'final response URL': response.url || finalUrl,
      'HTTP status': response.status,
      'Content-Type': contentType,
      'response.ok': response.ok,
    });

    const clone = response.clone();
    const textBody = await clone.text();
    console.log('[ANDROID API BODY]', textBody.substring(0, 200));

    return response;
  } catch (err: any) {
    console.error('[ANDROID API ERROR]', {
      url: finalUrl,
      method,
      error: err?.message || err,
    });
    throw err;
  }
}





