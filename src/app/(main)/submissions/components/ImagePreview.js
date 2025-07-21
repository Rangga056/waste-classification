"use client"; // This directive MUST be at the very top of the file

import React from "react";

function ImagePreview({ imageUrl, username }) {
  const handleError = (e) => {
    e.target.onerror = null; // Prevent infinite loop if fallback also breaks
    e.target.src = "https://placehold.co/96x96/e2e8f0/64748b?text=No+Image";
  };

  return (
    <div className="flex-shrink-0 w-full h-[175px] rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Preview for submission by ${username}`}
          className="w-full h-full object-cover"
          onError={handleError}
        />
      ) : (
        <span className="text-sm text-gray-500 text-center">No Image</span>
      )}
    </div>
  );
}

export default ImagePreview;
