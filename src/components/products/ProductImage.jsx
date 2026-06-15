import React, { useState } from 'react';
import { Coffee } from 'lucide-react';

export default function ProductImage({ src, alt, className }) {
  const [imageError, setImageError] = useState(false);
  
  const defaultImage = "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&q=80";

  return (
    <>
      {!imageError && src ? (
        <img
          src={src}
          alt={alt}
          className={className}
          onError={() => {
            setImageError(true);
          }}
        />
      ) : (
        <img
          src={defaultImage}
          alt={alt}
          className={className}
        />
      )}
    </>
  );
}