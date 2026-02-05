import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import AuthorCard from "@/components/blog/AuthorCard";

const featuredAuthors = [
  {
    username: "sarahchen",
    name: "Sarah Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    bio: "Tech lead & writer. Exploring the intersection of code and creativity.",
    followers: 12400,
    postsCount: 48,
  },
  {
    username: "mtorres",
    name: "Michael Torres",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    bio: "Design systems advocate. Making the web beautiful, one component at a time.",
    followers: 8900,
    postsCount: 35,
  },
  {
    username: "emmaw",
    name: "Emma Wilson",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    bio: "Product designer turned writer. Sharing lessons from 10 years in tech.",
    followers: 15200,
    postsCount: 62,
  },
  {
    username: "davidk",
    name: "David Kim",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    bio: "Engineering manager at Scale. Writing about leadership and systems thinking.",
    followers: 7600,
    postsCount: 29,
  },
];

const AuthorsSpotlight = () => {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="heading-title mb-2">Writers to Follow</h2>
            <p className="text-muted-foreground">
              Discover voices that inspire and inform
            </p>
          </div>
          <Link
            to="/authors"
            className="hidden md:flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            View all authors
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredAuthors.map((author, index) => (
            <div
              key={author.username}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <AuthorCard {...author} />
            </div>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link
            to="/authors"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            View all authors
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AuthorsSpotlight;
