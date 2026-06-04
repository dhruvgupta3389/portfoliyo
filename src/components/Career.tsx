import "./styles/Career.css";

const Career = () => {
  return (
    <div className="career-section section-container">
      <div className="career-container">
        <h2>
          My career <span>&</span>
          <br /> experience
        </h2>
        <div className="career-info">
          <div className="career-timeline">
            <div className="career-dot"></div>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>Tech & PR Team Head</h4>
                <h5>Microsoft · MLSA</h5>
              </div>
              <h3>2023–24</h3>
            </div>
            <p>
              Tech Team Head and PR Team Head at the Microsoft Learn Student
              Ambassadors chapter (2023–2024). Led 2+ technical workshops on
              full-stack dev and applied AI, reaching 20+ developers across campus
              and partner institutions. Mentored 5+ engineers, organized 2+
              hackathons, and helped run a 100+ member MLSA chapter under the AKTU
              network.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>Freelance Engineer</h4>
                <h5>3 Production Clients</h5>
              </div>
              <h3>ONGOING</h3>
            </div>
            <p>
              Delivered 3 production apps — e-commerce, booking portal, and admin
              dashboard — with 100% on-time completion and sub-2s load times.
              Integrated WhatsApp Business API, payment gateways, and JWT auth.
              Managed full lifecycle: discovery → architecture → deployment →
              client handoff.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>B.Tech CSE</h4>
                <h5>MIET · AKTU</h5>
              </div>
              <h3>2022–26</h3>
            </div>
            <p>
              Computer Science & Engineering with AI Specialization at Meerut
              Institute of Engineering & Technology, affiliated to AKTU. Building
              AI-integrated systems and full-stack applications alongside academics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Career;
