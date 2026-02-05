import { TrendingUp } from "lucide-react";
import PostCard from "@/components/blog/PostCard";
import CategoryPill from "@/components/blog/CategoryPill";

const trendingPosts = [
  {
    id: "5",
    title: "Why Every Developer Should Learn System Design",
    excerpt: "The skills that separate senior engineers from the rest.",
    author: { name: "Alex Rivera", username: "alexr" },
    category: "Engineering",
    publishedAt: "Jan 14",
    readTime: 5,
    likes: 423,
    comments: 56,
  },
  {
    id: "6",
    title: "The Minimalist Approach to Product Management",
    excerpt: "Less features, more impact: a framework for focused product development.",
    author: { name: "Jessica Lee", username: "jessical" },
    category: "Product",
    publishedAt: "Jan 13",
    readTime: 4,
    likes: 312,
    comments: 41,
  },
  {
    id: "7",
    title: "Remote Work: Two Years Later",
    excerpt: "Reflections on what we've learned about distributed teams.",
    author: { name: "Mark Johnson", username: "markj" },
    category: "Career",
    publishedAt: "Jan 12",
    readTime: 6,
    likes: 287,
    comments: 38,
  },
  {
    id: "8",
    title: "The Rise of AI-Assisted Creativity",
    excerpt: "How artificial intelligence is becoming a creative partner, not a replacement.",
    author: { name: "Nina Patel", username: "ninap" },
    category: "AI",
    publishedAt: "Jan 11",
    readTime: 7,
    likes: 398,
    comments: 52,
  },
];

const trendingCategories = [
  { name: "Technology", slug: "technology", count: 234 },
  { name: "Design", slug: "design", count: 189 },
  { name: "Product", slug: "product", count: 156 },
  { name: "Career", slug: "career", count: 143 },
  { name: "AI & ML", slug: "ai-ml", count: 128 },
  { name: "Startups", slug: "startups", count: 112 },
];

const TrendingSection = () => {
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
          </div>

          {/* Trending categories */}
          <div>
            <h2 className="heading-subtitle mb-6">Popular Topics</h2>
            <div className="flex flex-wrap gap-2">
              {trendingCategories.map((category) => (
                <CategoryPill key={category.slug} {...category} />
              ))}
            </div>

            {/* Newsletter signup */}
            <div className="mt-8 p-6 rounded-xl bg-card border border-border/50">
              <h3 className="font-serif text-lg font-semibold mb-2">
                Stay in the loop
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get the best stories delivered to your inbox weekly.
              </p>
              <form className="space-y-3">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  type="submit"
                  className="w-full btn-editorial"
                >
                  Subscribe
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
