import { useEffect, useRef } from 'react';

export function useScrollReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
    );

    const observeAll = () => {
      const elements = node.querySelectorAll('.scroll-reveal:not(.revealed)');
      elements.forEach((el) => observer.observe(el));
    };

    observeAll();

    // Watch for dynamically added elements
    const mutation = new MutationObserver(() => observeAll());
    mutation.observe(node, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
  }, []);

  return ref;
}
