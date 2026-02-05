import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-secondary/50 to-background py-16 md:py-24">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-20 -left-20 h-60 w-60 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            <span>Where ideas find their voice</span>
          </div>

          {/* Main heading */}
          <h1 className="heading-display mb-6 animate-slide-up">
            Stories that inspire,
            <br />
            <span className="text-primary">ideas that matter</span>
          </h1>

          {/* Subheading */}
          <p className="prose-body text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up delay-100">
            Join a community of thoughtful writers and curious readers. Discover articles
            that challenge your thinking and share your own unique perspective with the world.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up delay-200">
            <Button size="lg" className="btn-editorial text-base px-8" asChild>
              <Link to="/explore">
                Start Reading
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="btn-editorial-outline text-base px-8" asChild>
              <Link to="/auth?mode=signup">
                Become a Writer
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 md:gap-12 mt-12 pt-8 border-t border-border/50 animate-fade-in delay-300">
            <div className="text-center">
              <p className="font-serif text-2xl md:text-3xl font-semibold">10K+</p>
              <p className="text-sm text-muted-foreground">Articles</p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <p className="font-serif text-2xl md:text-3xl font-semibold">5K+</p>
              <p className="text-sm text-muted-foreground">Writers</p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <p className="font-serif text-2xl md:text-3xl font-semibold">50K+</p>
              <p className="text-sm text-muted-foreground">Readers</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
