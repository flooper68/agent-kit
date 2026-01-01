import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useUser, useClerk } from '@clerk/clerk-react';
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import {
  Text,
  ThemeToggle,
  buttonVariants,
  cn,
  Avatar,
  Skeleton,
} from '@agent-kit/ui';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();

  // Click outside to close profile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileMenuOpen]);

  // Close profile menu on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [profileMenuOpen]);

  const handleSignOut = () => {
    setProfileMenuOpen(false);
    signOut();
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 animate-fade-in border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Text
              as="span"
              size="14"
              variant="strong"
              className="text-primary-foreground"
            >
              AK
            </Text>
          </div>
          <Text as="span" size="16" variant="strong">
            Agent Kit
          </Text>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-copy-14 text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {!isLoaded ? (
            // Skeleton while checking auth
            <Skeleton className="h-8 w-8 rounded-full" />
          ) : isSignedIn ? (
            // Authenticated: show profile dropdown
            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="rounded-full ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
              >
                <Avatar
                  src={user?.imageUrl}
                  fallback={
                    user?.firstName?.[0] ||
                    user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase()
                  }
                  size="sm"
                />
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 animate-fade-in rounded-md border border-border bg-background shadow-lg">
                  {/* Profile info */}
                  <div className="border-b border-border px-3 py-2">
                    <div className="truncate text-sm font-medium">
                      {user?.fullName || user?.firstName || 'User'}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {user?.primaryEmailAddress?.emailAddress}
                    </div>
                  </div>
                  {/* Dashboard link */}
                  <div className="p-1">
                    <Link
                      to="/app"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Go to Dashboard
                    </Link>
                  </div>
                  {/* Divider */}
                  <div className="border-t border-border" />
                  {/* Sign out */}
                  <div className="p-1">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Not authenticated: show sign in/up buttons
            <>
              <Link
                to="/sign-in"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
              >
                Sign In
              </Link>
              <Link
                to="/sign-up"
                className={cn(buttonVariants({ size: 'sm' }))}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          {!isLoaded ? (
            <Skeleton className="h-8 w-8 rounded-full" />
          ) : isSignedIn ? (
            <Avatar
              src={user?.imageUrl}
              fallback={user?.firstName?.[0] || 'U'}
              size="sm"
            />
          ) : null}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="flex flex-col gap-2 px-4 py-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-copy-14 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <hr className="my-2 border-border" />
            {isLoaded && isSignedIn ? (
              // Authenticated mobile menu
              <>
                <Link
                  to="/app"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-copy-14 transition-colors hover:bg-muted"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Go to Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-copy-14 text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              // Not authenticated mobile menu
              <>
                <Link
                  to="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md px-3 py-2 text-copy-14 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Sign In
                </Link>
                <Link
                  to="/sign-up"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(buttonVariants({ size: 'sm' }), 'mt-2')}
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
