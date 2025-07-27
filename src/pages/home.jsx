import React, { useState, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Link, useNavigate } from "react-router-dom";
import "remixicon/fonts/remixicon.css";
import LexChatbot from "../components/LexChatbot";

function Home() {
  const [showContent, setShowContent] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const navigate = useNavigate();

  // Add 'home-page' class to body
  useEffect(() => {
    document.body.classList.add("home-page");
    return () => document.body.classList.remove("home-page");
  }, []);

  // Loader animation
  useGSAP(() => {
    const tl = gsap.timeline();

    tl.to(".vi-mask-group", {
      rotate: 10,
      duration: 2,
      ease: "Power4.easeInOut",
      transformOrigin: "50% 50%",
    }).to(".vi-mask-group", {
      scale: 10,
      duration: 2,
      delay: -1.8,
      ease: "Expo.easeInOut",
      transformOrigin: "50% 50%",
      opacity: 0,
      onComplete: () => {
        setShowLoader(false);
        setShowContent(true);
      },
    });
  }, []);

  // Main content animation
  useGSAP(() => {
    if (!showContent) return;

    const tl = gsap.timeline({
      defaults: { duration: 2, ease: "Expo.easeInOut" },
    });

    gsap.set(".main", { autoAlpha: 0 });

    tl.to(".main", { autoAlpha: 1, duration: 0.5 })
      .to(".main", { scale: 1, rotate: 0 }, "<")
      .to(".sky", { scale: 1.1, rotate: 0 }, "<0.2")
      .to(".bg", { scale: 1.1, rotate: 0 }, "<0.1")
      .to(".character", {
        scale: 1.4,
        x: "-50%",
        bottom: "-25%",
        rotate: 0,
      }, "<0.1")
      .to(".text", { scale: 1, rotate: 0 }, "<0.1");

    const main = document.querySelector(".main");

    main?.addEventListener("mousemove", (e) => {
      const xMove = (e.clientX / window.innerWidth - 0.5) * 40;
      gsap.to(".main .text", { x: `${xMove * 0.4}%` });
      gsap.to(".sky", { x: xMove });
      gsap.to(".bg", { x: xMove * 1.7 });
    });
  }, [showContent]);

  return (
    <>
      {showLoader && (
        <div className="svg flex items-center justify-center fixed top-0 left-0 z-[100] w-full h-screen overflow-hidden bg-[#000]">
          <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
            <defs>
              <mask id="viMask">
                <rect width="100%" height="100%" fill="black" />
                <g className="vi-mask-group">
                  <text
                    x="50%"
                    y="50%"
                    fontSize="250"
                    textAnchor="middle"
                    fill="white"
                    dominantBaseline="middle"
                    fontFamily="Poppins"
                  >
                    L  E  X
                  </text>
                </g>
              </mask>
            </defs>
            <image
              href="./bg.png"
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid slice"
              mask="url(#viMask)"
            />
          </svg>
        </div>
      )}

      <div
        className="main w-full rotate-[-10deg] scale-[1.7]"
        style={{
          visibility: showContent ? "visible" : "hidden",
          opacity: 0,
        }}
      >
        <div className="landing overflow-hidden relative w-full min-h-screen bg-black">
          {/* Navbar */}
          <nav className="absolute top-0 left-0 z-[10] w-full py-4 sm:py-6 lg:py-10 px-4 sm:px-6 lg:px-10 flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
              <div className="lines flex flex-col gap-[3px] sm:gap-[4px] lg:gap-[5px] cursor-pointer">
                <div className="line w-4 sm:w-5 lg:w-6 h-[2px] sm:h-[3px] lg:h-1 bg-white"></div>
                <div className="line w-3 sm:w-4 lg:w-4 h-[2px] sm:h-[3px] lg:h-1 bg-white"></div>
                <div className="line w-2 sm:w-3 lg:w-3 h-[2px] sm:h-[3px] lg:h-1 bg-white"></div>
              </div>
              <Link
                to="/dashboard"
                className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold hover:text-yellow-400 transition duration-300"
              >
                Dash-Board
              </Link>
            </div>
          </nav>

          {/* Image & Title Text */}
          <div className="imagesdiv relative overflow-hidden w-full h-screen">
            <img
              className="absolute sky scale-[1.5] rotate-[-20deg] top-0 left-0 w-full h-full object-cover"
              src="./sky.png"
              alt=""
            />
            <img
              className="absolute scale-[1.8] rotate-[-3deg] bg top-0 left-0 w-full h-full object-cover"
              src="./bg.png"
              alt=""
            />
            <div className="text text-white flex flex-col gap-1 sm:gap-2 lg:gap-3 absolute top-20 left-1/2 -translate-x-1/2 scale-[1.4] rotate-[-10deg]">
              <h1 className="text-[6rem] sm:text-[8rem] lg:text-[12rem] leading-none -ml-20 sm:-ml-30 lg:-ml-40">Ro</h1>
              <h1 className="text-[6rem] sm:text-[8rem] lg:text-[12rem] leading-none ml-10 sm:ml-15 lg:ml-20">Lex</h1>
              <h1 className="text-[6rem] sm:text-[8rem] lg:text-[12rem] leading-none -ml-20 sm:-ml-30 lg:-ml-40">finance</h1>
            </div>
            <img
              className="absolute character -bottom-[5%] left-1/2 -translate-x-1/2 scale-50 opacity-70 rotate-[-20deg] transition-all duration-500"
              src="./8ballpool.png"
              alt=""
            />
          </div>

          {/* Bottom Bar */}
          <div className="btmbar text-white absolute bottom-0 left-0 w-full py-8 sm:py-10 lg:py-15 px-4 sm:px-6 lg:px-10 bg-gradient-to-t from-black to-transparent">
            <div className="flex gap-2 sm:gap-3 lg:gap-4 items-center">
              <i className="text-2xl sm:text-3xl lg:text-4xl ri-arrow-down-line"></i>
              <h3 className="text-base sm:text-lg lg:text-xl font-medium">Scroll Down</h3>
            </div>
            <img
              className="absolute h-[35px] sm:h-[45px] lg:h-[55px] w-[100px] sm:w-[130px] lg:w-[160px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-x-90 filter hue-rotate-[150deg] brightness-110 contrast-110 transition-all duration-500"
              src="./logo.jpg"
              alt=""
            />
          </div>
        </div>

        {/* Scrollable Info Section */}
        <div className="w-full min-h-screen bg-black px-4 sm:px-6 lg:px-8 py-16">
          <div className="cntnr flex flex-col lg:flex-row gap-16 lg:gap-12 items-start justify-center">
            
            {/* Left - Chatbot Section */}
            <div className="limg w-full lg:w-1/2 flex justify-center items-center relative">
              <div className="relative w-full max-w-2xl h-[550px] bg-zinc-900 rounded-3xl shadow-lg overflow-hidden p-6">
                {/* Background Image */}
                <img
                  className="absolute top-1/2 left-1/2 w-auto scale-[0.5] -translate-x-1/2 -translate-y-1/2 opacity-20 blur-md z-0"
                  src="./scroll.jpg"
                  alt=""
                />
                {/* Text and Chatbot */}
                <div className="relative z-20 flex flex-col items-center text-center space-y-6">
                  <h3 className="text-3xl font-bold text-yellow-400 font-serif">Meet Lex</h3>
                  <p className="text-lg text-gray-300 max-w-md font-sans">
                    Your intelligent financial assistant. Lex can help you find the perfect calculator for your financial needs.
                  </p>
                  <div className="font-lex w-full max-w-md">
                    <LexChatbot />
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Info Text Section */}
            <div className="rg w-full lg:w-[40%]">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-tight text-white">Still Running,</h1>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-tight text-white mb-6">Never Chasing</h1>

              <p className="mt-4 text-lg text-gray-300 font-[Helvetica_Now_Display]">
                At RoLex Finance, we don’t chase wealth — we craft it. With precision, purpose, and data-backed insight, we empower you to design a financial future that aligns with your goals — not guesswork.
              </p>

              <p className="mt-4 text-lg text-gray-300 font-[Helvetica_Now_Display]">
                We bring clarity to complexity — turning financial planning into a seamless, intuitive experience. No clutter, no confusion — just informed, confident decisions.
              </p>

              <p className="mt-4 text-lg text-gray-300 font-[Helvetica_Now_Display]">
                Whether you’re securing your first loan, planning your retirement, or building generational wealth, RoLex is your intelligent partner — helping you move forward with intention and elegance.
              </p>

              <button
                onClick={() => navigate("/dashboard")}
                className="bg-yellow-500 px-8 py-4 text-black mt-8 text-2xl rounded-lg shadow hover:bg-yellow-400 transition"
              >
                Try Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
