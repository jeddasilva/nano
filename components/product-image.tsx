import clsx from 'clsx';
import Image from 'next/image';

const useFourthwallImages = process.env.NEXT_PUBLIC_USE_FW_IMAGE_OPTIMIZATION === 'true';

type ProductImageProps = {
  src: string;
  transformedSrc?: string | null;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
};

export function ProductImage({
  src,
  transformedSrc,
  alt,
  className,
  fill,
  width,
  height,
  sizes,
  priority
}: ProductImageProps) {
  const imageSrc = (transformedSrc || src || '').trim();
  if (!imageSrc) return null;

  if (useFourthwallImages || imageSrc.includes('fourthwall')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageSrc}
        alt={alt}
        className={clsx(className, { 'absolute inset-0 h-full w-full': fill })}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        loading={priority ? 'eager' : 'lazy'}
      />
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      className={className}
      fill={fill}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
    />
  );
}
