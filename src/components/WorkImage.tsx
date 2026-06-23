import { useState, useEffect } from "react";
import { MdArrowOutward } from "react-icons/md";

interface Props {
  image: string;
  alt?: string;
  video?: string;
  link?: string;
  images?: string[];
}

const WorkImage = (props: Props) => {
  const [isVideo, setIsVideo] = useState(false);
  const [video, setVideo] = useState("");

  // Slideshow: only when 2+ images are supplied
  const slides =
    props.images && props.images.length > 1 ? props.images : null;
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    if (!slides) return;
    const id = setInterval(
      () => setSlide((s) => (s + 1) % slides.length),
      2400
    );
    return () => clearInterval(id);
  }, [slides?.length]);

  const currentImage = slides ? slides[slide] : props.image;

  const handleMouseEnter = async () => {
    if (props.video) {
      setIsVideo(true);
      const response = await fetch(`src/assets/${props.video}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setVideo(blobUrl);
    }
  };

  return (
    <div className="work-image">
      <a
        className="work-image-in"
        href={props.link}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVideo(false)}
        target="_blank"
        data-cursor={"disable"}
      >
        {props.link && (
          <div className="work-link">
            <MdArrowOutward />
          </div>
        )}
        <img key={currentImage} className="work-slide-img" src={currentImage} alt={props.alt} />
        {isVideo && <video src={video} autoPlay muted playsInline loop></video>}
        {slides && (
          <div className="work-slideshow-dots">
            {slides.map((_, i) => (
              <span
                key={i}
                className={i === slide ? "active" : ""}
              ></span>
            ))}
          </div>
        )}
      </a>
    </div>
  );
};

export default WorkImage;
