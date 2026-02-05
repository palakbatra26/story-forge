import { Link } from "react-router-dom";
import { Calendar, Clock, Heart, MessageCircle, Bookmark } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface PostCardProps {
  id: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  author: {
    name: string;
    avatar?: string;
    username: string;
  };
  category: string;
  publishedAt: string;
  readTime: number;
  likes: number;
  comments: number;
  variant?: "default" | "featured" | "compact";
}

const PostCard = ({
  id,
  title,
  excerpt,
  coverImage,
  author,
  category,
  publishedAt,
  readTime,
  likes,
  comments,
  variant = "default",
}: PostCardProps) => {
  if (variant === "featured") {
    return (
      <article className="group relative overflow-hidden rounded-2xl bg-card">
        <Link to={`/post/${id}`} className="block">
          <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden">
            {coverImage ? (
              <img
                src={coverImage}
                alt={title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20" />
            )}
            <div className="gradient-overlay" />
            
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
              <span className="tag tag-primary w-fit mb-3">{category}</span>
              <h2 className="heading-title text-white mb-3 line-clamp-2 group-hover:underline decoration-2 underline-offset-4">
                {title}
              </h2>
              <p className="text-white/80 text-sm md:text-base line-clamp-2 mb-4 max-w-2xl">
                {excerpt}
              </p>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border-2 border-white/30">
                    <AvatarImage src={author.avatar} alt={author.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {author.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white/90 text-sm font-medium">{author.name}</span>
                </div>
                <span className="text-white/60 text-sm">·</span>
                <div className="flex items-center gap-1 text-white/70 text-sm">
                  <Calendar className="h-4 w-4" />
                  {publishedAt}
                </div>
                <span className="text-white/60 text-sm">·</span>
                <div className="flex items-center gap-1 text-white/70 text-sm">
                  <Clock className="h-4 w-4" />
                  {readTime} min read
                </div>
              </div>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="group flex gap-4 py-4">
        <Link to={`/post/${id}`} className="flex-1 min-w-0">
          <span className="text-xs font-medium text-primary mb-1 block">{category}</span>
          <h3 className="font-serif text-base font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>{author.name}</span>
            <span>·</span>
            <span>{readTime} min</span>
          </div>
        </Link>
        {coverImage && (
          <Link to={`/post/${id}`} className="shrink-0">
            <img
              src={coverImage}
              alt={title}
              className="h-16 w-16 rounded-lg object-cover"
            />
          </Link>
        )}
      </article>
    );
  }

  return (
    <article className="card-editorial overflow-hidden">
      <Link to={`/post/${id}`} className="block">
        {coverImage && (
          <div className="relative aspect-[16/10] overflow-hidden">
            <img
              src={coverImage}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
      </Link>
      
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="tag">{category}</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {readTime} min read
          </div>
        </div>
        
        <Link to={`/post/${id}`}>
          <h3 className="font-serif text-lg font-semibold leading-snug mb-2 line-clamp-2 hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {excerpt}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <Link to={`/author/${author.username}`} className="flex items-center gap-2 group/author">
            <Avatar className="h-7 w-7">
              <AvatarImage src={author.avatar} alt={author.name} />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                {author.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium group-hover/author:text-primary transition-colors">
              {author.name}
            </span>
          </Link>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
              <Heart className="h-4 w-4" />
              <span className="text-xs">{likes}</span>
            </button>
            <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">{comments}</span>
            </button>
            <button className="text-muted-foreground hover:text-primary transition-colors">
              <Bookmark className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
