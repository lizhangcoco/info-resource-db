import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Business from "@/components/Business";
import DataCenter from "@/components/DataCenter";
import NewsCenter from "@/components/NewsCenter";
import Policy from "@/components/Policy";
import Partners from "@/components/Partners";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="relative">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Business />
        <DataCenter />
        <NewsCenter />
        <Policy />
        <Partners />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
