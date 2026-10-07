import { useEffect, useState } from 'react';
import { getCategoryIcon, getCategoryIconImageUrl, isCategoryIconUrl } from '@/lib/icons';

type CategoryIconProps = {
  value: string;
  className?: string;
  size?: number;
  alt?: string;
  onLoadError?: () => void;
};

export function CategoryIcon({
  value,
  className = '',
  size = 20,
  alt = '',
  onLoadError,
}: CategoryIconProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const Icon = getCategoryIcon(value);
  const imageUrl = getCategoryIconImageUrl(value);
  const isImage = isCategoryIconUrl(value);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  if (isImage && !imageFailed) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        className={className}
        onError={() => {
          setImageFailed(true);
          onLoadError?.();
        }}
      />
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      role={imageFailed ? 'img' : undefined}
      aria-label={imageFailed ? 'Category image unavailable; default icon shown' : undefined}
      title={imageFailed ? 'Category image unavailable; default icon shown' : undefined}
    >
      <Icon
        size={size}
        className={className}
        aria-hidden="true"
      />
    </span>
  );
}
