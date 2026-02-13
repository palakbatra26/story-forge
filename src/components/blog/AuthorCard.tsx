import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Users } from "lucide-react";

interface AuthorCardProps {
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
  followers: number;
  postsCount: number;
  isVerified?: boolean;
  variant?: "default" | "compact" | "inline";
  profileHref?: string;
  isFollowing?: boolean;
  onFollow?: () => void;
}

const AuthorCard = ({
  username,
  name,
  avatar,
  bio,
  followers,
  postsCount,
  isVerified,
  variant = "default",
  profileHref,
  isFollowing,
  onFollow,
}: AuthorCardProps) => {
  const resolvedProfileHref = profileHref || `/profile/${username}`;

  if (variant === "inline") {
    return (
      <Link to={resolvedProfileHref} className="flex items-center gap-3 group">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium group-hover:text-primary transition-colors">
              {name}
            </p>
            {isVerified && <BadgeCheck className="h-4 w-4 text-sky-500" />}
          </div>
          <p className="text-xs text-muted-foreground">@{username}</p>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
        <Link to={resolvedProfileHref} className="flex items-center gap-3 group">
          <Avatar className="h-11 w-11">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-medium group-hover:text-primary transition-colors">
                {name}
              </p>
              {isVerified && <BadgeCheck className="h-4 w-4 text-sky-500" />}
            </div>
            <p className="text-xs text-muted-foreground">{postsCount} posts</p>
          </div>
        </Link>
        <Button variant="outline" size="sm" className="rounded-full" onClick={onFollow}>
          {isFollowing ? "Following" : "Follow"}
        </Button>
      </div>
    );
  }

  return (
    <div className="card-editorial p-6 text-center">
      <Link to={resolvedProfileHref} className="block group">
        <Avatar className="h-20 w-20 mx-auto mb-4 avatar-ring">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary text-xl">
            {name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <h3 className="font-serif text-lg font-semibold group-hover:text-primary transition-colors">
            {name}
          </h3>
          {isVerified && <BadgeCheck className="h-4 w-4 text-sky-500" />}
        </div>
        <p className="text-sm text-muted-foreground mb-3">@{username}</p>
      </Link>
      
      {bio && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{bio}</p>
      )}
      
      <div className="flex items-center justify-center gap-6 mb-4 text-sm">
        <div>
          <p className="font-semibold">{postsCount}</p>
          <p className="text-muted-foreground text-xs">Posts</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <p className="font-semibold">{followers.toLocaleString()}</p>
          <p className="text-muted-foreground text-xs">Followers</p>
        </div>
      </div>
      
      <Button variant="outline" className="w-full rounded-full" onClick={onFollow}>
        <Users className="h-4 w-4 mr-2" />
        {isFollowing ? "Following" : "Follow"}
      </Button>
    </div>
  );
};

export default AuthorCard;
