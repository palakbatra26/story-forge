import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import AuthorCard from "@/components/blog/AuthorCard";
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from "sonner";

type SuggestedAuthor = {
  clerkId: string;
  username: string;
  name: string;
  avatarUrl: string;
  bio: string;
  followersCount: number;
  postsCount: number;
  isFollowing: boolean;
  isVerified?: boolean;
};

const AuthorsSpotlight = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [authors, setAuthors] = useState<SuggestedAuthor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTopAuthors = async () => {
      if (!isSignedIn || !user) {
        setAuthors([]);
        return;
      }

      setLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(
          `${baseUrl}/api/users/directory?viewerClerkId=${encodeURIComponent(user.id)}&activeOnly=true`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch top authors");
        }
        const data = await response.json();
        const ranked = (data || [])
          .sort(
            (a: SuggestedAuthor, b: SuggestedAuthor) =>
              b.followersCount - a.followersCount || b.postsCount - a.postsCount
          )
          .slice(0, 8);
        setAuthors(ranked);
      } catch {
        setAuthors([]);
      } finally {
        setLoading(false);
      }
    };

    loadTopAuthors();
  }, [isSignedIn, user]);

  const handleFollow = async (targetClerkId: string) => {
    if (!isSignedIn || !user) {
      toast.error("Please sign in first.");
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/users/${targetClerkId}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewerClerkId: user.id,
          viewerName: user.fullName || user.username || "",
          viewerEmail: user.primaryEmailAddress?.emailAddress || "",
          viewerUsername: user.username || "",
          viewerAvatarUrl: user.imageUrl || "",
        }),
      });
      if (!response.ok) throw new Error("Failed to follow");

      const data = await response.json();
      setAuthors((prev) =>
        prev.map((author) =>
          author.clerkId === targetClerkId
            ? {
                ...author,
                isFollowing: data.isFollowing,
                followersCount: data.followersCount,
              }
            : author
        )
      );
      toast.success(data.isFollowing ? "Followed successfully." : "Unfollowed successfully.");
    } catch {
      toast.error("Unable to follow user.");
    }
  };

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="heading-title mb-2">Top Authors</h2>
            <p className="text-muted-foreground">
              Dynamic ranking based on followers and activity
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

        {loading ? (
          <p className="text-muted-foreground">Loading top authors...</p>
        ) : authors.length === 0 ? (
          <p className="text-muted-foreground">No authors to show right now.</p>
        ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {authors.map((author, index) => (
            <div
              key={author.clerkId}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <AuthorCard
                username={author.username || author.name.toLowerCase().replace(/\s+/g, "")}
                name={author.name}
                avatar={author.avatarUrl}
                bio={author.bio}
                followers={author.followersCount}
                postsCount={author.postsCount}
                isVerified={author.isVerified}
                profileHref={`/profile/${author.clerkId}`}
                isFollowing={author.isFollowing}
                onFollow={() => handleFollow(author.clerkId)}
              />
            </div>
          ))}
        </div>
        )}

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
