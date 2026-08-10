const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const isCapacitor =
      (window as any).Capacitor !== undefined ||
      window.location.origin.startsWith('capacitor://') ||
      window.location.protocol === 'file:' ||
      (window.location.origin.includes('localhost') && !window.location.port);

    if (isCapacitor) {
      return 'https://service-9582.ai.studio';
    }
  }

  return '';
};

export const API_BASE_URL = getApiBaseUrl();




