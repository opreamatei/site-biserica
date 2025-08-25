import Navbar from "@/components/Navbar";
import Quote from "@/components/Quote";
import Program from "@/components/Program";
import ThreeCardCarousel from "@/components/Cards"
import Sfzi from "@/components/Sfzi";
import Footer from "@/components/Footer";
import Events from "@/components/Events";
import Donate from "@/components/Donate"
import LogoLoader from "@/components/Logoloader";
import QuoteAndProgram from "@/components/QuoteAndProgram";
export default function Home() {


  return (
    <div >

      <LogoLoader>
        <main>
          <Navbar />
        </main>
        <QuoteAndProgram />
        <Events />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />  
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <ThreeCardCarousel />
        <br />
        <Sfzi />
        <br />
        <br />
        <br />
        <br />
        {/* <Donate /> */}
        <br />
        <br />
        <Footer />
      </LogoLoader>
    </div>
  );
}
