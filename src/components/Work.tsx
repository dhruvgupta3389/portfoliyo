import { useState, useCallback } from "react";
import "./styles/Work.css";
import WorkImage from "./WorkImage";
import { MdArrowBack, MdArrowForward } from "react-icons/md";

type Project = {
  title: string;
  category: string;
  tools: string;
  image: string;
  link: string;
  badge: "Live" | "Private";
  images?: string[];
};

const projects: Project[] = [
  {
    title: "Military Offline Mapping",
    category: "Defense Offline-First Platform",
    tools: "Python · FastAPI · Leaflet.js · WebSockets · SQLite · LoRa",
    image: "/images/proj-offline-1.jpg",
    images: [
      "/images/proj-offline-1.jpg",
      "/images/proj-offline-2.jpg",
      "/images/proj-offline-3.jpg",
    ],
    link: "https://github.com/dhruvgupta3389/offline_map",
    badge: "Private",
  },
  {
    title: "AI Answer Sheet Evaluator",
    category: "OCR + NLP Grading System · Final Year Project",
    tools: "Python · OpenCV · Tesseract OCR · FastAPI · React.js",
    image: "/images/proj-answersheet-1.png",
    images: [
      "/images/proj-answersheet-1.png",
      "/images/proj-answersheet-2.png",
      "/images/proj-answersheet-3.png",
      "/images/proj-answersheet-4.png",
    ],
    link: "https://github.com/dhruvgupta3389/final_year_project",
    badge: "Private",
  },
  {
    title: "MIT Meerut Website",
    category: "College Institutional Website",
    tools: "Web · CMS · Responsive UI",
    image: "/images/proj-mitmeerut.png",
    link: "http://mitmeerut.ac.in/",
    badge: "Live",
  },
  {
    title: "SH Essentials",
    category: "Sustainable-Fashion E-commerce",
    tools: "React · E-commerce · Payments · Vercel",
    image: "/images/proj-shessentials.png",
    link: "https://www.shessentials.in/",
    badge: "Live",
  },
  {
    title: "MIT QR Registrar",
    category: "Campus Visitor Registration Portal",
    tools: "React · QR · Google Auth · Vercel",
    image: "/images/proj-mitqr.png",
    link: "https://mit-qr-registrar.vercel.app/qr/register",
    badge: "Live",
  },
  {
    title: "Drivya.AI",
    category: "AI B2B Partner-Matching Platform",
    tools: "React · AI Matching · Compatibility Scoring · Vercel",
    image: "/images/proj-drivyaai.png",
    link: "https://drivyaai.vercel.app/",
    badge: "Live",
  },
  {
    title: "Shubharkar",
    category: "Student Management System",
    tools: "React · Dashboard · Student Records · Attendance",
    image: "/images/proj-shubharkar.png",
    link: "https://shubharkar.vercel.app/",
    badge: "Live",
  },
  {
    title: "AI Vulnerability Scanner",
    category: "AI-Based Security Platform",
    tools: "Python · FastAPI · OpenAI API · React.js · MongoDB · Docker",
    image: "/images/placeholder.webp",
    link: "https://github.com/dhruvgupta3389/scaner",
    badge: "Private",
  },
];

const Work = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goToSlide = useCallback(
    (index: number) => {
      if (isAnimating) return;
      setIsAnimating(true);
      setCurrentIndex(index);
      setTimeout(() => setIsAnimating(false), 500);
    },
    [isAnimating]
  );

  const goToPrev = useCallback(() => {
    const newIndex =
      currentIndex === 0 ? projects.length - 1 : currentIndex - 1;
    goToSlide(newIndex);
  }, [currentIndex, goToSlide]);

  const goToNext = useCallback(() => {
    const newIndex =
      currentIndex === projects.length - 1 ? 0 : currentIndex + 1;
    goToSlide(newIndex);
  }, [currentIndex, goToSlide]);

  return (
    <div className="work-section" id="work">
      <div className="work-container section-container">
        <h2>
          My <span>Work</span>
        </h2>

        <div className="carousel-wrapper">
          {/* Navigation Arrows */}
          <button
            className="carousel-arrow carousel-arrow-left"
            onClick={goToPrev}
            aria-label="Previous project"
            data-cursor="disable"
          >
            <MdArrowBack />
          </button>
          <button
            className="carousel-arrow carousel-arrow-right"
            onClick={goToNext}
            aria-label="Next project"
            data-cursor="disable"
          >
            <MdArrowForward />
          </button>

          {/* Slides */}
          <div className="carousel-track-container">
            <div
              className="carousel-track"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              {projects.map((project, index) => (
                <div className="carousel-slide" key={index}>
                  <div className="carousel-content">
                    <div className="carousel-info">
                      <div className="carousel-number">
                        <h3>0{index + 1}</h3>
                      </div>
                      <div className="carousel-details">
                        <div className="carousel-title-row">
                          <h4>{project.title}</h4>
                          <span
                            className={`work-badge work-badge-${project.badge.toLowerCase()}`}
                          >
                            {project.badge === "Private"
                              ? "Private · request access"
                              : "Live"}
                          </span>
                        </div>
                        <p className="carousel-category">
                          {project.category}
                        </p>
                        <div className="carousel-tools">
                          <span className="tools-label">Tools & Features</span>
                          <p>{project.tools}</p>
                        </div>
                      </div>
                    </div>
                    <div className="carousel-image-wrapper">
                      <WorkImage
                        image={project.image}
                        images={project.images}
                        alt={project.title}
                        link={project.link}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dot Indicators */}
          <div className="carousel-dots">
            {projects.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === currentIndex ? "carousel-dot-active" : ""
                  }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to project ${index + 1}`}
                data-cursor="disable"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Work;
