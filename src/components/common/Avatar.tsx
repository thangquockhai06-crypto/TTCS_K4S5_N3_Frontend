import React from 'react';
import { getInitials } from '../../utils/formatters';
import styles from './Avatar.module.css';

export interface IAvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'busy' | 'offline';
  shape?: 'circle' | 'rounded';
}

export const resolveAvatarUrl = (src?: string | null): string | undefined => {
  if (!src) return undefined;
  if (
    src.startsWith('blob:') ||
    src.startsWith('data:') ||
    src.startsWith('http://') ||
    src.startsWith('https://')
  ) {
    return src;
  }
  if (src.startsWith('/uploads')) {
    return `http://localhost:8000${src}`;
  }
  return src;
};

export const Avatar: React.FC<IAvatarProps> = ({
  src,
  name,
  size = 'md',
  status,
  shape = 'rounded',
}) => {
  const [imageError, setImageError] = React.useState(false);
  const resolvedUrl = resolveAvatarUrl(src);

  // Reset imageError when src changes
  React.useEffect(() => {
    setImageError(false);
  }, [src]);

  const wrapperClass = [
    styles.avatar,
    styles[`avatar--${size}`],
    styles[`avatar--${shape}`],
  ].join(' ');

  const showImage = resolvedUrl && !imageError;

  return (
    <div className={wrapperClass} title={name}>
      {showImage ? (
        <img
          src={resolvedUrl}
          alt={name}
          className={styles.avatar__img}
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className={styles.avatar__fallback}>{getInitials(name)}</span>
      )}
      {status && (
        <span
          className={`${styles.avatar__status} ${styles[`avatar__status--${status}`]}`}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
};
