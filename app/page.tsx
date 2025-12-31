import Background from "@/components/optimized/Background";
import HeroSection from "@/components/optimized/HeroSection";
import Events from "@/components/optimized/sections/Programari";
import Program from "@/components/optimized/sections/Program";
import Saints from '@/components/optimized/sections/Saints';
import ThreeCardCarousel from "@/components/Cards";
import DonatePage from "@/components/optimized/sections/Donate";
import Footer from "@/components/optimized/sections/Footer";

// import Footer from "@/components/Footer";

export default function Home() {
  
  return (
    <div className="relative bg-[#dfb84c] overflow-hidden selection:bg-yellow-600 selection:text-black/90" >
      <Background priority className="select-none" />
      <section className="relative">
        <HeroSection />
      </section>

      <section className="flex flex-col gap-24 sm:gap-32 md:gap-44 lg:gap-60 pt-20">
        <Program/>
        <Events/>
      </section>
      <ThreeCardCarousel/>
      <Saints/>
      <DonatePage/>
      <Footer/>
    </div>
  );
}

