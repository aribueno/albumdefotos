import { ImageResponse } from 'next/og';

export function renderAppIcon(size: number, rounded: boolean) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0e7c86',
          borderRadius: rounded ? size * 0.22 : 0,
        }}
      >
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
          <rect x="2" y="6" width="14" height="14" rx="3" transform="rotate(-8 9 13)" fill="#ffffff" fillOpacity="0.32" />
          <rect x="6" y="4" width="14" height="14" rx="3" transform="rotate(6 13 11)" fill="#ffffff" fillOpacity="0.6" />
          <rect x="4" y="5" width="15" height="15" rx="3" fill="#ffffff" />
          <circle cx="9.5" cy="10.5" r="1.6" fill="#0e7c86" />
          <path d="M5 17.5l4.2-4 3 2.8 2.3-2.1 4.5 4.3" stroke="#0e7c86" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  );
}
