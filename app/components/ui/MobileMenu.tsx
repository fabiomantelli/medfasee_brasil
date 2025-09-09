'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Navigation from '../server/Navigation';

interface MobileMenuProps {
  currentPath?: string;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ currentPath = '/' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [startX, setStartX] = useState<number | null>(null);
  const [currentX, setCurrentX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setCurrentX(touch.clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || startX === null) return;
    
    const touch = e.touches[0];
    setCurrentX(touch.clientX);
    
    const deltaX = touch.clientX - startX;
    
    // Only allow closing swipe (left swipe when menu is open)
    if (isOpen && deltaX < 0) {
      const progress = Math.max(0, Math.min(1, Math.abs(deltaX) / 200));
      if (menuRef.current) {
        menuRef.current.style.transform = `translateX(-${progress * 100}%)`;
      }
    }
    
    // Allow opening swipe from left edge
    if (!isOpen && startX < 20 && deltaX > 0) {
      const progress = Math.max(0, Math.min(1, deltaX / 200));
      if (menuRef.current) {
        menuRef.current.style.transform = `translateX(-${100 - progress * 100}%)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || startX === null || currentX === null) {
      setIsDragging(false);
      return;
    }
    
    const deltaX = currentX - startX;
    const threshold = 100;
    
    if (isOpen && deltaX < -threshold) {
      // Close menu with left swipe
      setIsOpen(false);
    } else if (!isOpen && startX < 20 && deltaX > threshold) {
      // Open menu with right swipe from left edge
      setIsOpen(true);
    }
    
    // Reset transform
    if (menuRef.current) {
      menuRef.current.style.transform = '';
    }
    
    setIsDragging(false);
    setStartX(null);
    setCurrentX(null);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // Hamburger menu button
  const HamburgerButton = () => (
    <button
      onClick={toggleMenu}
      className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 hover:scale-105"
      aria-label="Toggle menu"
    >
      <div className="w-6 h-6 flex flex-col justify-center items-center">
        <span
          className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 ${
            isOpen ? 'rotate-45 translate-y-1.5' : ''
          }`}
        />
        <span
          className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 mt-1 ${
            isOpen ? 'opacity-0' : ''
          }`}
        />
        <span
          className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 mt-1 ${
            isOpen ? '-rotate-45 -translate-y-1.5' : ''
          }`}
        />
      </div>
    </button>
  );

  // Mobile overlay menu
  const MobileOverlay = () => {
    if (!mounted) return null;

    return createPortal(
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={closeMenu}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        {/* Sidebar */}
        <div
          ref={menuRef}
          className={`fixed top-0 left-0 h-full w-60 max-w-[75vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close button */}
          <button
            onClick={closeMenu}
            className="absolute top-3 right-3 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors z-10"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navigation content */}
          <div className="h-full overflow-y-auto" onClick={closeMenu}>
            <Navigation currentPath={currentPath} />
          </div>
        </div>
      </>,
      document.body
    );
  };

  return (
    <>
      <HamburgerButton />
      <MobileOverlay />
    </>
  );
};

export default MobileMenu;