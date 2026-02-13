import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthorCard from "@/components/blog/AuthorCard";

type AuthorItem = {
  clerkId: string;
  name: string;
  username: string;
  avatarUrl: string;
  bio: string;
  followersCount: number;
  postsCount: number;
  isFollowing: boolean;
  isVerified?: boolean;
};

const Authors = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [authors, setAuthors] = useState<AuthorItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const syncUser = async () => {
      if (!isSignedIn || !user) return;
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        await fetch(`${baseUrl}/api/users/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkId: user.id,
            name: user.fullName || user.username || "",
            email: user.primaryEmailAddress?.emailAddress || "",
            username: user.username || "",
            avatarUrl: user.imageUrl || "",
          }),
        });
      } catch {
        // no-op
      }
    };

    syncUser();
  }, [isSignedIn, user]);

  useEffect(() => {
    const loadAuthors = async () => {
      setLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const query = user?.id
          ? `?viewerClerkId=${encodeURIComponent(user.id)}`
          : "";
        const response = await fetch(`${baseUrl}/api/users/directory${query}`);
        if (!response.ok) throw new Error("Failed to load authors");

        const data = await response.json();
        setAuthors(data || []);
      } catch {
        setAuthors([]);
      } finally {
        setLoading(false);
      }
    };

    loadAuthors();
  }, [user?.id]);

  const handleFollowToggle = async (targetClerkId: string) => {
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

      if (!response.ok) throw new Error("Follow failed");
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
    } catch {
      toast.error("Unable to update follow status.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-10 space-y-6">
          <div>
            <h1 className="heading-title mb-2">Authors</h1>
            <p className="text-muted-foreground">Discover creators and visit their profiles.</p>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading authors...</p>
          ) : authors.length === 0 ? (
            <p className="text-muted-foreground">No authors found.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {authors.map((author) => (
                <AuthorCard
                  key={author.clerkId}
                  username={author.username || author.name.toLowerCase().replace(/\s+/g, "")}
                  name={author.name}
                  avatar={author.avatarUrl}
                  bio={author.bio}
                  followers={author.followersCount}
                  postsCount={author.postsCount}
                  isVerified={author.isVerified}
                  profileHref={`/profile/${author.clerkId}`}
                  isFollowing={author.isFollowing}
                  onFollow={() => handleFollowToggle(author.clerkId)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Authors;
