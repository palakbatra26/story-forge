import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useUser } from "@clerk/clerk-react";
import { TrendingUp } from "lucide-react";
import { toast } from "sonner";
import PostCard from "@/components/blog/PostCard";
import CategoryPill from "@/components/blog/CategoryPill";

type HomePost = {
  id: string;
  title: string;
  description: string;
  content: string;
  coverImageUrl: string;
  category: string;
  createdAt: string;
  likes: number;
  commentsCount: number;
  author: {
    clerkId: string;
    name: string;
    username: string;
    avatarUrl: string;
    isVerified?: boolean;
  } | null;
};

const TrendingSection = () => {
  const { user } = useUser();
  const [posts, setPosts] = useState<HomePost[]>([]);
  const [loading, setLoading] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    const primaryEmail = user?.primaryEmailAddress?.emailAddress || "";
    if (primaryEmail) {
      setNewsletterEmail(primaryEmail);
    }
  }, [user?.primaryEmailAddress?.emailAddress]);

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const query = user?.id ? `?viewerClerkId=${encodeURIComponent(user.id)}` : "";
        const response = await fetch(`${baseUrl}/api/posts${query}`);
        if (!response.ok) throw new Error("Failed to fetch posts");

        const data = await response.json();
        setPosts(data || []);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [user?.id]);

  const toCardPost = (post: HomePost) => {
    const words = (post.content || post.description || "").trim().split(/\s+/).filter(Boolean).length;
    const readTime = Math.max(1, Math.ceil(words / 180));

    return {
      id: post.id,
      title: post.title,
      excerpt: post.description || post.content?.slice(0, 140) || "",
      coverImage: post.coverImageUrl,
      author: {
        name: post.author?.name || "Unknown",
        username: post.author?.username || "user",
        avatar: post.author?.avatarUrl || "",
        clerkId: post.author?.clerkId,
        isVerified: !!post.author?.isVerified,
      },
      category: post.category || "General",
      publishedAt: new Date(post.createdAt).toLocaleDateString(),
      readTime,
      likes: post.likes || 0,
      comments: post.commentsCount || 0,
    };
  };

  const trendingPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => {
        const scoreA = (a.likes || 0) * 3 + (a.commentsCount || 0) * 2;
        const scoreB = (b.likes || 0) * 3 + (b.commentsCount || 0) * 2;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 5)
      .map(toCardPost);
  }, [posts]);

  const trendingCategories = useMemo(() => {
    const categoryCount = new Map<string, number>();

    posts.forEach((post) => {
      const key = (post.category || "General").trim() || "General";
      categoryCount.set(key, (categoryCount.get(key) || 0) + 1);
    });

    return [...categoryCount.entries()]
      .map(([name, count]) => ({
        name,
        count,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [posts]);

  const handleNewsletterSubscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = newsletterEmail.trim();
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }

    try {
      setSubscribing(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/users/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user?.id,
          name: user?.fullName || user?.username || "",
          email,
          username: user?.username || "",
          avatarUrl: user?.imageUrl || "",
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Failed to subscribe");
      }

      toast.success("Subscribed! New blog uploads will appear in your notifications.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to subscribe right now.";
      toast.error(message);
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <section className="py-12 md:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Trending posts */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="heading-subtitle">Trending Now</h2>
            </div>

            {loading ? (
              <p className="text-muted-foreground">Loading trending posts...</p>
            ) : trendingPosts.length === 0 ? (
              <p className="text-muted-foreground">No trending posts yet.</p>
            ) : (
              <div className="space-y-1 divide-y divide-border/50">
                {trendingPosts.map((post, index) => (
                  <div key={post.id} className="flex gap-4 items-start">
                    <span className="font-serif text-3xl font-bold text-muted-foreground/30 w-8 shrink-0 pt-4">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1">
                      <PostCard {...post} variant="compact" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trending categories */}
          <div>
            <h2 className="heading-subtitle mb-6">Popular Topics</h2>
            {trendingCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No topics yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {trendingCategories.map((category) => (
                  <CategoryPill key={category.slug} {...category} />
                ))}
              </div>
            )}

            {/* Newsletter signup */}
            <div className="mt-8 p-6 rounded-xl bg-card border border-border/50">
              <h3 className="font-serif text-lg font-semibold mb-2">
                Stay in the loop
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get the best stories delivered to your inbox weekly.
              </p>
              <form className="space-y-3" onSubmit={handleNewsletterSubscribe}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  type="submit"
                  className="w-full btn-editorial"
                  disabled={subscribing}
                >
                  {subscribing ? "Subscribing..." : "Subscribe"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrendingSection;
