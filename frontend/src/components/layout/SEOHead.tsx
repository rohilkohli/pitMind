import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

/**
 * SEO component for meta tags
 * Updates document head with SEO-friendly meta tags
 */
export function SEOHead({
  title = 'PitMind - AI Race Strategy Copilot',
  description = 'AI-powered Formula 1 race strategy analysis with real-time telemetry, explainable decisions, and transparent pit stop recommendations.',
  keywords = 'F1, Formula 1, race strategy, AI, telemetry, pit stop, IBM Granite, Watsonx, machine learning',
  ogImage = '/og-image.png',
  canonicalUrl,
}: SEOHeadProps) {
  useEffect(() => {
    // Update title
    document.title = title;

    // Update or create meta tags
    const metaTags = [
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      { name: 'author', content: 'PitMind Team' },
      { name: 'robots', content: 'index, follow' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=5.0' },
      { name: 'theme-color', content: '#e8002d' },

      // Open Graph
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: ogImage },
      { property: 'og:site_name', content: 'PitMind' },

      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: ogImage },

      // Mobile
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'PitMind' },
    ];

    metaTags.forEach(({ name, property, content }) => {
      const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
      let element = document.querySelector(selector);

      if (!element) {
        element = document.createElement('meta');
        if (name) element.setAttribute('name', name);
        if (property) element.setAttribute('property', property);
        document.head.appendChild(element);
      }

      element.setAttribute('content', content);
    });

    // Canonical URL
    if (canonicalUrl) {
      let linkElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.rel = 'canonical';
        document.head.appendChild(linkElement);
      }
      linkElement.href = canonicalUrl;
    }

    // Structured data (JSON-LD)
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'PitMind',
      description: description,
      applicationCategory: 'SportsApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      screenshot: ogImage,
    };

    let scriptElement = document.querySelector('script[type="application/ld+json"]');
    if (!scriptElement) {
      scriptElement = document.createElement('script');
      scriptElement.type = 'application/ld+json';
      document.head.appendChild(scriptElement);
    }
    scriptElement.textContent = JSON.stringify(structuredData);
  }, [title, description, keywords, ogImage, canonicalUrl]);

  return null; // This component doesn't render anything
}

// Pre-configured SEO for different pages
export const SEO_CONFIGS = {
  dashboard: {
    title: 'Dashboard - PitMind',
    description: 'Real-time F1 race strategy dashboard with AI-powered recommendations and telemetry analysis.',
  },
  strategy: {
    title: 'Strategy Workspace - PitMind',
    description: 'Advanced F1 race strategy simulation and planning workspace with branching scenarios.',
  },
  telemetry: {
    title: 'Telemetry Analysis - PitMind',
    description: 'Detailed Formula 1 telemetry data analysis with lap times, tyre wear, and performance metrics.',
  },
  fan: {
    title: 'Fan Mode - PitMind',
    description: 'Fan-friendly F1 race commentary with accessible strategy explanations and live updates.',
  },
  login: {
    title: 'Sign In - PitMind',
    description: 'Sign in to PitMind to access AI-powered race strategy tools and telemetry analysis.',
  },
} as const;
