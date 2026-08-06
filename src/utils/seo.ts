export interface SEOOptions {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'profile' | 'article';
  jsonLd?: object | object[];
}

export function updateSEO(options: SEOOptions) {
  if (typeof window === 'undefined') return;

  const defaultTitle = 'موسوعة الأنساب لبني علي الكلعي';
  const defaultDescription =
    'موسوعة الأنساب لبني علي الكلعي - المرجع التاريخي والجينيولوجي لتوثيق وتتبع السلالة والنسب والشجرة العائلية الشاملة.';
  const baseUrl = window.location.origin;

  const title = options.title ? `${options.title} | ${defaultTitle}` : defaultTitle;
  const description = options.description || defaultDescription;
  const canonical = options.canonicalUrl || window.location.href;
  const image = options.ogImage || `${baseUrl}/og-image.png`;
  const ogType = options.ogType || 'website';

  // Update Page Title
  document.title = title;

  // Helper function to update or create meta tag
  const setMeta = (selector: string, attrName: string, attrVal: string, content: string) => {
    let element = document.querySelector(selector) as HTMLMetaElement | null;
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attrName, attrVal);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // Helper function to update link tag
  const setLink = (rel: string, href: string) => {
    let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
    if (!element) {
      element = document.createElement('link');
      element.setAttribute('rel', rel);
      document.head.appendChild(element);
    }
    element.setAttribute('href', href);
  };

  // Primary Meta Tags
  setMeta('meta[name="description"]', 'name', 'description', description);
  setMeta('meta[name="title"]', 'name', 'title', title);

  // Open Graph Meta
  setMeta('meta[property="og:title"]', 'property', 'og:title', title);
  setMeta('meta[property="og:description"]', 'property', 'og:description', description);
  setMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
  setMeta('meta[property="og:image"]', 'property', 'og:image', image);
  setMeta('meta[property="og:type"]', 'property', 'og:type', ogType);
  setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', defaultTitle);

  // Twitter Card
  setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
  setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image);

  // Canonical URL
  setLink('canonical', canonical);

  // JSON-LD Structured Data
  let jsonLdScript = document.getElementById('json-ld-structured-data') as HTMLScriptElement | null;
  if (!jsonLdScript) {
    jsonLdScript = document.createElement('script');
    jsonLdScript.id = 'json-ld-structured-data';
    jsonLdScript.type = 'application/ld+json';
    document.head.appendChild(jsonLdScript);
  }

  const structuredData = options.jsonLd || {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: defaultTitle,
    alternateName: 'شجرة عائلة بني علي الكلعي',
    url: baseUrl,
    description: defaultDescription,
    inLanguage: 'ar',
    publisher: {
      '@type': 'Organization',
      name: defaultTitle,
    },
  };

  jsonLdScript.textContent = JSON.stringify(structuredData);
}
