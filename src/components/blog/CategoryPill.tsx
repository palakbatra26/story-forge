import { Link } from "react-router-dom";

interface CategoryPillProps {
  name: string;
  slug: string;
  count?: number;
  isActive?: boolean;
}

const CategoryPill = ({ name, slug, count, isActive = false }: CategoryPillProps) => {
  return (
    <Link
      to={`/category/${slug}`}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary"
      }`}
    >
      {name}
      {count !== undefined && (
        <span className={`text-xs ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          ({count})
        </span>
      )}
    </Link>
  );
};

export default CategoryPill;
