// src/components/common/Logo.tsx
import React from 'react';
import logoImage from '../../assets/logo.jpg';

export const Logo: React.FC = () => {
  return (
    <a href="/" className="flex items-center space-x-2">
      <img src={logoImage} alt="Shamba Sure Logo" className="h-10 w-10 rounded-full object-cover" />
      <span className="font-serif text-2xl font-bold text-primary-text">
        Shamba Sure
      </span>
    </a>
  );
};