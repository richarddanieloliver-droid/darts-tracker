import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface Props {
  title: string;
  back?: boolean;
  right?: ReactNode;
  below?: ReactNode;
  children: ReactNode;
  big?: boolean;
}

export function Layout({ title, back, right, below, children, big }: Props) {
  const navigate = useNavigate();
  return (
    <div className="mx-auto min-h-dvh max-w-xl">
      <header className="app-header-bg sticky top-0 z-20 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          {back && (
            <button
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
              className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              aria-label="Back"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <h1
            className={`min-w-0 flex-1 truncate font-bold tracking-tight ${
              big ? 'font-display pt-3 pb-1 text-[38px] leading-tight' : 'text-[22px]'
            }`}
          >
            {big ? (
              <Link to="/" className="flex items-center gap-2">
                <img src="./icon.svg" alt="" className="h-8 w-8" />
                {title}
              </Link>
            ) : (
              title
            )}
          </h1>
          {right}
        </div>
        {below}
      </header>
      <main className="px-3 pt-2 pb-[calc(2rem+env(safe-area-inset-bottom))]">{children}</main>
    </div>
  );
}

export function Pill({ children, onClick, to }: { children: ReactNode; onClick?: () => void; to?: string }) {
  const cls =
    'inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-[14px] font-semibold text-white hover:bg-white/20';
  if (to)
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  return (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mt-5 mb-2 flex items-center justify-between px-1 text-[12px] font-semibold tracking-wider text-muted uppercase">
      <span>{children}</span>
      {right}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  type = 'button',
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}) {
  const styles = {
    primary: 'bg-accent text-black hover:brightness-110',
    secondary: 'bg-card-2 text-white hover:bg-line',
    danger: 'bg-danger/15 text-danger hover:bg-danger/25',
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-3 text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}
