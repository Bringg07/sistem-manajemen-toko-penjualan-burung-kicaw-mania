"use client";

import Image from "next/image";
import { useState } from "react";

const PLACEHOLDER = "/placeholder-bird.svg";

/**
 * Gambar burung dengan next/image + fallback placeholder lokal
 * jika URL kosong atau gagal dimuat.
 */
export default function BirdImage({
  src,
  alt,
  width = 400,
  height = 300,
  className = "",
  sizes = "(max-width: 768px) 100vw, 25vw",
  fill = false,
  priority = false,
}) {
  const [error, setError] = useState(false);
  const finalSrc = !src || error ? PLACEHOLDER : src;

  if (fill) {
    return (
      <Image
        src={finalSrc}
        alt={alt || "Foto burung"}
        fill
        sizes={sizes}
        priority={priority}
        onError={() => setError(true)}
        className={className}
      />
    );
  }

  return (
    <Image
      src={finalSrc}
      alt={alt || "Foto burung"}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      onError={() => setError(true)}
      className={className}
    />
  );
}
