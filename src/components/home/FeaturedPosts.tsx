import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import PostCard from "@/components/blog/PostCard";

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

const FeaturedPosts = () => {
  const { user } = useUser();
  const [posts, setPosts] = useState<HomePost[]>([]);
  const [loading, setLoading] = useState(false);

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

  const recentPosts = useMemo(() => posts.slice(0, 4), [posts]);
  const featuredPost = recentPosts[0];
  const secondaryPosts = recentPosts.slice(1);

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

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="heading-title mb-2">Featured Stories</h2>
            <p className="text-muted-foreground">Latest uploads from your community</p>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading featured stories...</p>
        ) : !featuredPost ? (
          <p className="text-muted-foreground">No stories uploaded yet.</p>
        ) : (
          <>
            <div className="mb-8">
              <PostCard {...toCardPost(featuredPost)} variant="featured" />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {secondaryPosts.map((post, index) => (
                <div
                  key={post.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <PostCard {...toCardPost(post)} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default FeaturedPosts;
