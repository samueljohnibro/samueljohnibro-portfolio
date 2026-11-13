import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import './App.css'

const trainingMedia = [
  {
    id: 'training-img-1',
    type: 'image',
    src: '/assets/Cloud Computing Training 1.png',
    alt: 'AWS Cloud Computing Training session at Management Edge LTD',
  },
  {
    id: 'training-img-2',
    type: 'image',
    src: '/assets/Cloud Computing Training 2.png',
    alt: 'AWS Cloud Computing Training at Management Edge LTD',
  },
  {
    id: 'training-vid-3',
    type: 'video',
    src: '/assets/Cloud Computing Training 3.mp4',
    maxDurationMs: 12000,
    alt: 'AWS Cloud Computing Training session at Management Edge LTD',
  },
  {
    id: 'training-vid-4',
    type: 'video',
    src: '/assets/Cloud Computing Training 4.mp4',
    maxDurationMs: 45000,
    alt: 'AWS Cloud Computing Training session at Management Edge LTD',
  },
  {
    id: 'training-img-5',
    type: 'image',
    src: '/assets/Cloud Computing Training 5.png',
    alt: 'AWS Cloud Computing Training session at Management Edge LTD',
  },
  {
    id: 'training-slides-1',
    type: 'image',
    src: '/assets/training slides 1.png',
    alt: 'AWS Cloud Computing Training presentation slides',
  },
  {
    id: 'training-slides-2',
    type: 'image',
    src: '/assets/training slides 2.png',
    alt: 'AWS Cloud Computing Training presentation slides',
  },
]

const SLIDE_IMAGE_DURATION_MS = 4000
const SLIDE_MIN_DWELL_MS = 3000
const SLIDE_TRANSITION_SAFETY_MS = 680
const DRAG_THRESHOLD_PX = 50

function shuffleMediaItems(items, avoidFirstId = null) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  if (avoidFirstId && copy.length > 1 && copy[0].id === avoidFirstId) {
    const swapIdx = 1 + Math.floor(Math.random() * (copy.length - 1))
    ;[copy[0], copy[swapIdx]] = [copy[swapIdx], copy[0]]
  }
  return copy
}

function buildInitialQueue() {
  // Shuffle all media cleanly on each load/refresh, keeping only immediately ready images
  // in the active queue while videos complete full background downloads.
  const initialPlan = shuffleMediaItems(trainingMedia)
  return initialPlan.filter((item) => item.type === 'image')
}

async function waitWithAbort(ms, signal) {
  if (signal.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', onAbort)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

async function fetchCompleteVideoBlobUrl(item, signal) {
  const retryDelays = [1500, 3500]
  for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
    try {
      const response = await fetch(encodeURI(item.src), {
        signal,
        cache: 'default',
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} while downloading ${item.src}`)
      }
      const contentType = (response.headers.get('content-type') || '').toLowerCase()
      if (contentType.includes('text/html')) {
        throw new Error(`Unexpected HTML response for ${item.src}`)
      }
      const contentEncoding = response.headers.get('content-encoding')
      const rawLength = response.headers.get('content-length')
      const expectedLength =
        rawLength && !contentEncoding ? Number(rawLength) : null

      const blob = await response.blob()
      if (signal.aborted) {
        throw new DOMException('Aborted', 'AbortError')
      }
      if (!blob || blob.size === 0) {
        throw new Error(`Empty blob downloaded for ${item.src}`)
      }
      if (
        Number.isFinite(expectedLength) &&
        expectedLength > 0 &&
        blob.size !== expectedLength
      ) {
        throw new Error(
          `Incomplete blob size (${blob.size} of ${expectedLength}) for ${item.src}`
        )
      }

      const typedBlob = blob.type
        ? blob
        : new Blob([blob], { type: 'video/mp4' })
      return URL.createObjectURL(typedBlob)
    } catch (error) {
      if (signal.aborted || error?.name === 'AbortError') {
        throw error
      }
      if (attempt >= retryDelays.length) {
        throw error
      }
      await waitWithAbort(retryDelays[attempt], signal)
    }
  }
  return null
}

async function extractVideoPosterUrl(blobUrl, signal) {
  if (signal?.aborted) return null
  return new Promise((resolve) => {
    const tempVideo = document.createElement('video')
    let settled = false

    const cleanup = () => {
      tempVideo.onloadeddata = null
      tempVideo.onseeked = null
      tempVideo.onerror = null
      tempVideo.pause()
      tempVideo.removeAttribute('src')
      tempVideo.load()
    }

    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timeoutId)
      signal?.removeEventListener('abort', onAbort)
      cleanup()
      resolve(result)
    }

    const onAbort = () => finish(null)
    signal?.addEventListener('abort', onAbort, { once: true })

    const timeoutId = setTimeout(() => finish(null), 1500)

    const captureFrame = () => {
      if (settled) return
      try {
        const vw = tempVideo.videoWidth
        const vh = tempVideo.videoHeight
        if (!vw || !vh) {
          finish(null)
          return
        }
        const maxWidth = 960
        const scale = vw > maxWidth ? maxWidth / vw : 1
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(vw * scale)
        canvas.height = Math.round(vh * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          finish(null)
          return
        }
        ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        finish(dataUrl && dataUrl.length > 200 ? dataUrl : null)
      } catch {
        finish(null)
      }
    }

    tempVideo.muted = true
    tempVideo.playsInline = true
    tempVideo.preload = 'auto'

    tempVideo.onloadeddata = () => {
      if (tempVideo.readyState >= 2) {
        if (tempVideo.duration && tempVideo.duration > 0.1) {
          tempVideo.onseeked = captureFrame
          try {
            tempVideo.currentTime = 0.05
          } catch {
            captureFrame()
          }
        } else {
          captureFrame()
        }
      }
    }

    tempVideo.onerror = () => finish(null)
    tempVideo.src = blobUrl
  })
}

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
  const [queue, setQueue] = useState(() => buildInitialQueue())
  const [activeIndex, setActiveIndex] = useState(0)
  const [stage, setStage] = useState(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const trackRef = useRef(null)
  const autoPlayTimerRef = useRef(null)
  const transitionTimerRef = useRef(null)
  const videoRefs = useRef({})
  const pointerStartRef = useRef(0)
  const dragOffsetRef = useRef(0)
  const isDraggingRef = useRef(false)
  const isTouchInteractionRef = useRef(false)
  const failedImageIdsRef = useRef(new Set())
  const slideSettledAtRef = useRef(0)
  const queueRef = useRef(queue)
  const activeIndexRef = useRef(activeIndex)
  const stageRef = useRef(stage)

  useEffect(() => {
    slideSettledAtRef.current = Date.now()
  }, [])

  useLayoutEffect(() => {
    queueRef.current = queue
    activeIndexRef.current = activeIndex
    stageRef.current = stage
  }, [queue, activeIndex, stage])

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

  const pauseVideos = useCallback((resetOthersThanId = null) => {
    Object.entries(videoRefs.current).forEach(([id, video]) => {
      if (!video) return
      video.pause()
      if (resetOthersThanId !== null && id !== resetOthersThanId) {
        try {
          video.currentTime = 0
        } catch {
          // ignore
        }
      }
    })
  }, [])

  // Background image preloading + complete Blob download for videos
  useEffect(() => {
    const controller = new AbortController()
    const createdUrls = {}
    const preloadedImages = []

    const imageWarmList = trainingMedia
      .filter((item) => item.type === 'image')
      .map((item) => ({ id: item.id, src: item.src }))

    imageWarmList.forEach(({ id, src }) => {
      const img = new Image()
      if (id) {
        img.onerror = () => {
          failedImageIdsRef.current.add(id)
        }
        img.onload = () => {
          failedImageIdsRef.current.delete(id)
        }
      }
      img.src = src
      preloadedImages.push(img)
    })

    const videoItems = trainingMedia.filter((item) => item.type === 'video')
    videoItems.forEach((videoItem) => {
      fetchCompleteVideoBlobUrl(videoItem, controller.signal)
        .then(async (blobUrl) => {
          if (!blobUrl || controller.signal.aborted) {
            if (blobUrl) URL.revokeObjectURL(blobUrl)
            return
          }
          createdUrls[videoItem.id] = blobUrl
          const realPoster = await extractVideoPosterUrl(blobUrl, controller.signal)
          if (controller.signal.aborted) {
            return
          }
          setQueue((prev) => {
            const existingIdx = prev.findIndex((item) => item.id === videoItem.id)
            if (existingIdx !== -1) {
              return prev.map((item, idx) =>
                idx === existingIdx
                  ? { ...item, src: blobUrl, poster: realPoster || undefined }
                  : item
              )
            }

            const currentStage = stageRef.current
            const targetIdxInPrev = currentStage
              ? prev.findIndex((item) => item.id === currentStage.targetItem.id)
              : -1
            const minInsert = Math.min(
              Math.max(activeIndexRef.current, targetIdxInPrev) + 1,
              prev.length
            )
            const insertAt =
              minInsert +
              Math.floor(Math.random() * (prev.length - minInsert + 1))

            const nextQueue = [...prev]
            nextQueue.splice(insertAt, 0, {
              ...videoItem,
              src: blobUrl,
              poster: realPoster || undefined,
            })
            queueRef.current = nextQueue
            return nextQueue
          })
        })
        .catch((error) => {
          if (error?.name !== 'AbortError') {
            // Keep carousel flowing smoothly with ready slides when a video fails to download
          }
        })
    })

    return () => {
      controller.abort()
      preloadedImages.forEach((img) => {
        img.onload = null
        img.onerror = null
      })
      setQueue((prev) => prev.filter((item) => item.type === 'image'))
      Object.values(createdUrls).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const completeTransition = useCallback(
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

      const finished = stageRef.current
      if (!finished || finished.phase !== 'animate') return

      const track = trackRef.current
      if (track) {
        // Snap from [from, to] (-100% or 0%) back to [to] (0%) before next paint with zero flash
        track.classList.add('is-instant')
      }

      pauseVideos(finished.targetItem.id)

      let resolvedIndex
      if (finished.reshuffledQueue) {
        const currentLatest = queueRef.current
        const baseIds = new Set(finished.reshuffledQueue.map((item) => item.id))
        const extrasArrivedMidWrap = currentLatest.filter(
          (item) => !baseIds.has(item.id)
        )
        const nextQueue = [...finished.reshuffledQueue]
        extrasArrivedMidWrap.forEach((videoItem) => {
          const insertAt =
            1 + Math.floor(Math.random() * Math.max(1, nextQueue.length))
          nextQueue.splice(Math.min(insertAt, nextQueue.length), 0, videoItem)
        })
        queueRef.current = nextQueue
        setQueue(nextQueue)
        resolvedIndex = Math.max(
          0,
          nextQueue.findIndex((item) => item.id === finished.targetItem.id)
        )
      } else {
        const idx = queueRef.current.findIndex(
          (item) => item.id === finished.targetItem.id
        )
        resolvedIndex = idx !== -1 ? idx : 0
      }

      activeIndexRef.current = resolvedIndex
      setActiveIndex(resolvedIndex)
      slideSettledAtRef.current = Date.now()
      stageRef.current = null
      setStage(null)
    },
    [pauseVideos]
  )

  const launchStage = useCallback(
    (nextStage) => {
      if (stageRef.current) return
      clearTimers()
      // Pause currently playing video while keeping its current frame visible during slide-out
      pauseVideos(null)
      stageRef.current = nextStage
      setStage(nextStage)
    },
    [clearTimers, pauseVideos]
  )

  // Synchronize CSS transition framing cleanly on prepare -> animate and settle -> idle
  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return

    if (stage?.phase === 'prepare') {
      track.classList.add('is-instant')
      void track.offsetHeight
      track.classList.remove('is-instant')
      void track.offsetHeight

      const rafId = requestAnimationFrame(() => {
        setStage((prev) => {
          if (!prev || prev.phase !== 'prepare') return prev
          const animating = { ...prev, phase: 'animate' }
          stageRef.current = animating
          return animating
        })
      })
      return () => cancelAnimationFrame(rafId)
    }

    if (stage?.phase === 'animate') {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current)
      }
      transitionTimerRef.current = setTimeout(() => {
        completeTransition()
      }, SLIDE_TRANSITION_SAFETY_MS)
      return () => {
        if (transitionTimerRef.current) {
          clearTimeout(transitionTimerRef.current)
          transitionTimerRef.current = null
        }
      }
    }

    if (!stage && !isDragging && track.classList.contains('is-instant')) {
      void track.offsetHeight
      track.classList.remove('is-instant')
      void track.offsetHeight
    }
  }, [stage, isDragging, completeTransition])

  // Ensure backgrounded browser tabs recover cleanly if a transition was interrupted
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && stageRef.current?.phase === 'animate') {
        completeTransition()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [completeTransition])

  const pickNextTargetIndex = useCallback((currentQueue, currentIdx) => {
    for (let step = 1; step < currentQueue.length; step += 1) {
      const candidateIdx = currentIdx + step
      if (candidateIdx >= currentQueue.length) break
      if (!failedImageIdsRef.current.has(currentQueue[candidateIdx].id)) {
        return candidateIdx
      }
    }
    return currentIdx + 1
  }, [])

  const pickPrevTargetIndex = useCallback((currentQueue, currentIdx) => {
    for (let step = 1; step <= currentIdx; step += 1) {
      const candidateIdx = currentIdx - step
      if (!failedImageIdsRef.current.has(currentQueue[candidateIdx].id)) {
        return candidateIdx
      }
    }
    return currentIdx - 1
  }, [])

  const nextSlide = useCallback(
    (startOffsetPx = 0) => {
      if (stageRef.current) return
      const currentQueue = queueRef.current
      const currentIdx = activeIndexRef.current
      const currentItem = currentQueue[currentIdx]
      if (!currentItem || currentQueue.length < 2) return

      const candidateIdx = pickNextTargetIndex(currentQueue, currentIdx)
      let targetItem
      let targetIndex
      let reshuffledQueue = null

      if (candidateIdx < currentQueue.length) {
        targetIndex = candidateIdx
        targetItem = currentQueue[targetIndex]
      } else {
        // Completed one randomized pass: build a fresh random queue avoiding back-to-back repeats
        const healthyItems = currentQueue.filter(
          (item) =>
            item.id === currentItem.id ||
            !failedImageIdsRef.current.has(item.id)
        )
        const pool = healthyItems.length >= 2 ? healthyItems : currentQueue
        reshuffledQueue = shuffleMediaItems(pool, currentItem.id)
        targetIndex = 0
        targetItem = reshuffledQueue[0]
      }

      launchStage({
        direction: 'next',
        items: [currentItem, targetItem],
        startTransform: startOffsetPx
          ? `translate3d(${startOffsetPx}px, 0, 0)`
          : 'translate3d(0%, 0, 0)',
        targetTransform: 'translate3d(-100%, 0, 0)',
        targetItem,
        targetIndex,
        reshuffledQueue,
        phase: 'prepare',
      })
    },
    [launchStage, pickNextTargetIndex]
  )

  const prevSlide = useCallback(
    (startOffsetPx = 0) => {
      if (stageRef.current) return
      const currentQueue = queueRef.current
      const currentIdx = activeIndexRef.current
      const currentItem = currentQueue[currentIdx]
      if (!currentItem || currentQueue.length < 2) return

      let targetIndex
      let targetItem
      let reshuffledQueue = null

      if (currentIdx > 0) {
        const candidateIdx = pickPrevTargetIndex(currentQueue, currentIdx)
        targetIndex = candidateIdx >= 0 ? candidateIdx : currentQueue.length - 1
        targetItem = currentQueue[targetIndex]
      } else {
        reshuffledQueue = shuffleMediaItems(currentQueue, currentItem.id)
        targetItem = reshuffledQueue[reshuffledQueue.length - 1]
        if (targetItem.id === currentItem.id && reshuffledQueue.length > 1) {
          targetItem = reshuffledQueue[0]
          targetIndex = 0
        } else {
          targetIndex = reshuffledQueue.length - 1
        }
      }

      launchStage({
        direction: 'prev',
        items: [targetItem, currentItem],
        startTransform: startOffsetPx
          ? `translate3d(calc(-100% + ${startOffsetPx}px), 0, 0)`
          : 'translate3d(-100%, 0, 0)',
        targetTransform: 'translate3d(0%, 0, 0)',
        targetItem,
        targetIndex,
        reshuffledQueue,
        phase: 'prepare',
      })
    },
    [launchStage, pickPrevTargetIndex]
  )

  const goToSlide = useCallback(
    (targetIdx) => {
      if (stageRef.current) return
      const currentQueue = queueRef.current
      const currentIdx = activeIndexRef.current
      if (
        targetIdx === currentIdx ||
        targetIdx < 0 ||
        targetIdx >= currentQueue.length
      ) {
        return
      }
      const currentItem = currentQueue[currentIdx]
      const targetItem = currentQueue[targetIdx]
      const direction = targetIdx > currentIdx ? 'next' : 'prev'

      launchStage({
        direction,
        items:
          direction === 'next'
            ? [currentItem, targetItem]
            : [targetItem, currentItem],
        startTransform:
          direction === 'next'
            ? 'translate3d(0%, 0, 0)'
            : 'translate3d(-100%, 0, 0)',
        targetTransform:
          direction === 'next'
            ? 'translate3d(-100%, 0, 0)'
            : 'translate3d(0%, 0, 0)',
        targetItem,
        targetIndex: targetIdx,
        reshuffledQueue: null,
        phase: 'prepare',
      })
    },
    [launchStage]
  )

  const activeSlideMedia = queue[activeIndex] || queue[0]
  const activeMediaId = activeSlideMedia?.id
  const activeMediaType = activeSlideMedia?.type
  const activeMediaSrc = activeSlideMedia?.src
  const activeMediaMaxDuration = activeSlideMedia?.maxDurationMs
  const isStageActive = Boolean(stage)

  // Autoplay progression for current active slide
  useEffect(() => {
    if (isStageActive || isDragging || !activeMediaId) return

    clearTimers()

    if (activeMediaType === 'image') {
      if (isHovered || isFocused) {
        return
      }
      const elapsed = Date.now() - slideSettledAtRef.current
      const remaining = SLIDE_IMAGE_DURATION_MS - elapsed
      const delay = Math.max(SLIDE_MIN_DWELL_MS, remaining)
      autoPlayTimerRef.current = setTimeout(() => {
        nextSlide()
      }, delay)

      return () => {
        if (autoPlayTimerRef.current) {
          clearTimeout(autoPlayTimerRef.current)
          autoPlayTimerRef.current = null
        }
      }
    }

    if (activeMediaType === 'video') {
      const video = videoRefs.current[activeMediaId]
      if (!video) {
        autoPlayTimerRef.current = setTimeout(() => {
          nextSlide()
        }, SLIDE_IMAGE_DURATION_MS)
        return () => clearTimers()
      }

      video.muted = true
      video.defaultMuted = true
      video.playsInline = true
      try {
        video.currentTime = 0
      } catch {
        // ignore
      }

      const playPromise = video.play()
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          autoPlayTimerRef.current = setTimeout(() => {
            nextSlide()
          }, SLIDE_IMAGE_DURATION_MS)
        })
      }

      const maxVideoDuration =
        Number.isFinite(video.duration) && video.duration > 0
          ? Math.max(SLIDE_MIN_DWELL_MS, Math.ceil(video.duration * 1000) + 1200)
          : activeMediaMaxDuration || 45000
      const safetyVideoTimer = setTimeout(() => {
        nextSlide()
      }, maxVideoDuration)

      return () => {
        clearTimeout(safetyVideoTimer)
      }
    }
  }, [
    activeMediaId,
    activeMediaType,
    activeMediaSrc,
    activeMediaMaxDuration,
    isStageActive,
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
      pauseVideos(null)
    }
  }, [clearTimers, pauseVideos])

  // Drag / Swipe handling
  const handlePointerDown = (event) => {
    if (stageRef.current) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    isTouchInteractionRef.current = event.pointerType !== 'mouse'
    if (isTouchInteractionRef.current && isHovered) {
      setIsHovered(false)
    }

    isDraggingRef.current = true
    setIsDragging(true)
    pointerStartRef.current = event.clientX
    dragOffsetRef.current = 0
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
    dragOffsetRef.current = diff
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
        : dragOffsetRef.current
    dragOffsetRef.current = 0
    setDragOffset(0)

    if (finalOffset < -DRAG_THRESHOLD_PX) {
      nextSlide(finalOffset)
      return
    }
    if (finalOffset > DRAG_THRESHOLD_PX) {
      prevSlide(finalOffset)
      return
    }

    if (finalOffset !== 0 && queueRef.current.length >= 2) {
      const currentIdx = activeIndexRef.current
      const currentItem = queueRef.current[currentIdx]
      if (finalOffset < 0) {
        const nextPreview =
          queueRef.current[(currentIdx + 1) % queueRef.current.length]
        if (nextPreview.id !== currentItem.id) {
          launchStage({
            direction: 'cancel',
            items: [currentItem, nextPreview],
            startTransform: `translate3d(${finalOffset}px, 0, 0)`,
            targetTransform: 'translate3d(0%, 0, 0)',
            targetItem: currentItem,
            targetIndex: currentIdx,
            reshuffledQueue: null,
            phase: 'prepare',
          })
        }
      } else {
        const prevPreview =
          queueRef.current[
            (currentIdx - 1 + queueRef.current.length) % queueRef.current.length
          ]
        if (prevPreview.id !== currentItem.id) {
          launchStage({
            direction: 'cancel',
            items: [prevPreview, currentItem],
            startTransform: `translate3d(calc(-100% + ${finalOffset}px), 0, 0)`,
            targetTransform: 'translate3d(-100%, 0, 0)',
            targetItem: currentItem,
            targetIndex: currentIdx,
            reshuffledQueue: null,
            phase: 'prepare',
          })
        }
      }
    }
  }

  const activeItem = queue[activeIndex] || queue[0]
  const prevDragPreview =
    queue.length > 1
      ? queue[(activeIndex - 1 + queue.length) % queue.length]
      : activeItem
  const nextDragPreview =
    queue.length > 1 ? queue[(activeIndex + 1) % queue.length] : activeItem

  let renderedSlides = [activeItem]
  let trackTransform = 'translate3d(0%, 0, 0)'

  if (stage) {
    renderedSlides = stage.items
    trackTransform =
      stage.phase === 'prepare' ? stage.startTransform : stage.targetTransform
  } else if (isDragging && queue.length > 1) {
    if (dragOffset > 0) {
      renderedSlides = [prevDragPreview, activeItem]
      trackTransform = `translate3d(calc(-100% + ${dragOffset}px), 0, 0)`
    } else {
      renderedSlides = [activeItem, nextDragPreview]
      trackTransform = `translate3d(${dragOffset}px, 0, 0)`
    }
  }

  const isAnimating = Boolean(stage)
  const displayIndex =
    stage && stage.direction !== 'cancel' ? stage.targetIndex : activeIndex
  const displayTotal = stage?.reshuffledQueue
    ? Math.max(queue.length, stage.reshuffledQueue.length)
    : queue.length

  const trackClassName = [
    'training-media-track',
    isDragging ? 'is-dragging' : '',
    stage?.phase === 'prepare' ? 'is-instant' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="training-showcase">
      <div
        className={`training-media${isDragging ? ' is-dragging' : ''}`}
        onMouseEnter={() => {
          if (!isTouchInteractionRef.current) {
            setIsHovered(true)
          }
        }}
        onMouseLeave={() => {
          isTouchInteractionRef.current = false
          setIsHovered(false)
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <div
          ref={trackRef}
          className={trackClassName}
          style={{ transform: trackTransform }}
          onTransitionEnd={completeTransition}
        >
          {renderedSlides.map((item) => {
            const isActiveSlide =
              !stage && activeItem && item.id === activeItem.id
            return (
              <div key={item.id} className="training-media-slide">
                {item.type === 'image' ? (
                  <img
                    src={item.src}
                    alt={item.alt}
                    draggable="false"
                    loading="eager"
                    onError={() => {
                      failedImageIdsRef.current.add(item.id)
                    }}
                  />
                ) : (
                  <div className="training-video-container">
                    <video
                      ref={(el) => {
                        if (el) {
                          videoRefs.current[item.id] = el
                        } else {
                          delete videoRefs.current[item.id]
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
                        if (isActiveSlide) nextSlide()
                      }}
                      onError={() => {
                        if (isActiveSlide) {
                          clearTimers()
                          autoPlayTimerRef.current = setTimeout(() => {
                            nextSlide()
                          }, SLIDE_MIN_DWELL_MS)
                        }
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
          <span>{String(displayIndex + 1).padStart(2, '0')}</span>
          <span>{String(displayTotal).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="training-controls">
        <button
          type="button"
          className="training-control-button"
          onClick={() => prevSlide(0)}
          disabled={isAnimating}
          aria-label="Previous training media"
        >
          ←
        </button>

        <div className="training-indicators">
          {queue.map((media, index) => {
            const isActive = index === displayIndex
            return (
              <button
                key={media.id}
                type="button"
                className={`training-indicator${isActive ? ' active' : ''}`}
                onClick={() => goToSlide(index)}
                disabled={isAnimating}
                aria-label={`View training media ${index + 1}`}
                aria-current={isActive ? 'true' : undefined}
              />
            )
          })}
        </div>

        <button
          type="button"
          className="training-control-button"
          onClick={() => nextSlide(0)}
          disabled={isAnimating}
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