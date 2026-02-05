import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import FeaturedPosts from "@/components/home/FeaturedPosts";
import TrendingSection from "@/components/home/TrendingSection";
import AuthorsSpotlight from "@/components/home/AuthorsSpotlight";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturedPosts />
        <TrendingSection />
        <AuthorsSpotlight />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
