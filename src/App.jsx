import { useCallback, useEffect, useRef, useState } from 'react'
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
    poster: '/assets/Cloud Computing Training 2.png',
    alt: 'AWS Cloud Computing Training session at Management Edge LTD',
  },
  {
    type: 'video',
    src: '/assets/Cloud Computing Training 4.mp4',
    poster: '/assets/Cloud Computing Training 5.png',
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

/* =========================================================
   Training Carousel
   ========================================================= */

function TrainingCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [trackPosition, setTrackPosition] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const trackRef = useRef(null)
  const autoPlayTimerRef = useRef(null)
  const transitionTimerRef = useRef(null)
  const videoRefs = useRef({})
  const pointerStartRef = useRef(0)
  const isDraggingRef = useRef(false)
  const activeIndexRef = useRef(0)
  const trackPositionRef = useRef(1)
  const isTransitioningRef = useRef(false)

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  useEffect(() => {
    trackPositionRef.current = trackPosition
  }, [trackPosition])

  useEffect(() => {
    isTransitioningRef.current = isTransitioning
  }, [isTransitioning])

  // Track items: 1 clone before (slide 6) + 7 real slides (0..6) + 1 clone after (slide 0)
  const trackItems = [
    {
      ...trainingMedia[trainingMedia.length - 1],
      originalIndex: trainingMedia.length - 1,
      key: 'clone-prev',
    },
    ...trainingMedia.map((item, idx) => ({
      ...item,
      originalIndex: idx,
      key: `real-${idx}`,
    })),
    {
      ...trainingMedia[0],
      originalIndex: 0,
      key: 'clone-next',
    },
  ]

  const clearTimers = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current)
      autoPlayTimerRef.current = null
    }
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current)
      transitionTimerRef.current = null
    }
  }, [])

  const pauseAllVideos = useCallback(() => {
    Object.values(videoRefs.current).forEach((video) => {
      if (video) {
        video.pause()
        try {
          video.currentTime = 0
        } catch {
          // ignore
        }
      }
    })
  }, [])

  // Transition completion handler (both onTransitionEnd and safety timer)
  const handleTransitionEnd = useCallback(
    (event) => {
      if (
        event &&
        (event.target !== trackRef.current || event.propertyName !== 'transform')
      ) {
        return
      }

      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current)
        transitionTimerRef.current = null
      }

      isTransitioningRef.current = false
      setIsTransitioning(false)

      const currentPos = trackPositionRef.current

      // Check wrap-around clone positions
      if (currentPos >= trackItems.length - 1) {
        // Reached Clone of Slide 0 (position 8), wrap silently to real Slide 0 (position 1)
        if (trackRef.current) {
          trackRef.current.style.transition = 'none'
          trackRef.current.style.transform = 'translate3d(-100%, 0, 0)'
          void trackRef.current.offsetHeight // force layout
          trackRef.current.style.transition = ''
        }
        trackPositionRef.current = 1
        setTrackPosition(1)
        return
      }

      if (currentPos <= 0) {
        // Reached Clone of Slide 6 (position 0), wrap silently to real Slide 6 (position 7)
        const realLastPos = trackItems.length - 2
        if (trackRef.current) {
          trackRef.current.style.transition = 'none'
          trackRef.current.style.transform = `translate3d(-${realLastPos * 100}%, 0, 0)`
          void trackRef.current.offsetHeight // force layout
          trackRef.current.style.transition = ''
        }
        trackPositionRef.current = realLastPos
        setTrackPosition(realLastPos)
        return
      }
    },
    [trackItems.length]
  )

  const navigateTo = useCallback(
    (targetPosition, targetIndex) => {
      if (isTransitioningRef.current) return

      clearTimers()
      pauseAllVideos()

      isTransitioningRef.current = true
      setIsTransitioning(true)
      trackPositionRef.current = targetPosition
      setTrackPosition(targetPosition)
      setActiveIndex(targetIndex)

      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current)
      }
      transitionTimerRef.current = setTimeout(() => {
        handleTransitionEnd()
      }, 650)
    },
    [clearTimers, pauseAllVideos, handleTransitionEnd]
  )

  const nextSlide = useCallback(() => {
    if (isTransitioningRef.current) return
    const nextIdx = (activeIndexRef.current + 1) % trainingMedia.length
    const nextPos = trackPositionRef.current + 1
    navigateTo(nextPos, nextIdx)
  }, [navigateTo])

  const prevSlide = useCallback(() => {
    if (isTransitioningRef.current) return
    const prevIdx =
      (activeIndexRef.current - 1 + trainingMedia.length) % trainingMedia.length
    const prevPos = trackPositionRef.current - 1
    navigateTo(prevPos, prevIdx)
  }, [navigateTo])

  const goToSlide = useCallback(
    (targetIdx) => {
      if (targetIdx === activeIndexRef.current || isTransitioningRef.current) return
      navigateTo(targetIdx + 1, targetIdx)
    },
    [navigateTo]
  )

  // Autoplay progression for current active slide
  useEffect(() => {
    if (isTransitioning || isDragging) return

    const currentMedia = trainingMedia[activeIndex]
    if (!currentMedia) return

    clearTimers()

    // When hovered or focused, pause auto progression
    if (isHovered || isFocused) {
      return
    }

    if (currentMedia.type === 'image') {
      autoPlayTimerRef.current = setTimeout(() => {
        nextSlide()
      }, 3500)

      return () => {
        if (autoPlayTimerRef.current) {
          clearTimeout(autoPlayTimerRef.current)
          autoPlayTimerRef.current = null
        }
      }
    }

    if (currentMedia.type === 'video') {
      const video = videoRefs.current[activeIndex]
      if (video) {
        video.muted = true
        video.defaultMuted = true
        video.playsInline = true

        const playPromise = video.play()
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            // Autoplay policy fallback: advance after 3.5s
            autoPlayTimerRef.current = setTimeout(() => {
              nextSlide()
            }, 3500)
          })
        }
      }

      // Max timeout fallback: 45s for slide 4 (40s video), 12s for slide 3 (7s video)
      const maxVideoDuration = activeIndex === 3 ? 45000 : 12000
      const safetyVideoTimer = setTimeout(() => {
        nextSlide()
      }, maxVideoDuration)

      return () => {
        clearTimeout(safetyVideoTimer)
      }
    }
  }, [
    activeIndex,
    isTransitioning,
    isDragging,
    isHovered,
    isFocused,
    nextSlide,
    clearTimers,
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers()
      pauseAllVideos()
    }
  }, [clearTimers, pauseAllVideos])

  // Drag / Swipe handling
  const handlePointerDown = (event) => {
    if (isTransitioningRef.current) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    isDraggingRef.current = true
    setIsDragging(true)
    pointerStartRef.current = event.clientX
    setDragOffset(0)
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // ignore
    }
  }

  const handlePointerMove = (event) => {
    if (!isDraggingRef.current) return
    const diff = event.clientX - pointerStartRef.current
    setDragOffset(diff)
  }

  const handlePointerEnd = (event) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsDragging(false)
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // ignore
    }

    const finalOffset =
      Number.isFinite(event.clientX) && pointerStartRef.current
        ? event.clientX - pointerStartRef.current
        : dragOffset
    const threshold = 50
    setDragOffset(0)
    if (finalOffset < -threshold) {
      nextSlide()
    } else if (finalOffset > threshold) {
      prevSlide()
    }
  }

  return (
    <div className="training-showcase">
      <div
        className={`training-media${isDragging ? ' is-dragging' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <div
          ref={trackRef}
          className={`training-media-track${isDragging ? ' is-dragging' : ''}`}
          style={{
            transform: isDragging
              ? `translate3d(calc(-${trackPosition * 100}% + ${dragOffset}px), 0, 0)`
              : `translate3d(-${trackPosition * 100}%, 0, 0)`,
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {trackItems.map((item, idx) => {
            const isActual = item.originalIndex === activeIndex
            return (
              <div key={`${item.key}-${idx}`} className="training-media-slide">
                {item.type === 'image' ? (
                  <img
                    src={item.src}
                    alt={item.alt}
                    draggable="false"
                    loading="eager"
                  />
                ) : (
                  <div className="training-video-container">
                    <video
                      ref={(el) => {
                        if (!item.key.startsWith('clone')) {
                          videoRefs.current[item.originalIndex] = el
                        }
                      }}
                      src={item.src}
                      poster={item.poster}
                      muted
                      playsInline
                      preload="auto"
                      controls={false}
                      disablePictureInPicture
                      disableRemotePlayback
                      onEnded={() => {
                        if (isActual) nextSlide()
                      }}
                      onError={() => {
                        if (isActual) nextSlide()
                      }}
                      className="training-video-element"
                      aria-label={item.alt}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Counter Overlay */}
        <div className="training-media-overlay">
          <span>{String(activeIndex + 1).padStart(2, '0')}</span>
          <span>{String(trainingMedia.length).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="training-controls">
        <button
          type="button"
          className="training-control-button"
          onClick={prevSlide}
          disabled={isTransitioning}
          aria-label="Previous training media"
        >
          ←
        </button>

        <div className="training-indicators">
          {trainingMedia.map((media, index) => {
            const isActive = index === activeIndex
            return (
              <button
                key={`${media.src}-${index}`}
                type="button"
                className={`training-indicator${isActive ? ' active' : ''}`}
                onClick={() => goToSlide(index)}
                disabled={isTransitioning}
                aria-label={`View training media ${index + 1}`}
                aria-current={isActive ? 'true' : undefined}
              />
            )
          })}
        </div>

        <button
          type="button"
          className="training-control-button"
          onClick={nextSlide}
          disabled={isTransitioning}
          aria-label="Next training media"
        >
          →
        </button>
      </div>
    </div>
  )
}

function App() {
  /*
=========================
Navigation state
=========================
   */
  const [isNavOpen, setIsNavOpen] = useState(false)
  /*
=========================
Hero typewriter state
=========================
   */
  const [typedHeroText, setTypedHeroText] = useState(() =>
    typeof window !== 'undefined' && !('IntersectionObserver' in window)
      ? HERO_TEXT
      : ''
  )
  /*
=========================
Refs
=========================
   */
  const typewriterTimerRef = useRef(null)
  const heroSectionRef = useRef(null)
  /*
=========================
Cleanup helpers
=========================
   */
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
Mobile navigation effect
=========================
   */
  useEffect(() => {
    if (isNavOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsNavOpen(false)
      }
    }

    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsNavOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleResize)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
    }
  }, [isNavOpen])
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
       * Any status badge with .status-live gets the
       * glowing indicator.
       */

      .portfolio-app .status-live {
        color:
          rgba(
            230,
            236,
            244,
            0.92
          );
      }

      .portfolio-app .status-live::before {
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
       * MOBILE NAVIGATION & HAMBURGER
       * =================================================
       */

      .portfolio-app .nav-toggle {
        display: none;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 5px;
        width: 40px;
        height: 40px;
        padding: 0;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        cursor: pointer;
        z-index: 1002;
        transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
      }

      .portfolio-app .nav-toggle:hover {
        background: rgba(103, 232, 249, 0.08);
        border-color: rgba(103, 232, 249, 0.4);
      }

      .portfolio-app .nav-toggle-bar {
        display: block;
        width: 19px;
        height: 2px;
        background-color: var(--text);
        border-radius: 2px;
        transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease, background-color 0.2s ease;
        transform-origin: center;
      }

      .portfolio-app .nav-toggle:hover .nav-toggle-bar {
        background-color: var(--accent);
      }

      .portfolio-app .nav-toggle.active .nav-toggle-bar:nth-child(1) {
        transform: translateY(7px) rotate(45deg);
      }

      .portfolio-app .nav-toggle.active .nav-toggle-bar:nth-child(2) {
        opacity: 0;
        transform: scaleX(0);
      }

      .portfolio-app .nav-toggle.active .nav-toggle-bar:nth-child(3) {
        transform: translateY(-7px) rotate(-45deg);
      }

      .portfolio-app .nav-links {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 28px;
      }

      .portfolio-app .nav-links a {
        color: var(--muted);
        font-size: 0.82rem;
        font-weight: 500;
        white-space: nowrap;
        transition: color 0.2s ease, opacity 0.2s ease;
      }

      .portfolio-app .nav-links a:hover {
        color: var(--text);
      }

      @media (max-width: 768px) {
        .portfolio-app .navbar {
          width: min(var(--max-width), calc(100% - 32px));
          padding-top: 16px;
          padding-bottom: 16px;
        }

        .portfolio-app .nav-toggle {
          display: flex;
        }

        .portfolio-app .nav-links {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(8, 10, 15, 0.97);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 20px;
          padding: 80px 24px 40px;
          opacity: 0;
          pointer-events: none;
          transform: translateY(-16px);
          transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
          z-index: 1001;
        }

        .portfolio-app .nav-links.nav-links-open {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
        }

        .portfolio-app .nav-links a {
          font-size: 1.18rem;
          font-weight: 600;
          color: var(--muted);
          padding: 8px 18px;
          border-radius: 8px;
          transition: color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
        }

        .portfolio-app .nav-links a:hover,
        .portfolio-app .nav-links a:active {
          color: var(--accent);
          background: rgba(103, 232, 249, 0.08);
          transform: translateX(4px);
        }

        .portfolio-app .hero-section {
          padding-top: 125px;
        }
      }

      @media (max-width: 480px) {
        .portfolio-app .navbar {
          width: calc(100% - 32px);
          padding-top: 14px;
          padding-bottom: 14px;
        }

        .portfolio-app .hero-section {
          padding-top: 110px;
        }
      }

      /*
       * =================================================
       * EXTRAS SECTION
       * =================================================
       */

      .portfolio-app .extras-section {
        position: relative;
      }

      .portfolio-app .extras-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 20px;
        margin-top: 55px;
      }

      .portfolio-app .extra-card {
        padding: 36px;
        display: flex;
        flex-direction: column;
        border: 1px solid var(--border);
        border-radius: 14px;
        background: linear-gradient(
          145deg,
          rgba(255, 255, 255, 0.035),
          rgba(255, 255, 255, 0.01)
        );
        transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease;
      }

      .portfolio-app .extra-card:hover {
        transform: translateY(-5px);
        border-color: var(--border-hover);
        background: linear-gradient(
          145deg,
          rgba(255, 255, 255, 0.045),
          rgba(255, 255, 255, 0.012)
        );
      }

      .portfolio-app .extra-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
      }

      .portfolio-app .extra-number {
        color: var(--accent);
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.08em;
      }

      .portfolio-app .extra-status {
        padding: 5px 10px;
        border: 1px solid rgba(103, 232, 249, 0.25);
        border-radius: 999px;
        background: rgba(103, 232, 249, 0.04);
        color: #67e8f9;
        font-size: 0.62rem;
        font-weight: 800;
        letter-spacing: 0.09em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .portfolio-app .extra-header-info {
        margin-top: 24px;
      }

      .portfolio-app .extra-card h3 {
        color: var(--text);
        font-size: 1.45rem;
        letter-spacing: -0.035em;
        font-weight: 750;
      }

      .portfolio-app .extra-subtitle {
        margin-top: 6px;
        color: var(--accent);
        font-size: 0.84rem;
        font-weight: 600;
        letter-spacing: 0.02em;
      }

      .portfolio-app .extra-card p:not(.extra-number):not(.extra-subtitle) {
        margin-top: 16px;
        color: var(--muted);
        font-size: 0.92rem;
        line-height: 1.8;
      }

      .portfolio-app .extra-live-link {
        display: inline-flex;
        width: fit-content;
        align-items: center;
        justify-content: center;
        gap: 7px;
        margin-top: 26px;
        padding: 8px 14px;
        border: 1px solid rgba(103, 232, 249, 0.28);
        border-radius: 999px;
        background: rgba(103, 232, 249, 0.04);
        color: #67e8f9;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
      }

      .portfolio-app .extra-live-link:hover {
        transform: translateY(-2px);
        border-color: rgba(103, 232, 249, 0.55);
        background: rgba(103, 232, 249, 0.1);
        color: #a5f3fc;
      }

      .portfolio-app .extra-live-arrow {
        font-size: 0.85rem;
        line-height: 1;
      }

      @media (max-width: 760px) {
        .portfolio-app .extra-card {
          padding: 26px;
        }

        .portfolio-app .extra-card h3 {
          font-size: 1.25rem;
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


    `}
  </style>

  {/* =========================
      Navigation
      ========================= */}

  <header className="navbar">
    <a
      href="#home"
      className="brand"
      onClick={() => setIsNavOpen(false)}
    >
      Samuel John-Ibro
    </a>

    <button
      type="button"
      className={`nav-toggle ${isNavOpen ? 'active' : ''}`}
      onClick={() => setIsNavOpen((prev) => !prev)}
      aria-label={isNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
      aria-expanded={isNavOpen}
    >
      <span className="nav-toggle-bar" />
      <span className="nav-toggle-bar" />
      <span className="nav-toggle-bar" />
    </button>

    <nav className={`nav-links ${isNavOpen ? 'nav-links-open' : ''}`}>
      <a
        href="#about"
        onClick={() => setIsNavOpen(false)}
      >
        About
      </a>

      <a
        href="#projects"
        onClick={() => setIsNavOpen(false)}
      >
        Projects
      </a>

      <a
        href="#skills"
        onClick={() => setIsNavOpen(false)}
      >
        Skills
      </a>

      <a
        href="#training"
        onClick={() => setIsNavOpen(false)}
      >
        Training
      </a>

      <a
        href="#credentials"
        onClick={() => setIsNavOpen(false)}
      >
        Credentials
      </a>

      <a
        href="#extras"
        onClick={() => setIsNavOpen(false)}
      >
        Extras
      </a>

      <a
        href="#contact"
        onClick={() => setIsNavOpen(false)}
      >
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

          <span className="project-status status-live">
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

    <TrainingCarousel />

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
      Extras / Creative Pursuits
      ========================= */}

  <section
    id="extras"
    className="section extras-section"
  >
    <p className="section-label">
      06 — EXTRAS
    </p>

    <h2>
      Beyond code.
    </h2>

    <p>
      Outside of software engineering and cloud systems, I produce music, sound
      design, and audio-visual creative work as <strong>silachomka</strong>,
      exploring beats, Afro trap, and Afro highlife within chomkaMUSIC™ and
      Chomka Nation.
    </p>

    <div className="extras-grid">
      <article className="extra-card">
        <div className="extra-top">
          <p className="extra-number">
            01
          </p>

          <span className="project-status status-live">
            LIVE
          </span>
        </div>

        <div className="extra-header-info">
          <h3>
            silachomka — Official Artist Home
          </h3>

          <p className="extra-subtitle">
            Music Producer • Artist • chomkaMUSIC™
          </p>
        </div>

        <p>
          My official artist website featuring music releases, beat store,
          production catalog, and creative projects across Afro trap, Afro
          highlife, and experimental sound.
        </p>

        <div className="project-tags">
          <span>
            Music Production
          </span>

          <span>
            Beat Store
          </span>

          <span>
            chomkaMUSIC™
          </span>

          <span>
            Sound Design
          </span>

          <span>
            Creative Direction
          </span>
        </div>

        <a
          href="https://silachomka.vercel.app/"
          target="_blank"
          rel="noreferrer"
          className="extra-live-link"
          aria-label="Open silachomka official artist website in a new tab"
        >
          <span>
            VISIT ARTIST SITE
          </span>

          <span
            className="extra-live-arrow"
            aria-hidden="true"
          >
            ↗
          </span>
        </a>
      </article>
    </div>
  </section>

  {/* =========================
      Contact
      ========================= */}

  <section
    id="contact"
    className="section contact-section"
  >
    <p className="section-label">
      07 — CONTACT
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