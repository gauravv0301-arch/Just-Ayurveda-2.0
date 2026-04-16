import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GA_ID = process.env.REACT_APP_GA_ID;

export function initGA() {
  if (!GA_ID || GA_ID === 'G-XXXXXXXXXX') return;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: false });
}

export function usePageTracking() {
  const location = useLocation();
  useEffect(() => {
    if (window.gtag && GA_ID && GA_ID !== 'G-XXXXXXXXXX') {
      window.gtag('event', 'page_view', { page_path: location.pathname + location.search, page_title: document.title });
    }
  }, [location]);
}

export function trackEvent(eventName, params = {}) {
  if (window.gtag && GA_ID && GA_ID !== 'G-XXXXXXXXXX') {
    window.gtag('event', eventName, params);
  }
}
