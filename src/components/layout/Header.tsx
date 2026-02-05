import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth, useUser } from "@clerk/clerk-react";
import { 
  Menu, 
  X, 
  Search, 
  Bell,
  PenSquare
} from "lucide-react";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const displayName = user?.fullName || user?.username || "";

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Explore", href: "/explore" },
    { name: "Categories", href: "/categories" },
    { name: "Authors", href: "/authors" },
    { name: "Write", href: "/write" },
    { name: "Analytics", href: "/analytics" },
    { name: "Admin", href: "/admin" },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="font-serif text-lg font-bold text-primary-foreground">B</span>
            </div>
            <span className="font-serif text-xl font-semibold tracking-tight">
              BlogHub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive(link.href)
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Search className="h-5 w-5" />
            </Button>

            {/* Notifications - shown when logged in */}
            <Button variant="ghost" size="icon" className="hidden sm:flex relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
            </Button>

            {/* Write - CTA */}
            <Button variant="ghost" size="sm" className="hidden md:flex gap-2" asChild>
              <Link to="/write">
                <PenSquare className="h-4 w-4" />
                Write
              </Link>
            </Button>

            {/* Auth */}
            {isSignedIn && displayName ? (
              <span className="hidden md:flex text-sm text-muted-foreground">Hi, {displayName}</span>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="hidden md:flex" asChild>
                  <Link to="/sign-in">Sign in</Link>
                </Button>
                <Button size="sm" className="hidden md:flex" asChild>
                  <Link to="/sign-up">Sign up</Link>
                </Button>
              </>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-slide-down">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive(link.href)
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="h-px bg-border my-2" />
              {isSignedIn && displayName ? (
                <div className="px-4 py-2 text-sm text-muted-foreground">Hi, {displayName}</div>
              ) : (
                <>
                  <Link
                    to="/sign-in"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive("/sign-in")
                        ? "text-primary bg-primary/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/sign-up"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive("/sign-up")
                        ? "text-primary bg-primary/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
