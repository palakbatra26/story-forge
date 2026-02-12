import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const footerLinks = [
    { name: "Home", href: "/" },
    { name: "Explore", href: "/explore" },
    { name: "Authors", href: "/authors" },
    { name: "Write", href: "/write" },
  ];

  return (
    <footer className="border-t border-border/50 bg-secondary/30">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="font-serif text-base font-bold text-primary-foreground">B</span>
              </div>
              <span className="font-serif text-lg font-semibold tracking-tight">
                BlogHub
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              A platform for thoughtful writing and meaningful conversations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {footerLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="h-px bg-border my-6" />

        <div className="text-sm text-muted-foreground flex justify-center md:justify-start">
          © {currentYear} BlogHub
        </div>
      </div>
    </footer>
  );
};

export default Footer;
