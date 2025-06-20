'use client';

import { useEffect } from 'react';

export default function MobileMenuToggle() {
  useEffect(() => {
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (!mobileMenuButton || !mobileMenu) return;

    const handleMenuToggle = () => {
      mobileMenu.classList.toggle('hidden');
    };

    const handleClickOutside = (event: Event) => {
      const target = event.target as Element;
      if (!mobileMenuButton.contains(target) && !mobileMenu.contains(target)) {
        mobileMenu.classList.add('hidden');
      }
    };

    mobileMenuButton.addEventListener('click', handleMenuToggle);
    document.addEventListener('click', handleClickOutside);

    // Cleanup event listeners
    return () => {
      mobileMenuButton.removeEventListener('click', handleMenuToggle);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return null; // This component doesn't render anything
} 