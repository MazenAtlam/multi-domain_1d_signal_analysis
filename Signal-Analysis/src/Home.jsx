import Navbar from "./Components/Home/Navbar";
import Section1 from "./Components/Home/Section1";
import Section2 from "./Components/Home/Section2";
import Section3 from "./Components/Home/Section3";
import ScrollToTopButton from "./Components/Home/ScrollToUparrow";

export default function Home() {
  return (
    <div>
      <Navbar />
      <Section1 />
      <Section2 />
      <Section3 />
      <ScrollToTopButton />
    </div>
  );
}
