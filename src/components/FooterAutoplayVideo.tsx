import { useCallback, useEffect, useRef, useState } from 'react'

const MAX_W = 760
const MAX_H = 330

/**
 * Scales the video uniformly so the full frame is visible (object-contain, no crop),
 * capped by max width/height and the actual column width — no letterboxing because the
 * box matches the scaled video aspect. Muted autoplay + loop.
 */
export default function FooterAutoplayVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const [intrinsic, setIntrinsic] = useState<{ w: number; h: number } | null>(null)
  const [shellW, setShellW] = useState(0)

  const tryPlay = useCallback(() => {
    const v = videoRef.current
    if (v) void v.play().catch(() => {})
  }, [])

  useEffect(() => {
    tryPlay()
    const onVis = () => {
      if (document.visibilityState === 'visible') tryPlay()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [tryPlay])

  useEffect(() => {
    const el = shellRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setShellW(el.clientWidth)
    })
    ro.observe(el)
    setShellW(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const box =
    intrinsic && shellW > 0
      ? (() => {
          const { w: vw, h: vh } = intrinsic
          const scale = Math.min(shellW / vw, MAX_W / vw, MAX_H / vh, 1)
          return {
            w: Math.max(1, Math.round(vw * scale)),
            h: Math.max(1, Math.round(vh * scale)),
          }
        })()
      : null

  return (
    <div ref={shellRef} className="flex w-full min-w-0 justify-center">
      <div
        className="relative overflow-hidden rounded-lg border border-gold-500/25 shadow-md ring-1 ring-white/5"
        style={
          box
            ? { width: box.w, height: box.h }
            : {
                width: 'min(100%, 260px)',
                aspectRatio: '9 / 16',
                maxHeight: MAX_H,
              }
        }
      >
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-contain object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          src={src}
          aria-label="COBA"
          onLoadedMetadata={(e) => {
            const v = e.currentTarget
            if (v.videoWidth > 0 && v.videoHeight > 0) {
              setIntrinsic({ w: v.videoWidth, h: v.videoHeight })
            }
          }}
        />
      </div>
    </div>
  )
}
