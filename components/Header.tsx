import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

export function BrandMark({ size = 24 }: { size?: number }) {
  return (
    <svg className="brand__mark" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="6" width="14" height="14" rx="3" transform="rotate(-8 9 13)" fill="currentColor" opacity="0.28" />
      <rect x="6" y="4" width="14" height="14" rx="3" transform="rotate(6 13 11)" fill="currentColor" opacity="0.55" />
      <rect x="4" y="5" width="15" height="15" rx="3" fill="currentColor" />
      <circle cx="9.5" cy="10.5" r="1.6" fill="#fff" />
      <path d="M5 17.5l4.2-4 3 2.8 2.3-2.1 4.5 4.3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Header({ showLogout = true }: { showLogout?: boolean }) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand">
          <BrandMark />
          Álbum de Fotos
        </Link>
        {showLogout && <LogoutButton />}
      </div>
    </header>
  );
}
