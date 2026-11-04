import { MdArrowOutward, MdCopyright, MdMail } from "react-icons/md";
import "./styles/Contact.css";

const Contact = () => {
  return (
    <div className="contact-section section-container" id="contact">
      <div className="contact-container">
        <div className="contact-header">
          <h3>Contact</h3>
          <p className="contact-cta">
            Open to collaborations, freelance work, and full-time roles. Let's
            build something great.
          </p>
          <a
            href="mailto:dhruvgupta33899@gmail.com"
            className="contact-email-btn"
            data-cursor="disable"
          >
            <MdMail /> dhruvgupta33899@gmail.com
          </a>
        </div>

        <div className="contact-cards">
          <div className="contact-card">
            <h4>Connect</h4>
            <p>
              <a
                href="https://www.linkedin.com/in/dhruv-gupta-75a433272/"
                target="_blank"
                rel="noreferrer"
                data-cursor="disable"
              >
                LinkedIn — dhruv-gupta
              </a>
            </p>
            <h4>Education</h4>
            <p>
              B.Tech — Computer Science &amp; Engineering (AI Specialization),
              Meerut Institute of Engineering &amp; Technology (AKTU) —
              2022–2026
            </p>
          </div>

          <div className="contact-card">
            <h4>Social</h4>
            <a
              href="https://github.com/dhruvgupta3389"
              target="_blank"
              rel="noreferrer"
              data-cursor="disable"
              className="contact-social"
            >
              GitHub <MdArrowOutward />
            </a>
            <a
              href="https://www.linkedin.com/in/dhruv-gupta-75a433272/"
              target="_blank"
              rel="noreferrer"
              data-cursor="disable"
              className="contact-social"
            >
              LinkedIn <MdArrowOutward />
            </a>
          </div>

          <div className="contact-card contact-card-attribution">
            <h2>
              Designed &amp; Developed <br /> by <span>Dhruv Gupta</span>
            </h2>
            <h5>
              <MdCopyright /> 2026
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
