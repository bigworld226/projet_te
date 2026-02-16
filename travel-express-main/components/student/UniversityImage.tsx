"use client";
import React, { useState } from "react";

interface UniversityImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export const UniversityImage: React.FC<UniversityImageProps> = ({ src, alt, className, fallback }) => {
  const [error, setError] = useState(false);

  if (error) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
};
