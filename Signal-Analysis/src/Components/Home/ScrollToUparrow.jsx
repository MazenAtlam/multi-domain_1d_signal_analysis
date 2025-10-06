import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const buttonStyle = {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "60px",
    height: "60px",
    border: "none",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    color: "white",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
    transition: "all 0.3s ease",
    zIndex: 1000,
  };

  const hoverStyle = {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.4)",
    background: "linear-gradient(135deg, #2563eb, #1e40af)",
  };

  const [currentStyle, setCurrentStyle] = useState(buttonStyle);

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          style={currentStyle}
          onMouseEnter={() =>
            setCurrentStyle({ ...buttonStyle, ...hoverStyle })
          }
          onMouseLeave={() => setCurrentStyle(buttonStyle)}
          aria-label="Scroll to top"
        >
          <ChevronUp size={24} />
          <span
            style={{ fontSize: "18px", fontWeight: "bold", lineHeight: 1 }}
          ></span>
        </button>
      )}
    </>
  );
}
