import PostCard from "@/components/blog/PostCard";

// Mock data - will be replaced with real data from database
const featuredPost = {
  id: "1",
  title: "The Future of Web Development: Trends to Watch in 2024",
  excerpt: "Exploring the emerging technologies and methodologies that are reshaping how we build for the web. From AI-assisted coding to edge computing, here's what every developer should know.",
  coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=600&fit=crop",
  author: {
    name: "Sarah Chen",
    username: "sarahchen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  },
  category: "Technology",
  publishedAt: "Jan 15, 2024",
  readTime: 8,
  likes: 342,
  comments: 45,
};

const recentPosts = [
  {
    id: "2",
    title: "Mastering the Art of Technical Writing",
    excerpt: "Clear documentation can make or break a project. Learn the principles that separate good technical writing from great.",
    coverImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&h=400&fit=crop",
    author: {
      name: "Michael Torres",
      username: "mtorres",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    },
    category: "Writing",
    publishedAt: "Jan 14, 2024",
    readTime: 6,
    likes: 189,
    comments: 23,
  },
  {
    id: "3",
    title: "Building Inclusive Design Systems",
    excerpt: "How to create design systems that work for everyone, from accessibility considerations to cultural sensitivity.",
    coverImage: "https://images.unsplash.com/photo-1559028012-481c04fa702d?w=600&h=400&fit=crop",
    author: {
      name: "Emma Wilson",
      username: "emmaw",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    },
    category: "Design",
    publishedAt: "Jan 13, 2024",
    readTime: 10,
    likes: 256,
    comments: 34,
  },
  {
    id: "4",
    title: "The Psychology Behind Great User Experiences",
    excerpt: "Understanding cognitive biases and mental models to create products that feel intuitive and delightful.",
    coverImage: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&h=400&fit=crop",
    author: {
      name: "David Kim",
      username: "davidk",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    },
    category: "UX",
    publishedAt: "Jan 12, 2024",
    readTime: 7,
    likes: 198,
    comments: 28,
  },
];

const FeaturedPosts = () => {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="heading-title mb-2">Featured Stories</h2>
            <p className="text-muted-foreground">Curated reads from our community</p>
          </div>
        </div>

        {/* Featured post */}
        <div className="mb-8">
          <PostCard {...featuredPost} variant="featured" />
        </div>

        {/* Recent posts grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentPosts.map((post, index) => (
            <div 
              key={post.id} 
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <PostCard {...post} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedPosts;
