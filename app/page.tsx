import Navbar from "@/components/Navbar";
import Quote from "@/components/Quote";
import Program from "@/components/Program";
import ThreeCardCarousel from "@/components/Cards";
import Sfzi from "@/components/Sfzi";
import Footer from "@/components/Footer";
import Events from "@/components/Events";
import Donate from "@/components/Donate";

import HeroSection from "@/components/HeroSection";
import Background from "@/components/spec/background";

export default function Home() {
  return (
    <>
      <Background classname="top-[50vh] opacity-30" />
      <HeroSection />
      <Program />
      <Events />
      <ThreeCardCarousel />
      <Sfzi />
      <Donate />
    </>
  );
}
