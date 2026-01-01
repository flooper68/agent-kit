import { Link } from 'react-router-dom';
import { Text } from '@agent-kit/ui';

const footerLinks = [
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Contact', href: '#' },
];

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-muted/30 px-4 py-8 animate-fade-in">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Logo and copyright */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
                <Text
                  as="span"
                  size="13"
                  variant="strong"
                  className="text-primary-foreground"
                >
                  AK
                </Text>
              </div>
              <Text as="span" size="14" variant="strong">
                Agent Kit
              </Text>
            </Link>
            <Text as="span" size="14" variant="muted">
              &copy; {new Date().getFullYear()}
            </Text>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-copy-14 text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
