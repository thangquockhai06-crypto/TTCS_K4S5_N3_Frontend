export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount}`;
}

export function formatCountdownTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  const paddedMin = String(minutes).padStart(2, '0');
  const paddedSec = String(seconds).padStart(2, '0');
  return `${paddedMin}:${paddedSec}`;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'NX';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

const AVATAR_GRADIENTS: ReadonlyArray<readonly [string, string]> = [
  ['#2563EB', '#4F46E5'],
  ['#8B5CF6', '#EC4899'],
  ['#0EA5E9', '#2563EB'],
  ['#10B981', '#059669'],
  ['#F59E0B', '#EA580C'],
  ['#6366F1', '#8B5CF6'],
  ['#14B8A6', '#0284C7'],
  ['#EC4899', '#8B5CF6'],
];

export function createAvatarSvgDataUri(name: string, seedIndex = 0): string {
  const initials = getInitials(name);
  const [startColor, endColor] = AVATAR_GRADIENTS[seedIndex % AVATAR_GRADIENTS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${startColor}" />
        <stop offset="100%" stop-color="${endColor}" />
      </linearGradient>
    </defs>
    <rect width="80" height="80" rx="22" fill="url(#g)" />
    <text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-family="Inter, sans-serif" font-weight="700" font-size="28">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return dateString;
  }
}
