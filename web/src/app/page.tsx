import Header from "@/components/Header";
import Hero from "@/components/Hero";
import RoleCards from "@/components/RoleCards";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import TeacherCta from "@/components/TeacherCta";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <RoleCards />
        <HowItWorks />
        <Features />
        <TeacherCta />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
