const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim();
  }
  if (
    typeof window !== 'undefined' &&
    (window.location.origin.includes('localhost') ||
      window.location.origin.startsWith('capacitor://') ||
      window.location.protocol === 'file:' ||
      (window as any).Capacitor !== undefined)
  ) {
    return 'https://service-9582.ai.studio';
  }
  return '';
};

export const API_BASE_URL = getApiBaseUrl();
