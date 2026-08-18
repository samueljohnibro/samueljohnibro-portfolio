import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import './App.css'
const trainingMedia = [
  {
    type: 'image',
    src: '/assets/Cloud Computing Training 1.png',
    alt: 'AWS Cloud Computing Training session at Management Edge LTD',
  },
  {
    type: 'image',
    src: '/assets/Cloud Computing Training 2.png',
    alt: 'AWS Cloud Computing Training at Management Edge LTD',
  },
  {
    type: 'video',
    src: '/assets/Cloud Computing Training 3.mp4',
    alt: 'AWS Cloud Computing Training session at Management Edge LTD',
  },
  {
    type: 'video',
    src: '/assets/Cloud Computing Training 4.mp4',
    alt: 'AWS Cloud Computing Training session at Management Edge LTD',
  },
  {
    type: 'image',
    src: '/assets/Cloud Computing Training 5.png',
    alt: 'AWS Cloud Computing Training session at Management Edge LTD',
  },
  {
    type: 'image',
    src: '/assets/training slides 1.png',
    alt: 'AWS Cloud Computing Training presentation slides',
  },
  {
    type: 'image',
    src: '/assets/training slides 2.png',
    alt: 'AWS Cloud Computing Training presentation slides',
  },
]
/*
=========================
Training configuration
=========================
 */
const SLIDE_DURATION = 700
const IMAGE_DURATION = 3500
/*
=========================
Hero typewriter configuration
=========================
 */
const HERO_TEXT =
  'I build software that solves real problems.'
const HERO_ACCENT_START =
  'I build software that '.length
const TYPEWRITER_SPEED = 55
/*
=========================
Portfolio typography
=========================
 */
const PORTFOLIO_FONT =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
function App() {
  /*
=========================
Training slideshow state
=========================
   */
  const [activeMedia, setActiveMedia] = useState(0)
  const [incomingMedia, setIncomingMedia] = useState(null)
  const [slideDirection, setSlideDirection] = useState('next')
  const [isTransitioning, setIsTransitioning] = useState(false)
  /*
=========================
Hero typewriter state
=========================
   */
  const [typedHeroText, setTypedHeroText] = useState('')
  /*
=========================
Refs
=========================
   */
  const transitionTimerRef = useRef(null)
  const transitionIdRef = useRef(0)
  const imageTimerRef = useRef(null)
  const typewriterTimerRef = useRef(null)
  const videoRefs = useRef({})
  const currentSlideRef = useRef(null)
  const incomingSlideRef = useRef(null)
  const heroSectionRef = useRef(null)
  /*
=========================
Cleanup helpers
=========================
   */
  const clearTransitionTimer = () => {
    if (transitionTimerRef.current) {
      window.clearTimeout(
        transitionTimerRef.current
      )
  transitionTimerRef.current = null
}
  }
  const clearImageTimer = () => {
    if (imageTimerRef.current) {
      window.clearTimeout(
        imageTimerRef.current
      )
  imageTimerRef.current = null
}
  }
  const clearTypewriterTimer = () => {
    if (typewriterTimerRef.current) {
      window.clearTimeout(
        typewriterTimerRef.current
      )
  typewriterTimerRef.current = null
}
  }
  /*
=========================
Hero typewriter
=========================

The text types once when the hero enters the
viewport.

The cursor is a dedicated CSS element rather
than a literal "|" character. This makes the
blinking behavior reliable after typing finishes.
   */
  useEffect(() => {
    const heroElement =
      heroSectionRef.current
if (!heroElement) {
  return undefined
}

if (
  typeof window === 'undefined' ||
  !('IntersectionObserver' in window)
) {
  setTypedHeroText(HERO_TEXT)

  return undefined
}

const observer =
  new IntersectionObserver(
    (entries) => {
      const entry = entries[0]

      if (!entry) {
        return
      }

      if (entry.isIntersecting) {
        clearTypewriterTimer()

        setTypedHeroText('')

        let currentIndex = 0

        const typeNextCharacter = () => {
          currentIndex += 1

          setTypedHeroText(
            HERO_TEXT.slice(
              0,
              currentIndex
            )
          )

          if (
            currentIndex <
            HERO_TEXT.length
          ) {
            typewriterTimerRef.current =
              window.setTimeout(
                typeNextCharacter,
                TYPEWRITER_SPEED
              )
          } else {
            typewriterTimerRef.current =
              null
          }
        }

        typewriterTimerRef.current =
          window.setTimeout(
            typeNextCharacter,
            TYPEWRITER_SPEED
          )
      } else {
        clearTypewriterTimer()

        setTypedHeroText('')
      }
    },
    {
      threshold: 0.35,
    }
  )

observer.observe(heroElement)

return () => {
  observer.disconnect()
  clearTypewriterTimer()
}
  }, [])
  /*
=========================
Video helpers
=========================
   */
  const registerVideo = (
    index,
    element
  ) => {
    if (element) {
      videoRefs.current[index] =
        element
    } else {
      delete videoRefs.current[index]
    }
  }
  const pauseAllVideos = () => {
    Object.values(
      videoRefs.current
    ).forEach((video) => {
      if (!video) {
        return
      }
  video.pause()

  try {
    video.currentTime = 0
  } catch {
    // Ignore browser timing restrictions.
  }
})
  }
  /*
=========================
Finish slideshow transition
=========================
   */
  const finishTransition = (
    nextIndex,
    transitionId
  ) => {
    if (
      transitionId !== transitionIdRef.current
    ) {
      return
    }
clearTransitionTimer()

pauseAllVideos()

setActiveMedia(nextIndex)
setIncomingMedia(null)
setIsTransitioning(false)
  }
  /*
=========================
Training slideshow
=========================

The outgoing and incoming media remain mounted
together during the transition.

NEXT:

Current:   0% -> -100%
Incoming: +100% -> 0%

PREVIOUS:

Current:   0% -> +100%
Incoming: -100% -> 0%

Native CSS transform transitions move both slide
elements simultaneously after their initial positions
have been committed to the DOM.
   */
  const changeMedia = (
    nextIndex,
    direction = 'next'
  ) => {
    if (
      nextIndex === activeMedia ||
      nextIndex < 0 ||
      nextIndex >= trainingMedia.length ||
      isTransitioning
    ) {
      return
    }
clearTransitionTimer()
clearImageTimer()

pauseAllVideos()

transitionIdRef.current += 1

const transitionId =
  transitionIdRef.current

setSlideDirection(direction)
setIncomingMedia(nextIndex)
setIsTransitioning(true)

/*
 * Safety fallback.
 *
 * The native CSS transition and transitionend event are
 * responsible for normal completion. This timer exists
 * only as a browser-safety mechanism.
 */

transitionTimerRef.current =
  window.setTimeout(() => {
    if (
      transitionId !==
      transitionIdRef.current
    ) {
      return
    }

    finishTransition(
      nextIndex,
      transitionId
    )
  }, SLIDE_DURATION + 100)
  }
  /*
=========================
Physical slide transition
=========================

React first mounts both slide wrappers in their exact
starting positions. A layout-safe effect then forces
that initial state to be acknowledged before the next
animation frame moves both elements to their
destinations with one native CSS transform transition.
   */
  useLayoutEffect(() => {
    if (
      !isTransitioning ||
      incomingMedia === null
    ) {
      return undefined
    }
const currentSlide =
  currentSlideRef.current

const incomingSlide =
  incomingSlideRef.current

if (
  !currentSlide ||
  !incomingSlide
) {
  return undefined
}

const transitionId =
  transitionIdRef.current

const expectedIncomingMedia =
  incomingMedia

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches

if (reducedMotion) {
  finishTransition(
    incomingMedia,
    transitionId
  )

  return undefined
}

const handleTransitionEnd = (
  event
) => {
  if (
    event.target !== incomingSlide ||
    event.propertyName !== 'transform' ||
    !isTransitioning ||
    incomingMedia !==
      expectedIncomingMedia ||
    transitionId !==
      transitionIdRef.current
  ) {
    return
  }

  finishTransition(
    expectedIncomingMedia,
    transitionId
  )
}

incomingSlide.addEventListener(
  'transitionend',
  handleTransitionEnd
)

/*
 * Force a layout read so the browser has acknowledged
 * the exact initial transform positions before the next
 * animation frame applies the destination transforms.
 */

currentSlide.offsetWidth

const frameId =
  window.requestAnimationFrame(() => {
    if (
      transitionId !==
      transitionIdRef.current ||
      !isTransitioning ||
      incomingMedia === null
    ) {
      return
    }

    const isNext =
      slideDirection === 'next'

    currentSlide.style.transform =
      isNext
        ? 'translate3d(-100%, 0, 0)'
        : 'translate3d(100%, 0, 0)'

    incomingSlide.style.transform =
      'translate3d(0, 0, 0)'
  })

return () => {
  window.cancelAnimationFrame(
    frameId
  )

  incomingSlide.removeEventListener(
    'transitionend',
    handleTransitionEnd
  )
}
  }, [
    isTransitioning,
    incomingMedia,
    slideDirection,
  ])
  /*
=========================
Previous / next controls
=========================
   */
  const previousMedia = () => {
    if (isTransitioning) {
      return
    }
const previousIndex =
  activeMedia === 0
    ? trainingMedia.length - 1
    : activeMedia - 1

changeMedia(
  previousIndex,
  'previous'
)
  }
  const nextMedia = () => {
    if (isTransitioning) {
      return
    }
const nextIndex =
  activeMedia ===
  trainingMedia.length - 1
    ? 0
    : activeMedia + 1

changeMedia(
  nextIndex,
  'next'
)
  }
  /*
=========================
Indicator selection
=========================
   */
  const selectMedia = (index) => {
    if (
      index === activeMedia ||
      index < 0 ||
      index >= trainingMedia.length ||
      isTransitioning
    ) {
      return
    }
const forwardDistance =
  (index -
    activeMedia +
    trainingMedia.length) %
  trainingMedia.length

const backwardDistance =
  (activeMedia -
    index +
    trainingMedia.length) %
  trainingMedia.length

const direction =
  forwardDistance <=
  backwardDistance
    ? 'next'
    : 'previous'

changeMedia(
  index,
  direction
)
  }
  /*
=========================
Video playback
=========================
   */
  const handleVideoEnded = (
    index
  ) => {
    if (
      index === activeMedia &&
      !isTransitioning
    ) {
      nextMedia()
    }
  }
  useEffect(() => {
    const currentMedia =
      trainingMedia[activeMedia]
if (
  !currentMedia ||
  currentMedia.type !== 'video'
) {
  return undefined
}

const video =
  videoRefs.current[activeMedia]

if (!video) {
  return undefined
}

video.muted = true
video.defaultMuted = true
video.playsInline = true

const playVideo = async () => {
  try {
    await video.play()
  } catch {
    /*
     * Muted autoplay can still be rejected
     * by browser policies.
     */
  }
}

if (video.readyState >= 2) {
  playVideo()
} else {
  video.addEventListener(
    'loadeddata',
    playVideo,
    {
      once: true,
    }
  )
}

return () => {
  video.removeEventListener(
    'loadeddata',
    playVideo
  )
}
  }, [activeMedia])
  /*
=========================
Automatic image timing
=========================

Images remain visible for 3.5 seconds.
Videos advance when playback finishes.
   */
  useEffect(() => {
    clearImageTimer()
const currentMedia =
  trainingMedia[activeMedia]

if (
  !currentMedia ||
  currentMedia.type === 'video'
) {
  return undefined
}

imageTimerRef.current =
  window.setTimeout(() => {
    nextMedia()
  }, IMAGE_DURATION)

return () => {
  clearImageTimer()
}
  }, [activeMedia])
  /*
=========================
Component cleanup
=========================
   */
  useEffect(() => {
    return () => {
      clearTransitionTimer()
      clearImageTimer()
      clearTypewriterTimer()
  pauseAllVideos()
}
  }, [])
  /*
=========================
Media renderer
=========================
   */
  const mediaStyle = {
    width: '100%',
    height: '100%',
    display: 'block',
    objectFit: 'cover',
    objectPosition: 'center center',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    pointerEvents: 'none',
    background: '#05070b',
  }
  const renderMedia = (
    media,
    index,
    isIncoming = false
  ) => {
    if (!media) {
      return null
    }
if (media.type === 'image') {
  return (
    <img
      src={media.src}
      alt={media.alt}
      draggable="false"
      style={mediaStyle}
    />
  )
}

return (
  <video
    ref={(element) =>
      registerVideo(
        index,
        element
      )
    }
    src={media.src}
    autoPlay={!isIncoming}
    muted
    playsInline
    preload="auto"
    controls={false}
    disablePictureInPicture
    disableRemotePlayback
    onEnded={() =>
      handleVideoEnded(index)
    }
    aria-label={media.alt}
    draggable="false"
    style={mediaStyle}
  />
)
  }
  /*
=========================
Slideshow CSS classes
=========================
   */
  const currentSlideClassName = [
    'training-media-slide',
    'training-media-current',
  ].join(' ')
  const incomingSlideClassName = [
    'training-media-slide',
    'training-media-incoming',
  ].join(' ')
  /*
=========================
Current / incoming media
=========================
   */
  const currentMedia =
    trainingMedia[activeMedia]
  const incomingMediaItem =
    incomingMedia !== null
      ? trainingMedia[incomingMedia]
      : null
  const displayedMediaIndex =
    incomingMedia !== null
      ? incomingMedia
      : activeMedia
  /*
=========================
Hero text rendering
=========================
   */
  const heroPrimaryText =
    typedHeroText.slice(
      0,
      HERO_ACCENT_START
    )
  const heroAccentText =
    typedHeroText.slice(
      HERO_ACCENT_START
    )
  return (
    <main
      className="portfolio-app"
      style={{
        fontFamily:
          PORTFOLIO_FONT,
      }}
    >
      {/* =====================================================
          Portfolio-specific CSS overrides
          ===================================================== */}
  <style>
    {`
      .portfolio-app,
      .portfolio-app *,
      .portfolio-app h1,
      .portfolio-app h2,
      .portfolio-app h3,
      .portfolio-app h4,
      .portfolio-app h5,
      .portfolio-app h6,
      .portfolio-app p,
      .portfolio-app a,
      .portfolio-app button,
      .portfolio-app span,
      .portfolio-app strong,
      .portfolio-app li {
        font-family: ${PORTFOLIO_FONT} !important;
      }

      .portfolio-app .hero-typewriter {
        font-family: ${PORTFOLIO_FONT} !important;
      }

      .portfolio-app .hero-primary-text {
        color: #d9e0e8;
      }

      .portfolio-app .hero-accent-text {
        color: #3de5f1;
      }

      /*
       * =================================================
       * HERO CURSOR
       * =================================================
       *
       * This is a real CSS caret rather than the literal
       * "|" character.
       *
       * It continuously fades between visible and
       * invisible states after and during typing.
       */

      .portfolio-app .hero-cursor {
        display: inline-block;

        width: 0.055em;
        height: 0.86em;

        margin-left: 0.09em;

        vertical-align: -0.05em;

        background: #3de5f1;

        border-radius: 1px;

        opacity: 1;

        animation:
          portfolioHeroCursorBlink
          0.8s
          steps(1, end)
          infinite;

        will-change: opacity;
      }

      @keyframes portfolioHeroCursorBlink {
        0% {
          opacity: 1;
        }

        49% {
          opacity: 1;
        }

        50% {
          opacity: 0;
        }

        99% {
          opacity: 0;
        }

        100% {
          opacity: 1;
        }
      }

      /*
       * =================================================
       * FIXED NAVIGATION
       * =================================================
       */

      .portfolio-app .navbar {
        position: fixed !important;

        top: 0;
        left: 50%;

        transform: translateX(-50%);

        width:
          min(
            var(--max-width),
            calc(100% - 48px)
          );

        margin: 0 !important;

        padding-top: 22px;
        padding-bottom: 22px;

        z-index: 1000;

        background:
          rgba(
            8,
            10,
            15,
            0.86
          );

        border-bottom:
          1px solid
          rgba(
            255,
            255,
            255,
            0.06
          );

        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
      }

      .portfolio-app .hero-section {
        padding-top: 150px;
      }

      /*
       * =================================================
       * TRAINING SLIDESHOW
       * =================================================
       *
       * The slideshow elements are positioned on top of
       * one another. Their physical horizontal movement
       * is controlled by one native CSS transform
       * transition on the actual slide wrappers.
       */

      .portfolio-app .training-media {
        position: relative;

        width: 100%;

        aspect-ratio: 16 / 9;

        overflow: hidden;

        isolation: isolate;

        background: #05070b;
      }

      .portfolio-app .training-media-slide {
        position: absolute;

        inset: 0;

        width: 100%;
        height: 100%;

        overflow: hidden;

        background: #05070b;

        will-change: transform;

        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      }

      .portfolio-app .training-media-current {
        z-index: 1;
      }

      .portfolio-app .training-media-incoming {
        z-index: 2;
      }

      .portfolio-app
        .training-media-slide
        img,
      .portfolio-app
        .training-media-slide
        video {
        width: 100% !important;

        height: 100% !important;

        display: block;

        object-fit: cover !important;

        object-position:
          center center !important;

        background: #05070b;
      }

      /*
       * =================================================
       * FIXROOMAUN TOP LIVE STATUS
       * =================================================
       *
       * This is the TOP project status indicator.
       *
       * It is deliberately separate from the actual
       * project action button below.
       *
       * The lower button remains:
       * VIEW LIVE PROJECT ↗
       */

      .portfolio-app
        .project-status {
        display: inline-flex;

        align-items: center;

        justify-content: center;

        gap: 7px;

        min-height: 39px;

        padding:
          0 13px;

        border:
          1px solid
          rgba(
            255,
            255,
            255,
            0.09
          );

        border-radius: 999px;

        background:
          rgba(
            255,
            255,
            255,
            0.012
          );

        color:
          rgba(
            230,
            236,
            244,
            0.88
          );

        font-size:
          0.68rem;

        font-weight: 800;

        letter-spacing:
          0.09em;

        line-height: 1;

        text-transform:
          uppercase;

        white-space:
          nowrap;
      }

      /*
       * Only the FixRoomAUN LIVE status gets the
       * glowing indicator.
       */

      .portfolio-app
        .project-card:first-child
        .project-status {
        color:
          rgba(
            230,
            236,
            244,
            0.92
          );
      }

      .portfolio-app
        .project-card:first-child
        .project-status::before {
        content: '';

        width: 7px;

        height: 7px;

        flex-shrink: 0;

        border-radius: 50%;

        background:
          #67e8f9;

        box-shadow:
          0 0 0 3px
            rgba(
              103,
              232,
              249,
              0.09
            ),
          0 0 8px
            rgba(
              103,
              232,
              249,
              0.75
            ),
          0 0 16px
            rgba(
              103,
              232,
              249,
              0.4
            );

        animation:
          fixroomLivePulse
          2s
          ease-in-out
          infinite;
      }

      @keyframes fixroomLivePulse {
        0%,
        100% {
          opacity: 0.75;

          box-shadow:
            0 0 0 3px
              rgba(
                103,
                232,
                249,
                0.07
              ),
            0 0 7px
              rgba(
                103,
                232,
                249,
                0.55
              ),
            0 0 13px
              rgba(
                103,
                232,
                249,
                0.3
              );
        }

        50% {
          opacity: 1;

          box-shadow:
            0 0 0 3px
              rgba(
                103,
                232,
                249,
                0.12
              ),
            0 0 10px
              rgba(
                103,
                232,
                249,
                0.85
              ),
            0 0 20px
              rgba(
                103,
                232,
                249,
                0.48
              );
        }
      }

      /*
       * =================================================
       * FIXROOMAUN LIVE PROJECT BUTTON
       * =================================================
       *
       * This remains the actual project button.
       * Its text is intentionally unchanged.
       */

      .portfolio-app
        .fixroom-live-link {
        width: fit-content;

        display: inline-flex;

        align-items: center;

        justify-content: center;

        gap: 7px;

        margin-top: 20px;

        padding:
          7px 11px;

        border:
          1px solid
          rgba(
            103,
            232,
            249,
            0.22
          );

        border-radius: 999px;

        background:
          rgba(
            103,
            232,
            249,
            0.035
          );

        color: #67e8f9;

        font-size:
          0.67rem;

        font-weight: 800;

        letter-spacing:
          0.08em;

        line-height: 1;

        text-transform:
          uppercase;

        transition:
          transform 0.2s ease,
          border-color 0.2s ease,
          background 0.2s ease,
          color 0.2s ease;
      }

      .portfolio-app
        .fixroom-live-link:hover {
        transform:
          translateY(-2px);

        border-color:
          rgba(
            103,
            232,
            249,
            0.48
          );

        background:
          rgba(
            103,
            232,
            249,
            0.08
          );

        color: #a5f3fc;
      }

      .portfolio-app
        .fixroom-live-dot {
        width: 6px;

        height: 6px;

        flex-shrink: 0;

        border-radius: 50%;

        background:
          #67e8f9;

        box-shadow:
          0 0 0 3px
            rgba(
              103,
              232,
              249,
              0.08
            ),
          0 0 10px
            rgba(
              103,
              232,
              249,
              0.5
            );
      }

      .portfolio-app
        .fixroom-live-arrow {
        font-size:
          0.8rem;

        line-height: 1;
      }

      /*
       * =================================================
       * MOBILE NAVIGATION
       * =================================================
       */

      @media (max-width: 760px) {
        .portfolio-app .navbar {
          width:
            min(
              var(--max-width),
              calc(100% - 32px)
            );

          padding-top:
            18px;

          padding-bottom:
            18px;
        }

        .portfolio-app
          .hero-section {
          padding-top:
            125px;
        }
      }

      @media (max-width: 480px) {
        .portfolio-app .navbar {
          width:
            calc(100% - 32px);

          padding-top:
            16px;

          padding-bottom:
            16px;
        }

        .portfolio-app
          .hero-section {
          padding-top:
            120px;
        }
      }

      @media (max-width: 380px) {
        .portfolio-app .navbar {
          width:
            calc(100% - 32px);

          flex-direction:
            row;

          align-items:
            flex-start;
        }

        .portfolio-app
          .navbar nav {
          width:
            auto;

          justify-content:
            flex-end;
        }

        .portfolio-app
          .hero-section {
          padding-top:
            145px;
        }
      }

      /*
       * =================================================
       * REDUCED MOTION
       * =================================================
       *
       * The slideshow remains functional without
       * animation if reduced motion is requested.
       *
       * The hero cursor intentionally continues blinking
       * because its blinking is part of the requested
       * visual design rather than page movement.
       */

      @media (prefers-reduced-motion: reduce) {
        .portfolio-app
          .training-media-slide {
          transition:
            none !important;
        }
      }
    `}
  </style>

  {/* =========================
      Navigation
      ========================= */}

  <header className="navbar">
    <a
      href="#home"
      className="brand"
    >
      Samuel John-Ibro
    </a>

    <nav>
      <a href="#about">
        About
      </a>

      <a href="#projects">
        Projects
      </a>

      <a href="#skills">
        Skills
      </a>

      <a href="#training">
        Training
      </a>

      <a href="#credentials">
        Credentials
      </a>

      <a href="#contact">
        Contact
      </a>
    </nav>
  </header>

  {/* =========================
      Hero
      ========================= */}

  <section
    id="home"
    className="hero-section"
    ref={heroSectionRef}
  >
    <p className="eyebrow">
      SOFTWARE ENGINEER • FOUNDER • BUILDER • QA TESTER
    </p>

    <h1
      aria-label={HERO_TEXT}
    >
      <span
        className="hero-typewriter"
        aria-hidden="true"
      >
        <span className="hero-primary-text">
          {heroPrimaryText}
        </span>

        <span className="hero-accent-text">
          {heroAccentText}
        </span>

        <span
          className="hero-cursor"
          aria-hidden="true"
        />
      </span>
    </h1>

    <p className="hero-description">
      I'm Samuel Silachomka John-Ibro, a Software
      Engineer and AWS-certified developer focused
      on software development, cloud, AI, backend
      systems, and quality engineering. I'm also the
      founder of chomkaTECH™, a software and
      technology company focused on building practical
      digital products and solutions.
    </p>

    <div className="hero-actions">
      <a
        href="#projects"
        className="primary-button"
      >
        View my work
      </a>

      <a
        href="#contact"
        className="secondary-button"
      >
        Get in touch
      </a>
    </div>
  </section>

  {/* =========================
      About
      ========================= */}

  <section
    id="about"
    className="section about-section"
  >
    <p className="section-label">
      01 — ABOUT
    </p>

    <div className="about-content">
      <div className="about-text">
        <h2>
          Building with purpose.
        </h2>

        <p>
          I approach software engineering with a
          focus on practical problem solving,
          continuous learning, and building systems
          that can create meaningful impact.
        </p>

        <p>
          I am the founder of{' '}
          <strong>
            chomkaTECH™
          </strong>
          , a software and technology company
          through which I explore ideas, develop
          digital products, and build technology
          designed around real problems and real
          users.
        </p>

        <p>
          My interests span software engineering,
          cloud technologies, backend development,
          artificial intelligence, and quality
          engineering. I enjoy taking an idea from
          concept through design, development,
          testing, and iteration.
        </p>

        <p>
          Through both my professional work and the
          products I build, my goal is to create
          software that is useful, reliable,
          thoughtfully engineered, and capable of
          growing beyond the initial idea.
        </p>
      </div>

      <div className="about-image">
        <img
          src="/assets/samuel-profile.png"
          alt="Samuel John-Ibro"
        />
      </div>
    </div>
  </section>

  {/* =========================
      Projects
      ========================= */}

  <section
    id="projects"
    className="section"
  >
    <p className="section-label">
      02 — PROJECTS
    </p>

    <h2>
      Selected work.
    </h2>

    <div className="projects-grid">
      {/* FixRoomAUN */}

      <article className="project-card">
        <div className="project-top">
          <p className="project-number">
            01
          </p>

          <span className="project-status">
            LIVE
          </span>
        </div>

        <div className="project-logo">
          <img
            src="/assets/fixroomaun-logo.png"
            alt="FixRoomAUN logo"
          />
        </div>

        <h3>
          FixRoomAUN
        </h3>

        <p>
          A smart campus maintenance platform
          designed to improve how students report
          maintenance issues and how staff manage,
          track, and resolve them.
        </p>

        <div className="project-tags">
          <span>
            JavaScript
          </span>

          <span>
            Supabase
          </span>

          <span>
            Netlify
          </span>
        </div>

        <a
          href="https://fixroom-aun.netlify.app"
          target="_blank"
          rel="noreferrer"
          className="fixroom-live-link"
          aria-label="Open FixRoomAUN live project"
        >
          <span>
            VIEW LIVE PROJECT
          </span>

          <span
            className="fixroom-live-arrow"
            aria-hidden="true"
          >
            ↗
          </span>
        </a>
      </article>

      {/* Orbit */}

      <article className="project-card">
        <div className="project-top">
          <p className="project-number">
            02
          </p>

          <span className="project-status">
            IN DEVELOPMENT
          </span>
        </div>

        <h3>
          Orbit
        </h3>

        <p>
          A software product being developed as
          part of the chomkaTECH™ ecosystem,
          focused on delivering a practical,
          polished, and thoughtfully engineered
          web experience.
        </p>

        <div className="project-tags">
          <span>
            JavaScript
          </span>

          <span>
            Web Development
          </span>

          <span>
            Product Development
          </span>
        </div>

        <p className="project-development-note">
          Product development in progress.
        </p>
      </article>

      {/* Studio */}

      <article className="project-card">
        <div className="project-top">
          <p className="project-number">
            03
          </p>

          <span className="project-status">
            IN DEVELOPMENT
          </span>
        </div>

        <div className="project-logo">
          <img
            src="/assets/studio-logo.png"
            alt="Studio logo"
          />
        </div>

        <h3>
          Studio
        </h3>

        <p>
          A cross-platform creative workspace
          being developed by chomkaTECH™ for
          musicians, producers, and vocalists to
          capture, organize, edit, and manage their
          creative work.
        </p>

        <div className="project-tags">
          <span>
            Flutter
          </span>

          <span>
            Supabase
          </span>

          <span>
            Audio
          </span>
        </div>

        <p className="project-development-note">
          Product development in progress.
        </p>
      </article>
    </div>
  </section>

  {/* =========================
      Skills
      ========================= */}

  <section
    id="skills"
    className="section"
  >
    <p className="section-label">
      03 — SKILLS
    </p>

    <h2>
      Technical toolkit.
    </h2>

    <div className="skills-grid">
      <div>
        <h3>
          Development
        </h3>

        <p>
          JavaScript • Python • Dart • Java • SQL •
          HTML • CSS
        </p>
      </div>

      <div>
        <h3>
          Frameworks & Platforms
        </h3>

        <p>
          Flutter • Supabase • Firebase • REST APIs •
          PostgreSQL
        </p>
      </div>

      <div>
        <h3>
          Cloud & Infrastructure
        </h3>

        <p>
          AWS • Lambda • DynamoDB • Netlify • Git •
          GitHub
        </p>
      </div>

      <div>
        <h3>
          Quality & AI
        </h3>

        <p>
          Functional Testing • QA • Bug Reporting •
          AI Evaluation
        </p>
      </div>
    </div>
  </section>

  {/* =========================
      Professional Training
      ========================= */}

  <section
    id="training"
    className="section training-section"
  >
    <p className="section-label">
      04 — TRAINING
    </p>

    <div className="training-heading">
      <div>
        <h2>
          Sharing knowledge.
        </h2>

        <p>
          AWS Cloud Computing Training delivered
          for the staff of Management Edge LTD,
          bringing practical cloud concepts and
          AWS-focused knowledge into a professional
          learning environment.
        </p>
      </div>

      <div className="training-meta">
        <span>
          PROFESSIONAL TRAINING
        </span>

        <strong>
          Management Edge LTD
        </strong>
      </div>
    </div>

    {/* =========================
        Training Showcase
        ========================= */}

    <div className="training-showcase">
      <div className="training-media">
        {/* =========================
            Current Media
            ========================= */}

        <div
          ref={currentSlideRef}
          className={currentSlideClassName}
          style={{
            transform:
              'translate3d(0, 0, 0)',
            transition:
              `transform ${SLIDE_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          }}
        >
          {renderMedia(
            currentMedia,
            activeMedia
          )}
        </div>

        {/* =========================
            Incoming Media
            ========================= */}

        {incomingMediaItem && (
          <div
            ref={incomingSlideRef}
            className={incomingSlideClassName}
            style={{
              transform:
                slideDirection === 'next'
                  ? 'translate3d(100%, 0, 0)'
                  : 'translate3d(-100%, 0, 0)',
              transition:
                `transform ${SLIDE_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`,
            }}
          >
            {renderMedia(
              incomingMediaItem,
              incomingMedia,
              true
            )}
          </div>
        )}

        {/* =========================
            Media Counter
            ========================= */}

        <div className="training-media-overlay">
          <span>
            {String(
              displayedMediaIndex + 1
            ).padStart(2, '0')}
          </span>

          <span>
            {String(
              trainingMedia.length
            ).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* =========================
          Training Controls
          ========================= */}

      <div className="training-controls">
        <button
          type="button"
          className="training-control-button"
          onClick={
            previousMedia
          }
          disabled={
            isTransitioning
          }
          aria-label="Previous training media"
        >
          ←
        </button>

        <div className="training-indicators">
          {trainingMedia.map(
            (
              media,
              index
            ) => {
              const isActive =
                index ===
                displayedMediaIndex

              return (
                <button
                  key={`${media.src}-${index}`}
                  type="button"
                  className={`training-indicator ${
                    isActive
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    selectMedia(
                      index
                    )
                  }
                  disabled={
                    isTransitioning
                  }
                  aria-label={`View training media ${
                    index + 1
                  }`}
                  aria-current={
                    isActive
                      ? 'true'
                      : undefined
                  }
                />
              )
            }
          )}
        </div>

        <button
          type="button"
          className="training-control-button"
          onClick={
            nextMedia
          }
          disabled={
            isTransitioning
          }
          aria-label="Next training media"
        >
          →
        </button>
      </div>
    </div>

    {/* =========================
        Training Details
        ========================= */}

    <div className="training-details">
      <article>
        <p className="training-detail-label">
          ROLE
        </p>

        <h3>
          Cloud Computing Trainer
        </h3>

        <p>
          Delivered an AWS-focused cloud computing
          training session for Management Edge LTD
          staff, translating technical cloud
          concepts into practical learning material.
        </p>
      </article>

      <article>
        <p className="training-detail-label">
          FOCUS
        </p>

        <h3>
          AWS & Cloud Computing
        </h3>

        <p>
          The training material covered cloud
          computing concepts and AWS technologies in
          a structured professional learning
          environment.
        </p>
      </article>

      <article>
        <p className="training-detail-label">
          EXPERIENCE
        </p>

        <h3>
          Technical Communication
        </h3>

        <p>
          This experience reflects another part of
          my work as an engineer and builder:
          understanding technical subjects and
          communicating them clearly to other people.
        </p>
      </article>
    </div>
  </section>

  {/* =========================
      Credentials
      ========================= */}

  <section
    id="credentials"
    className="section credentials-section"
  >
    <p className="section-label">
      05 — CREDENTIALS
    </p>

    <h2>
      Education & credentials.
    </h2>

    <div className="credentials-grid">
      {/* Degree */}

      <article className="credential-card">
        <p className="credential-label">
          DEGREE
        </p>

        <h3>
          B.Sc. Software Engineering
        </h3>

        <p className="credential-institution">
          American University of Nigeria
        </p>

        <p>
          Bachelor's degree in Software Engineering
          with a focus on software development,
          systems, and engineering fundamentals.
        </p>
      </article>

      {/* AWS */}

      <article className="credential-card">
        <p className="credential-label">
          CERTIFICATION
        </p>

        <h3>
          AWS Certified Cloud Practitioner
        </h3>

        <p className="credential-institution">
          Amazon Web Services
        </p>

        <p>
          Foundational AWS certification covering
          cloud concepts, services, security,
          architecture, and pricing.
        </p>
      </article>

      {/* ISC2 */}

      <article className="credential-card">
        <p className="credential-label">
          PROFESSIONAL
        </p>

        <h3>
          ISC2 Candidate
        </h3>

        <p className="credential-institution">
          ISC2
        </p>

        <p>
          Professional cybersecurity pathway
          supporting continued development in
          security and technology practices.
        </p>
      </article>

      {/* Technical Certifications */}

      <article className="credential-card">
        <p className="credential-label">
          TECHNICAL
        </p>

        <h3>
          27+ Technical Certifications
        </h3>

        <p className="credential-institution">
          Software • AI • Cloud • Development
        </p>

        <p>
          Certifications and training across Python,
          Java, C++, AI, Flutter, Firebase, data
          structures, and related technical
          disciplines.
        </p>
      </article>
    </div>

    <p className="credentials-summary">
      I continue expanding my technical
      capabilities through practical projects,
      professional testing, software development,
      technical training, and ongoing learning.
    </p>
  </section>

  {/* =========================
      Contact
      ========================= */}

  <section
    id="contact"
    className="section contact-section"
  >
    <p className="section-label">
      06 — CONTACT
    </p>

    <h2>
      Let's build something meaningful.
    </h2>

    <p>
      I'm open to software engineering,
      QA/testing, AI, cloud, product development,
      and technical opportunities where I can
      contribute, solve problems, and continue
      growing as an engineer and builder.
    </p>

    <div className="contact-actions">
      <a
        href="mailto:samueljohnibrotech@gmail.com"
        target="_blank"
        rel="noreferrer"
        className="primary-button"
      >
        Contact me →
      </a>

      <a
        href="https://www.linkedin.com/in/samueljohnibro/"
        target="_blank"
        rel="noreferrer"
        className="secondary-button"
      >
        LinkedIn ↗
      </a>

      <a
        href="https://github.com/samueljohnibro/"
        target="_blank"
        rel="noreferrer"
        className="secondary-button"
      >
        GitHub ↗
      </a>
    </div>
  </section>

  {/* =========================
      Footer
      ========================= */}

  <footer>
    <p>
      © {new Date().getFullYear()} Samuel
      Silachomka John-Ibro
    </p>

    <p>
      Built by chomkaTECH™
    </p>
  </footer>
</main>
  )
}
export default App