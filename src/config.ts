export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' &&
  (window.location.origin.includes('localhost') ||
    window.location.origin.startsWith('capacitor://') ||
    window.location.protocol === 'file:' ||
    (window as any).Capacitor !== undefined)
    ? 'https://service-9582.ai.studio'
    : '');
