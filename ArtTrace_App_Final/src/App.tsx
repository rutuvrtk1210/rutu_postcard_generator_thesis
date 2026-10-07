// @refresh reset
import {
  Component,
  useEffect,
  useRef,
  useState,
} from "react"
import type {
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react"
import startingScreenMarkup from "./generated/starting-screen.svg?raw"

type Feature = "blob" | "cutout" | "note" | "doodle"
type Screen = "start" | "upload" | "making" | "final"
type Theme = "day" | "night"

type CutoutResult = {
  x: number
  y: number
  size: number
  image?: string
  rotation?: number
}

type NoteResult = {
  text: string
  width: number
  fontSize: number
  color: string
}

type Results = {
  blob?: string
  cutout?: CutoutResult
  note?: NoteResult
  doodle?: string
}

type CompositionElement = {
  feature: Feature
  x: number
  y: number
  width: number
  height: number
  z: number
  visible: boolean
  rotation?: number
}

const campusArt = [
  "/assets/14587.webp",
  "/assets/5f166.webp",
  "/assets/bdd23.webp",
  "/assets/db196.webp",
  "/assets/db713.webp",
  "/assets/4bdf5.webp",
  "/assets/266a7.webp",
  "/assets/52c4d.webp",
  "/assets/429c0.webp",
]
const featureNames = ["Color blob", "Photo cutout", "Handwritten note", "Doodle"]
const toolAssets: Record<string, string> = {
  EYEDROPPER: "/assets/0f9d3.svg",
  UPLOAD: "/assets/267db.svg",
  UNDO: "/assets/66631.svg",
  REDO: "/assets/3b00f.svg",
  CUT: "/assets/79ac5.svg",
}

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

function Button({
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`ui-button ${className}`} {...props}>{children}</button>
}

function Brand() {
  return (
    <div className="brand">
      <i />
      <b><strong>art</strong>trace</b>
    </div>
  )
}

// Persistent HEADER pill (HEADER.svg): a 90.5x47.5 rx=23.75 white pill with a 2.5px
// #2F2F2F stroke at the screen origin (104,76), holding the 35x35 rx=17.5 ink toggle
// square (the day/night control). Rendered once at the app root so it is identical on
// every screen. The square keeps ThemeToggle's logic + localStorage persistence.
function HeaderPill({
  theme,
  onToggle,
}: {
  theme: Theme
  onToggle: () => void
}) {
  const isNight = theme === "night"
  return (
    <div className="at-header-pill" role="banner">
      <span className="at-header-wordmark">
        <strong>art</strong>trace<em>.</em>
      </span>
      <Button
        className="at-header-toggle"
        onClick={onToggle}
        aria-label={`Switch to ${isNight ? "day" : "night"} mode`}
        title={`Switch to ${isNight ? "day" : "night"} mode`}
      >
        <Icon
          path={
            isNight
              ? "M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
              : "M20 15.4A8 8 0 0 1 8.6 4 8 8 0 1 0 20 15.4Z"
          }
        />
      </Button>
    </div>
  )
}

function UploadScreen({ onSelect }: { onSelect: (image: string) => void }) {
  const [image, setImage] = useState<string | null>(null)
  const [showLibrary, setShowLibrary] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const chooseFile = (file?: File) => {
    if (!file) return
    setImage(URL.createObjectURL(file))
  }

  return (
    <main className="upload-screen trace-screen">
      <header><Brand /><span>HOME</span></header>
      <section className="upload-intro">
        <h1>
          {showLibrary
            ? <>Select a photograph to create your <strong>Postcard</strong></>
            : <><strong>Trace</strong> a campus sculpture and turn it into <strong>art...</strong></>}
        </h1>
        <p>CHOOSE A PHOTO THAT YOU WILL USE TO CREATE YOUR POSTCARD.</p>
      </section>

      <section className={`upload-stage ${image ? "has-image" : ""} ${showLibrary ? "show-library" : ""}`}>
        {showLibrary ? (
          <div className="trace-gallery">
            {campusArt.map((art, index) => (
              <Button
                key={art}
                onClick={() => {
                  setImage(art)
                  setShowLibrary(false)
                }}
                aria-label={`Select campus artwork ${index + 1}`}
              >
                <img src={art} alt="" />
              </Button>
            ))}
          </div>
        ) : image ? (
          <img src={image} alt="Selected campus artwork" />
        ) : (
          <button onClick={() => setShowLibrary(true)} className="upload-empty" aria-label="Open the campus artwork library" />
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(event) => chooseFile(event.target.files?.[0])}
        />
        {image && <div className="trace-stage-actions">
          <Button onClick={() => onSelect(image)}>Create Postcard</Button>
          <Button onClick={() => fileRef.current?.click()}>Retrace</Button>
        </div>}
      </section>

      <aside className="trace-tools trace-left-tools">
        <WorkspaceTool assetSrc="/assets/267db.svg" label="UPLOAD" path="M12 16V4M7 9l5-5 5 5M5 14v5h14v-5" onClick={() => fileRef.current?.click()} />
        <WorkspaceTool assetSrc="/assets/6eb26.svg" label="UNDO" path="M9 7 4 12l5 5M5 12h9a5 5 0 0 1 5 5" disabled />
        <WorkspaceTool assetSrc="/assets/4efa9.svg" label="REDO" path="m15 7 5 5-5 5M19 12h-9a5 5 0 0 0-5 5" disabled />
      </aside>
      <aside className="trace-tools trace-right-tools">
        <WorkspaceTool label="SHARE" path="M18 8a3 3 0 1 0-2.8-4M6 15a3 3 0 1 0 0 6M18 14a3 3 0 1 0 0 6M8.6 17.5l6.8-3M8.6 6.5l6.8 3" />
      </aside>
      <Button className="trace-back" disabled><Icon path="M15 18l-6-6 6-6" /> Back</Button>
      <Button className="trace-next" disabled={!image} onClick={() => image && onSelect(image)}>Next <Icon path="M5 12h14M14 7l5 5-5 5" /></Button>
    </main>
  )
}

function FeatureChrome({
  step,
  onNext,
  onSkip,
  onBack,
  className = "",
  children,
  nextDisabled = false,
  nextLabel = "Next",
}: {
  step: number
  onNext: () => void
  onSkip: () => void
  onBack?: () => void
  className?: string
  children: ReactNode
  nextDisabled?: boolean
  nextLabel?: string
}) {
  return (
    <main className={`feature-screen ${className}`}>
      <header className="feature-progress">
        <Brand />
        <div className="progress-copy"><span>STEP {step + 1} OF 4</span></div>
        <div className="progress-track">
          {[0, 1, 2, 3].map((i) => (
            <i key={i} className={i <= step ? "active" : ""} />
          ))}
        </div>
      </header>
      {children}
      <footer className="feature-nav">
        <Button className="back-button" onClick={onBack}>
          <img src="/assets/b29e0.svg" alt="" /> Back
        </Button>
        <Button className="skip-button" onClick={onSkip}>Skip</Button>
        <Button className="next-button" onClick={onNext} disabled={nextDisabled}>
          <img src="/assets/143eb.svg" alt="" /> {nextLabel}
        </Button>
      </footer>
    </main>
  )
}

function WorkspaceTool({
  label,
  path,
  assetSrc,
  className = "",
  ...props
}: {
  label: string
  path: string
  assetSrc?: string
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const source = assetSrc ?? toolAssets[label]
  return (
    <Button className={`workspace-tool ${className}`} {...props}>
      <span className={source && label !== "UPLOAD" ? "full-asset" : ""}>
        {source ? <img src={source} alt="" /> : <Icon path={path} />}
      </span>
      <small>{label}</small>
    </Button>
  )
}

function BlobFeature({
  image,
  initialBlob,
  onNext,
  onSkip,
  onBack,
}: {
  image: string
  initialBlob?: string
  onNext: (result?: string) => void
  onSkip: () => void
  onBack: () => void
}) {
  type BlobStamp = {
    id: number
    x: number
    y: number
    size: number
    opacity: number
    rotation: number
  }

  const paintCanvasRef = useRef<HTMLCanvasElement>(null)
  const referenceCanvasRef = useRef<HTMLCanvasElement>(null)
  const referenceImageRef = useRef<HTMLImageElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const referenceBounds = useRef({ x: 0, y: 0, width: 0, height: 0 })
  const undoHistory = useRef<BlobStamp[][]>([])
  const redoHistory = useRef<BlobStamp[][]>([])
  const stampId = useRef(0)
  const sampleRedo = useRef<string[]>([])
  const painting = useRef(false)
  const lastPaintPoint = useRef({ x: 0, y: 0 })
  const backgroundImage = useRef<HTMLImageElement | null>(null)
  const backgroundState = useRef<"idle" | "loading" | "ready" | "error">("idle")
  const [stage, setStage] = useState<"select" | "create" | "paint">(initialBlob ? "paint" : "select")
  const [referenceImage, setReferenceImage] = useState(image)
  const [palette, setPalette] = useState<string[]>([])
  const [stamps, setStamps] = useState<BlobStamp[]>([])
  const [selectedStamp, setSelectedStamp] = useState<number | null>(null)
  const [brushSize, setBrushSize] = useState(104)
  const [brushOpacity, setBrushOpacity] = useState(82)
  const [cursor, setCursor] = useState({ x: 50, y: 50, visible: true })
  const [renderVersion, setRenderVersion] = useState(0)
  const [paintTool, setPaintTool] = useState<"add" | "move">("add")
  const movingStamp = useRef<number | null>(null)
  const [arrivedSwatch, setArrivedSwatch] = useState<number | null>(null)
  const arriveTimer = useRef<number | null>(null)

  const drawReference = () => {
    const canvas = referenceCanvasRef.current
    const photo = referenceImageRef.current
    if (!canvas || !photo || !photo.naturalWidth) return
    const rect = canvas.getBoundingClientRect()
    const ratio = window.devicePixelRatio
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const context = canvas.getContext("2d", { willReadFrequently: true })
    if (!context) return
    context.fillStyle = "#242720"
    context.fillRect(0, 0, canvas.width, canvas.height)
    const scale = Math.max(canvas.width / photo.naturalWidth, canvas.height / photo.naturalHeight)
    const width = photo.naturalWidth * scale
    const height = photo.naturalHeight * scale
    const x = (canvas.width - width) / 2
    const y = (canvas.height - height) / 2
    context.drawImage(photo, x, y, width, height)
    referenceBounds.current = { x, y, width, height }
  }

  const sizePaintCanvas = () => {
    const canvas = paintCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const width = Math.round(rect.width * window.devicePixelRatio)
    const height = Math.round(rect.height * window.devicePixelRatio)
    if (!width || !height || (canvas.width === width && canvas.height === height)) return false
    canvas.width = width
    canvas.height = height
    return true
  }

  const drawBlob = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    opacity: number,
    rotation: number,
  ) => {
    if (palette.length !== 4) return
    const shape = new Path2D("M454.019 273.215C416.895 424.754 402.256 500 231.287 500C60.3176 500 65.0241 384.518 8.55488 273.215C-47.9144 161.913 192.193 -107.677 231.287 46.431C270.381 200.539 491.143 121.677 454.019 273.215Z")
    context.save()
    context.translate(x, y)
    context.rotate(rotation)
    context.scale(size / 458.208, size / 500)
    context.translate(-229.104, -250)
    context.globalAlpha = opacity
    context.clip(shape)
    const gradient = context.createRadialGradient(346, 182, 12, 244, 260, 355)
    palette.forEach((color, index) => {
      gradient.addColorStop([0, .28, .58, 1][index], color)
    })
    context.fillStyle = gradient
    context.fillRect(-50, -110, 560, 660)
    context.restore()
  }

  const renderComposition = () => {
    const canvas = paintCanvasRef.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return
    const ratio = window.devicePixelRatio
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = "#fff7e8"
    context.fillRect(0, 0, canvas.width, canvas.height)
    if (initialBlob) {
      if (backgroundState.current === "idle") {
        backgroundState.current = "loading"
        const img = new Image()
        img.onload = () => {
          backgroundImage.current = img
          backgroundState.current = "ready"
          setRenderVersion((current) => current + 1)
        }
        img.onerror = () => {
          backgroundState.current = "error"
          console.warn("BlobFeature: failed to load prior blob artwork; starting from a blank canvas.")
        }
        img.src = initialBlob
      }
      if (backgroundState.current === "ready" && backgroundImage.current) {
        context.drawImage(backgroundImage.current, 0, 0, canvas.width, canvas.height)
      }
    }
    stamps.forEach((stamp) => {
      drawBlob(
        context,
        stamp.x * canvas.width,
        stamp.y * canvas.height,
        stamp.size * ratio,
        stamp.opacity,
        stamp.rotation,
      )
    })
    const selected = stamps.find((stamp) => stamp.id === selectedStamp)
    if (selected) {
      context.save()
      context.strokeStyle = "rgba(41,43,39,.55)"
      context.lineWidth = ratio
      context.setLineDash([5 * ratio, 5 * ratio])
      context.beginPath()
      context.arc(
        selected.x * canvas.width,
        selected.y * canvas.height,
        selected.size * ratio * .55,
        0,
        Math.PI * 2,
      )
      context.stroke()
      context.restore()
    }
  }

  useEffect(() => {
    const sync = () => {
      drawReference()
      setRenderVersion((current) => current + 1)
    }
    const frame = requestAnimationFrame(sync)
    window.addEventListener("resize", sync)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", sync)
      if (arriveTimer.current) window.clearTimeout(arriveTimer.current)
    }
  }, [])

  useEffect(() => {
    sizePaintCanvas()
    renderComposition()
  }, [palette, stamps, selectedStamp, renderVersion, stage])

  useEffect(() => {
    if (stage !== "create") return
    const timer = window.setTimeout(() => {
      sizePaintCanvas()
      setStage("paint")
    }, 900)
    return () => window.clearTimeout(timer)
  }, [stage])

  const sampleColor = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (palette.length >= 4) return
    const canvas = event.currentTarget
    const rect = canvas.getBoundingClientRect()
    const ratio = window.devicePixelRatio
    const x = (event.clientX - rect.left) * ratio
    const y = (event.clientY - rect.top) * ratio
    const bounds = referenceBounds.current
    if (x < bounds.x || x > bounds.x + bounds.width || y < bounds.y || y > bounds.y + bounds.height) return
    const pixel = canvas.getContext("2d", { willReadFrequently: true })?.getImageData(x, y, 1, 1).data
    if (!pixel) return
    const sampled = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`
    const next = [...palette, sampled]
    sampleRedo.current = []
    setPalette(next)
    const arrivedIndex = next.length - 1
    setArrivedSwatch(arrivedIndex)
    if (arriveTimer.current) window.clearTimeout(arriveTimer.current)
    arriveTimer.current = window.setTimeout(() => setArrivedSwatch(null), 300)
    if (next.length === 4) {
      setStage("create")
    }
  }

  const selectReference = (source: string) => {
    setReferenceImage(source)
    setPalette([])
    sampleRedo.current = []
  }

  const commitStamps = (next: BlobStamp[]) => {
    undoHistory.current.push(stamps)
    redoHistory.current = []
    setStamps(next)
    setSelectedStamp(null)
  }

  const undo = () => {
    const previous = undoHistory.current.pop()
    if (!previous) return
    redoHistory.current.push(stamps)
    setStamps(previous)
    setSelectedStamp(null)
  }

  const redo = () => {
    const next = redoHistory.current.pop()
    if (!next) return
    undoHistory.current.push(stamps)
    setStamps(next)
    setSelectedStamp(null)
  }

  const clearPainting = () => {
    if (stamps.length) commitStamps([])
  }

  const cursorGradient = palette.length === 4
    ? `radial-gradient(circle at 68% 34%, ${palette[0]} 0%, ${palette[1]} 28%, ${palette[2]} 58%, ${palette[3]} 100%)`
    : "transparent"

  const undoSample = () => {
    setPalette((current) => {
      const removed = current.at(-1)
      if (removed) sampleRedo.current.push(removed)
      return current.slice(0, -1)
    })
  }

  const redoSample = () => {
    const restored = sampleRedo.current.pop()
    if (restored) setPalette((current) => [...current, restored])
  }

  const stampBlob = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    const existing = [...stamps].reverse().find((stamp) => {
      const distance = Math.hypot((stamp.x - x) * rect.width, (stamp.y - y) * rect.height)
      return distance < stamp.size * .48
    })
    if (paintTool === "move") {
      painting.current = false
      if (!existing) {
        setSelectedStamp(null)
        return
      }
      undoHistory.current.push(stamps)
      redoHistory.current = []
      movingStamp.current = existing.id
      setSelectedStamp(existing.id)
      event.currentTarget.setPointerCapture(event.pointerId)
      return
    }
    undoHistory.current.push(stamps)
    redoHistory.current = []
    painting.current = true
    lastPaintPoint.current = { x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
    stampId.current += 1
    setStamps([...stamps, {
      id: stampId.current,
      x,
      y,
      size: brushSize,
      opacity: brushOpacity / 100,
      rotation: ((stampId.current * 47) % 360) * Math.PI / 180,
    }])
  }

  const continuePainting = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setCursor({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
      visible: true,
    })
    if (paintTool === "move" && movingStamp.current) {
      const movingId = movingStamp.current
      setStamps((current) => current.map((stamp) => (
        stamp.id === movingId
          ? {
              ...stamp,
              x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
              y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
            }
          : stamp
      )))
      return
    }
    if (!painting.current) return
    if (Math.hypot(event.clientX - lastPaintPoint.current.x, event.clientY - lastPaintPoint.current.y) < brushSize * .34) return
    lastPaintPoint.current = { x: event.clientX, y: event.clientY }
    stampId.current += 1
    const nextStamp: BlobStamp = {
      id: stampId.current,
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
      size: brushSize,
      opacity: brushOpacity / 100,
      rotation: ((stampId.current * 47) % 360) * Math.PI / 180,
    }
    setStamps((current) => [...current, nextStamp])
  }

  return (
    <FeatureChrome
      step={0}
      className="reference-feature-screen studio-feature-screen blob-feature-screen"
      onBack={onBack}
      onSkip={onSkip}
      onNext={() => stage === "paint"
        ? onNext(stamps.length || initialBlob ? paintCanvasRef.current?.toDataURL("image/png") : undefined)
        : setStage("paint")}
      nextDisabled={stage === "create" || (stage === "select" && palette.length !== 4)}
    >
      <section className={`reference-workspace blob-reference-workspace stage-${stage}`}>
        <div className="reference-title">
          <h1>
            {stage === "paint" ? (
              <><span className="accent-pink">Paint</span> with your <span className="accent-blue">Color</span><span className="accent-purple">Blob</span> <span className="accent-mint">Brush</span></>
            ) : (
              <>Build your <span className="accent-pink">ColorBlob</span> Brush...</>
            )}
          </h1>
          <p>{stage === "paint" ? "PUT IT ON THE CANVAS AND PLAY WITH YOUR BLOBS" : "PICK ANY 4 COLORS YOU WANT FROM THE PHOTOGRAPH BELOW"}</p>
        </div>

        <aside className="workspace-tools left-tools">
          <WorkspaceTool label="UPLOAD" path="M12 16V4M7 9l5-5 5 5M5 14v5h14v-5" onClick={() => fileRef.current?.click()} />
          <WorkspaceTool
            label="UNDO"
            path="M9 7 4 12l5 5M5 12h9a5 5 0 0 1 5 5"
            onClick={stage === "paint" ? undo : undoSample}
            disabled={stage === "paint" ? !undoHistory.current.length : !palette.length}
          />
          <WorkspaceTool
            label="REDO"
            path="m15 7 5 5-5 5M19 12h-9a5 5 0 0 0-5 5"
            onClick={stage === "paint" ? redo : redoSample}
            disabled={stage === "paint" ? !redoHistory.current.length : !sampleRedo.current.length}
          />
        </aside>

        <div className="reference-canvas-shell">
          {stage === "paint" ? (
            <div className="blob-postcard">
              <canvas
                ref={paintCanvasRef}
                onPointerEnter={() => setCursor((current) => ({ ...current, visible: true }))}
                onPointerMove={continuePainting}
                onPointerDown={stampBlob}
                onPointerUp={() => {
                  painting.current = false
                  movingStamp.current = null
                }}
                onPointerCancel={() => {
                  painting.current = false
                  movingStamp.current = null
                }}
                aria-label="Blank postcard canvas. Tap to stamp the four-color blob."
              />
              <span
                className={`brush-cursor organic-blob ${cursor.visible ? "visible" : ""}`}
                style={{
                  left: `${cursor.x}%`,
                  top: `${cursor.y}%`,
                  width: `${brushSize}px`,
                  height: `${brushSize * 1.09}px`,
                  background: cursorGradient,
                  opacity: brushOpacity / 100,
                }}
              />
            </div>
          ) : (
            <>
              <img ref={referenceImageRef} src={referenceImage} onLoad={drawReference} alt="" hidden />
              <canvas
                ref={referenceCanvasRef}
                onPointerDown={sampleColor}
                aria-label="Reference image. Tap to sample a color."
              />
              {stage === "create" && (
                <div className="blob-loading" role="status">
                  <div className="blob-orbit" aria-hidden="true">
                    {palette.map((color, index) => <i key={color + index} style={{ background: color }} />)}
                    <span className="generated-blob" style={{ background: cursorGradient }} />
                  </div>
                  <b>Hold on… creating your Color Blob</b>
                </div>
              )}
            </>
          )}
        </div>

        <aside className="workspace-tools right-tools">
          {stage === "paint" ? (
            <>
              <WorkspaceTool
                label="ADD BLOB"
                className={paintTool === "add" ? "active" : ""}
                path="M12 3c4 4 7 7 7 11a7 7 0 0 1-14 0c0-4 3-7 7-11ZM12 9v7M8.5 12.5h7"
                onClick={() => {
                  setPaintTool("add")
                  setSelectedStamp(null)
                  setCursor((current) => ({ ...current, visible: true }))
                }}
              />
              <WorkspaceTool
                label="MOVE BLOB"
                className={paintTool === "move" ? "active" : ""}
                path="m5 3 12 8-5 1 3 6-2 1-3-6-3 4Z"
                onClick={() => {
                  setPaintTool("move")
                  setSelectedStamp(null)
                  setCursor((current) => ({ ...current, visible: false }))
                }}
              />
            </>
          ) : (
            <>
              <WorkspaceTool label="EYEDROPPER" path="m19 3 2 2-4 4-2-2 4-4ZM16 8 6 18l-3 3 3-1 11-11" />
              <div className="rail-swatches" aria-label={`${palette.length} of 4 colors selected`}>
                {[0, 1, 2, 3].map((index) => (
                  <i key={index} className={`${palette[index] ? "filled" : ""}${arrivedSwatch === index ? " swatch-arrive" : ""}`.trim()} style={{ background: palette[index] }} />
                ))}
                <Button
                  className="add-color"
                  onClick={() => setStage(palette.length === 4 ? "create" : "select")}
                  disabled={palette.length !== 4}
                  aria-label="Add color blob"
                >
                  <Icon path="M12 5v14M5 12h14" />
                </Button>
              </div>
            </>
          )}
        </aside>

        {stage === "paint" ? (
          <div className="blob-slider-panel">
            <label>
              <input
                type="range"
                min="48"
                max="190"
                value={selectedStamp ? stamps.find((stamp) => stamp.id === selectedStamp)?.size ?? brushSize : brushSize}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  setBrushSize(value)
                  if (selectedStamp) setStamps((current) => current.map((stamp) => stamp.id === selectedStamp ? { ...stamp, size: value } : stamp))
                }}
              />
              <span>BLOB SIZE</span>
            </label>
            <label>
              <input
                type="range"
                min="20"
                max="100"
                value={selectedStamp ? Math.round((stamps.find((stamp) => stamp.id === selectedStamp)?.opacity ?? brushOpacity / 100) * 100) : brushOpacity}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  setBrushOpacity(value)
                  if (selectedStamp) setStamps((current) => current.map((stamp) => stamp.id === selectedStamp ? { ...stamp, opacity: value / 100 } : stamp))
                }}
              />
              <span>BLOB OPACITY</span>
            </label>
            <Button onClick={clearPainting}>Clear canvas</Button>
          </div>
        ) : (
          <div className="blob-palette-panel">
            <span className="palette-count">{palette.length} / 4 COLORS SELECTED</span>
            {palette.length > 0 && <span className="palette-blob organic-blob" style={{ background: cursorGradient }} />}
          </div>
        )}

        <input
          ref={fileRef}
          className="workspace-file-input"
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) selectReference(URL.createObjectURL(file))
          }}
        />
        {stage === "select" && palette.length === 0 && (
          <div className="reference-carousel" aria-label="Artwork references">
            {campusArt.map((art, index) => (
              <Button key={art} className={referenceImage === art ? "active" : ""} onClick={() => selectReference(art)} aria-label={`Use artwork ${index + 1}`}>
                <img src={art} alt="" />
              </Button>
            ))}
          </div>
        )}
      </section>
    </FeatureChrome>
  )
}

function StampCutout({ image, crop }: { image: string; crop: CutoutResult }) {
  return (
    <span
      className="stamp-cutout"
      style={{
        width: `${crop.size}%`,
        transform: crop.rotation ? `rotate(${crop.rotation}deg)` : undefined,
      }}
    >
      <img src={crop.image ?? image} style={{ objectPosition: `${crop.x}% ${crop.y}%` }} alt="" />
    </span>
  )
}

function CutoutFeature({
  image,
  initialCutout,
  onNext,
  onSkip,
  onBack,
}: {
  image: string
  initialCutout?: CutoutResult
  onNext: (result?: CutoutResult) => void
  onSkip: () => void
  onBack: () => void
}) {
  const [crop, setCrop] = useState<CutoutResult>(initialCutout ?? { x: 50, y: 48, size: 45 })
  const [stage, setStage] = useState<"select" | "masked" | "placed">(initialCutout ? "placed" : "select")
  const [placedAt, setPlacedAt] = useState({ x: 50, y: 50 })
  const [rotation, setRotation] = useState(initialCutout?.rotation ?? 0)
  const [cutoutImage, setCutoutImage] = useState(initialCutout?.image ?? image)
  const fileRef = useRef<HTMLInputElement>(null)
  const cropUndo = useRef<CutoutResult[]>([])
  const cropRedo = useRef<CutoutResult[]>([])
  const dragging = useRef(false)
  const movingPlaced = useRef(false)

  const rememberCrop = () => {
    cropUndo.current.push(crop)
    cropRedo.current = []
  }

  const undoCrop = () => {
    const previous = cropUndo.current.pop()
    if (!previous) return
    cropRedo.current.push(crop)
    setCrop(previous)
  }

  const redoCrop = () => {
    const next = cropRedo.current.pop()
    if (!next) return
    cropUndo.current.push(crop)
    setCrop(next)
  }

  const finishCutout = () => onNext({
    ...crop,
    image: cutoutImage,
    rotation,
  })

  const advanceCutout = () => {
    if (stage === "select") setStage("masked")
    else if (stage === "masked") setStage("placed")
    else finishCutout()
  }

  const goBack = () => {
    if (stage === "placed") setStage("masked")
    else if (stage === "masked") setStage("select")
    else onBack()
  }

  return (
    <FeatureChrome
      step={1}
      className="reference-feature-screen studio-feature-screen cutout-feature-screen"
      onBack={goBack}
      onSkip={onSkip}
      onNext={advanceCutout}
      nextLabel={stage === "placed" ? "Finish" : "Next"}
    >
      <section className={`reference-workspace cut-workspace cut-stage-${stage}`}>
        <div className="reference-title">
          <h1>CutOut an image into a <span className="accent-purple">Stamp Brush...</span></h1>
          <p>
            {stage === "select" && "MOVE AND RESIZE THE BLANK STAMP TO SELECT YOUR IMAGE"}
            {stage === "masked" && "MOVE AND RESIZE THE BLANK STAMP TO SELECT YOUR IMAGE"}
            {stage === "placed" && "MOVE AND RESIZE THE BLANK STAMP TO SELECT YOUR IMAGE"}
          </p>
        </div>
        <aside className="workspace-tools left-tools">
          <WorkspaceTool label="UPLOAD" path="M12 16V4M7 9l5-5 5 5M5 14v5h14v-5" onClick={() => fileRef.current?.click()} />
          <WorkspaceTool assetSrc="/assets/64327.svg" label="UNDO" path="M9 7 4 12l5 5M5 12h9a5 5 0 0 1 5 5" onClick={undoCrop} disabled={!cropUndo.current.length} />
          <WorkspaceTool assetSrc="/assets/ae3db.svg" label="REDO" path="m15 7 5 5-5 5M19 12h-9a5 5 0 0 0-5 5" onClick={redoCrop} disabled={!cropRedo.current.length} />
        </aside>

        <div className="reference-canvas-shell">
          {stage !== "placed" ? (
            <>
              <img className="cutout-background" src={cutoutImage} alt="Sculpture selected for the photo cutout" />
              {stage === "masked" && <span className="cutout-dim" />}
              <div
                className={`crop-boundary ${stage === "masked" ? "revealed" : "blank"}`}
                style={{ left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.size}%` }}
                onPointerDown={(event) => {
                  if (stage !== "select") return
                  rememberCrop()
                  dragging.current = true
                  event.currentTarget.setPointerCapture(event.pointerId)
                }}
                onPointerMove={(event) => {
                  if (!dragging.current || stage !== "select") return
                  const canvas = event.currentTarget.parentElement
                  if (!canvas) return
                  const rect = canvas.getBoundingClientRect()
                  setCrop((current) => ({
                    ...current,
                    x: Math.max(18, Math.min(82, ((event.clientX - rect.left) / rect.width) * 100)),
                    y: Math.max(18, Math.min(82, ((event.clientY - rect.top) / rect.height) * 100)),
                  }))
                }}
                onPointerUp={() => { dragging.current = false }}
              >
                {stage === "masked" && (
                  <StampCutout image={cutoutImage} crop={{ ...crop, size: 100, rotation: 0 }} />
                )}
              </div>
            </>
          ) : (
            <div className="cutout-postcard">
              <div
                className="placed-cutout"
                style={{
                  left: `${placedAt.x}%`,
                  top: `${placedAt.y}%`,
                  width: `${crop.size}%`,
                  transform: `translate(-50%,-50%) rotate(${rotation}deg)`,
                }}
                onPointerDown={(event) => {
                  movingPlaced.current = true
                  event.currentTarget.setPointerCapture(event.pointerId)
                }}
                onPointerMove={(event) => {
                  if (!movingPlaced.current) return
                  const canvas = event.currentTarget.parentElement
                  if (!canvas) return
                  const rect = canvas.getBoundingClientRect()
                  setPlacedAt({
                    x: Math.max(12, Math.min(88, ((event.clientX - rect.left) / rect.width) * 100)),
                    y: Math.max(14, Math.min(86, ((event.clientY - rect.top) / rect.height) * 100)),
                  })
                }}
                onPointerUp={() => { movingPlaced.current = false }}
              >
                <StampCutout image={cutoutImage} crop={{ ...crop, size: 100 }} />
              </div>
            </div>
          )}
        </div>

        <aside className="workspace-tools right-tools">
          <WorkspaceTool label={stage === "placed" ? "DONE" : "CUT"} path="M6 3l12 18M18 3 6 21M8 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm14 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" onClick={advanceCutout} />
          <WorkspaceTool label="UPLOAD" path="M12 16V4M7 9l5-5 5 5M5 14v5h14v-5" onClick={() => fileRef.current?.click()} />
        </aside>

        <div className="cutout-controls">
          {stage !== "masked" && (
            <label>
              <input
                type="range"
                min="25"
                max="72"
                value={crop.size}
                onPointerDown={rememberCrop}
                onChange={(event) => setCrop((current) => ({ ...current, size: Number(event.target.value) }))}
              />
              <span>STAMP SIZE</span>
            </label>
          )}
          {stage === "placed" && (
            <label>
              <input type="range" min="-30" max="30" value={rotation} onChange={(event) => setRotation(Number(event.target.value))} />
              <span>STAMP ROTATION</span>
            </label>
          )}
          {stage === "select" && (
            <Button onClick={() => {
              rememberCrop()
              setCrop({ x: 50, y: 48, size: 45, image: cutoutImage })
            }}><Icon path="M5 5v5h5M5 10a8 8 0 1 1 2 7" /> Reset</Button>
          )}
          {stage === "masked" && <Button onClick={() => setStage("select")}>Edit selection</Button>}
          <Button className="place-button" onClick={advanceCutout}>
            {stage === "select" && "Confirm cutout"}
            {stage === "masked" && "Place on postcard"}
            {stage === "placed" && "Done"}
          </Button>
        </div>
        <input
          ref={fileRef}
          className="workspace-file-input"
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              const source = URL.createObjectURL(file)
              setCutoutImage(source)
              setCrop((current) => ({ ...current, image: source }))
            }
          }}
        />
      </section>
    </FeatureChrome>
  )
}

function NoteFeature({
  initialNote,
  onNext,
  onSkip,
  onBack,
}: {
  initialNote?: NoteResult
  onNext: (result?: NoteResult) => void
  onSkip: () => void
  onBack: () => void
}) {
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const noteUndo = useRef<NoteResult[]>([])
  const noteRedo = useRef<NoteResult[]>([])
  const noteTextAtFocus = useRef("")
  const [note, setNote] = useState<NoteResult>(initialNote ?? {
    text: "",
    width: 54,
    fontSize: 28,
    color: "#f7f1e3",
  })

  const commitNote = (snapshot: NoteResult = note) => {
    noteUndo.current.push(snapshot)
    noteRedo.current = []
  }

  const undoNote = () => {
    const previous = noteUndo.current.pop()
    if (!previous) return
    noteRedo.current.push(note)
    setNote(previous)
  }

  const redoNote = () => {
    const next = noteRedo.current.pop()
    if (!next) return
    noteUndo.current.push(note)
    setNote(next)
  }

  return (
    <FeatureChrome
      step={3}
      className="reference-feature-screen studio-feature-screen note-feature-screen"
      onBack={onBack}
      onSkip={onSkip}
      onNext={() => onNext(note.text.trim() ? note : undefined)}
      nextLabel="Finish"
    >
      <section className="reference-workspace note-studio-workspace">
        <div className="reference-title">
          <h1>Write a <span className="accent-mint">Handwritten Note...</span></h1>
          <p>WRITE A SHORT MEMORY OR ANY FEELING YOU HAD DURING YOUR WALK TODAY.</p>
        </div>

        <aside className="workspace-tools left-tools note-tool-rail">
          <WorkspaceTool label="WRITE" path="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" onClick={() => noteRef.current?.focus()} />
          <WorkspaceTool label="UNDO" path="M9 7 4 12l5 5M5 12h9a5 5 0 0 1 5 5" onClick={undoNote} disabled={!noteUndo.current.length} />
          <WorkspaceTool label="REDO" path="m15 7 5 5-5 5M19 12h-9a5 5 0 0 0-5 5" onClick={redoNote} disabled={!noteRedo.current.length} />
        </aside>

        <div className="reference-canvas-shell note-canvas-shell">
          <div className="note-postcard">
            <textarea
              ref={noteRef}
              value={note.text}
              onFocus={() => { noteTextAtFocus.current = note.text }}
              onBlur={() => { if (note.text !== noteTextAtFocus.current) commitNote({ ...note, text: noteTextAtFocus.current }) }}
              onChange={(event) => setNote((current) => ({ ...current, text: event.target.value }))}
              placeholder="Write what stayed with you…"
              style={{
                width: `${note.width}%`,
                fontSize: `${note.fontSize}px`,
                background: note.color,
              }}
              maxLength={100}
              autoFocus
            />
          </div>
        </div>

        <aside className="workspace-tools right-tools note-color-rail">
          <span className="rail-label">PAPER</span>
          <div className="paper-colors">
            {["#f7f1e3", "#f4d9a8", "#d4e3d5", "#d6e4ed", "#edcdd1"].map((color) => (
              <Button key={color} style={{ background: color }} className={color === note.color ? "active" : ""} onClick={() => { if (color !== note.color) { commitNote(); setNote((current) => ({ ...current, color })) } }} aria-label={`Use ${color} paper`} />
            ))}
          </div>
        </aside>

        <div className="note-controls studio-controls">
          <label><input type="range" min="35" max="80" value={note.width} onPointerDown={() => commitNote()} onChange={(event) => setNote((current) => ({ ...current, width: Number(event.target.value) }))} /><span>NOTE SIZE</span></label>
          <label><input type="range" min="18" max="44" value={note.fontSize} onPointerDown={() => commitNote()} onChange={(event) => setNote((current) => ({ ...current, fontSize: Number(event.target.value) }))} /><span>TYPE SIZE</span></label>
        </div>
      </section>
    </FeatureChrome>
  )
}

function DoodleFeature({
  initialDoodle,
  onNext,
  onSkip,
  onBack,
}: {
  initialDoodle?: string
  onNext: (result?: string) => void
  onSkip: () => void
  onBack: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const history = useRef<string[]>([])
  const redo = useRef<string[]>([])
  const [mode, setMode] = useState<"guided" | "freehand">("guided")
  const [color, setColor] = useState("#df745b")
  const [size, setSize] = useState(5)
  const [hasDrawing, setHasDrawing] = useState(Boolean(initialDoodle))

  const context = () => canvasRef.current?.getContext("2d")
  const snapshot = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    history.current.push(canvas.toDataURL())
    redo.current = []
  }
  const restore = (source?: string) => {
    const canvas = canvasRef.current
    const ctx = context()
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!source) return
    const image = new Image()
    image.onload = () => ctx.drawImage(image, 0, 0)
    image.src = source
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    if (initialDoodle) {
      restore(initialDoodle)
      setHasDrawing(true)
    }
  }, [])

  const point = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: (event.clientX - rect.left) * window.devicePixelRatio,
      y: (event.clientY - rect.top) * window.devicePixelRatio,
    }
  }

  const undoDoodle = () => {
    const current = canvasRef.current?.toDataURL()
    const previous = history.current.pop()
    if (current) redo.current.push(current)
    restore(previous)
  }

  const redoDoodle = () => {
    const next = redo.current.pop()
    if (next && canvasRef.current) history.current.push(canvasRef.current.toDataURL())
    restore(next)
  }

  const clearDoodle = () => {
    snapshot()
    restore()
    setHasDrawing(false)
  }

  return (
    <FeatureChrome
      step={2}
      className="reference-feature-screen studio-feature-screen doodle-feature-screen"
      onBack={onBack}
      onSkip={onSkip}
      onNext={() => onNext(hasDrawing ? canvasRef.current?.toDataURL() : undefined)}
    >
      <section className="reference-workspace doodle-studio-workspace">
        <div className="reference-title">
          <h1><span className="accent-blue">Doodle</span> your interpretation of the Sculpture</h1>
          <p>FOLLOW THE GUIDE OR DRAW FREELY. CREATE ANY SHAPE OR FORM YOU IMAGINE.</p>
        </div>

        <aside className="workspace-tools left-tools">
          <WorkspaceTool label="DRAW" path="M4 20c4-1 3-6 6-7l7-7 3 3-7 7c-1 3-6 2-7 4H4Z" />
          <WorkspaceTool label="UNDO" path="M9 7 4 12l5 5M5 12h9a5 5 0 0 1 5 5" onClick={undoDoodle} />
          <WorkspaceTool label="REDO" path="m15 7 5 5-5 5M19 12h-9a5 5 0 0 0-5 5" onClick={redoDoodle} />
        </aside>

        <div className="reference-canvas-shell doodle-canvas-shell">
          {mode === "guided" && (
            <p className="doodle-guide-caption">Draw inside the box.</p>
          )}
          {mode === "guided" && (
            <svg className="guide-path" viewBox="0 0 800 700" aria-hidden="true">
              <path d="M102 501c34-178 180-336 332-325 116 9 240 118 232 241-10 151-190 231-323 188-118-38-179-157-117-255 47-74 154-88 225-31 54 44 61 133 9 180-44 39-121 26-151-29" />
            </svg>
          )}
          <canvas
            ref={canvasRef}
            onPointerDown={(event) => {
              snapshot()
              drawing.current = true
              event.currentTarget.setPointerCapture(event.pointerId)
              const next = point(event)
              const ctx = context()
              if (!ctx) return
              ctx.beginPath()
              ctx.moveTo(next.x, next.y)
            }}
            onPointerMove={(event) => {
              if (!drawing.current) return
              const ctx = context()
              if (!ctx) return
              const next = point(event)
              ctx.strokeStyle = color
              ctx.lineWidth = size * window.devicePixelRatio
              ctx.lineCap = "round"
              ctx.lineJoin = "round"
              ctx.lineTo(next.x, next.y)
              ctx.stroke()
              setHasDrawing(true)
            }}
            onPointerUp={() => { drawing.current = false }}
          />
        </div>

        <aside className="workspace-tools right-tools">
          <WorkspaceTool label="CLEAR" path="M6 7h12M9 7V4h6v3M8 7l1 13h6l1-13" onClick={clearDoodle} />
          <label className="doodle-color-tool">
            <span><Icon path="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11Z" /></span>
            <small>COLOR</small>
            <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
          </label>
        </aside>

        <div className="doodle-controls studio-controls">
          <div className="mode-switch">
            <Button className={mode === "guided" ? "active" : ""} onClick={() => setMode("guided")}>Guided</Button>
            <Button className={mode === "freehand" ? "active" : ""} onClick={() => setMode("freehand")}>Freehand</Button>
          </div>
          <label><input type="range" min="2" max="14" value={size} onChange={(event) => setSize(Number(event.target.value))} /><span>STROKE SIZE</span></label>
        </div>
      </section>
    </FeatureChrome>
  )
}

function ResultArtwork({
  feature,
  result,
  image,
}: {
  feature: Feature
  result: Results
  image: string
}) {
  if (feature === "blob" && result.blob) return <img className="result-overlay" src={result.blob} alt="" />
  if (feature === "cutout" && result.cutout) return <StampCutout image={image} crop={result.cutout} />
  if (feature === "note" && result.note) return <span className="result-note" style={{ width: `${result.note.width}%`, fontSize: `${result.note.fontSize * .8}px`, background: result.note.color }}>{result.note.text}</span>
  if (feature === "doodle" && result.doodle) return <img className="result-doodle" src={result.doodle} alt="" />
  return null
}

const featureLabels: Record<Feature, string> = {
  blob: "Color Blob",
  cutout: "Photo Cutout",
  note: "Handwritten Note",
  doodle: "Doodle",
}

function defaultComposition(completed: Feature[]): CompositionElement[] {
  const supporting = completed.filter((feature) => feature !== "blob")
  const hasBlob = completed.includes("blob")
  return completed.map((feature, index) => {
    if (feature === "blob") {
      return { feature, x: 0, y: 0, width: 100, height: 90, z: 1, visible: true, rotation: 0 }
    }
    const supportIndex = supporting.indexOf(feature)
    const width = 100 / Math.max(1, supporting.length)
    return {
      feature,
      x: supportIndex * width,
      y: hasBlob ? 90 : 0,
      width,
      height: hasBlob ? 10 : 100,
      z: index + 2,
      visible: true,
      rotation: 0,
    }
  })
}

function PostcardComposition({
  elements,
  results,
  image,
  selected,
  editable = false,
  onSelect,
  onChange,
}: {
  elements: CompositionElement[]
  results: Results
  image: string
  selected?: Feature
  editable?: boolean
  onSelect?: (feature: Feature) => void
  onChange?: (feature: Feature, changes: Partial<CompositionElement>) => void
}) {
  const interaction = useRef<{
    feature: Feature
    mode: "move" | "resize"
    startX: number
    startY: number
    element: CompositionElement
  } | null>(null)

  const begin = (
    event: ReactPointerEvent<HTMLElement>,
    element: CompositionElement,
    mode: "move" | "resize",
  ) => {
    if (!editable) return
    event.preventDefault()
    event.stopPropagation()
    interaction.current = {
      feature: element.feature,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      element: { ...element },
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    onSelect?.(element.feature)
  }

  const move = (event: ReactPointerEvent<HTMLElement>) => {
    const active = interaction.current
    const canvas = event.currentTarget.closest(".treemap-canvas")
    if (!active || !canvas) return
    const bounds = canvas.getBoundingClientRect()
    const dx = ((event.clientX - active.startX) / bounds.width) * 100
    const dy = ((event.clientY - active.startY) / bounds.height) * 100
    if (active.mode === "move") {
      onChange?.(active.feature, {
        x: Math.max(0, Math.min(100 - active.element.width, active.element.x + dx)),
        y: Math.max(0, Math.min(100 - active.element.height, active.element.y + dy)),
      })
      return
    }
    onChange?.(active.feature, {
      width: Math.max(8, Math.min(100 - active.element.x, active.element.width + dx)),
      height: Math.max(8, Math.min(100 - active.element.y, active.element.height + dy)),
    })
  }

  return (
    <div className={`treemap-canvas ${editable ? "editable" : ""}`}>
      {elements.filter((element) => element.visible).map((element) => (
        <article
          key={element.feature}
          className={`composition-region region-${element.feature} ${selected === element.feature ? "selected" : ""}`}
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            width: `${element.width}%`,
            height: `${element.height}%`,
            zIndex: element.z,
            transform: `rotate(${element.rotation ?? 0}deg)`,
          }}
          onPointerDown={(event) => begin(event, element, "move")}
          onPointerMove={move}
          onPointerUp={() => { interaction.current = null }}
          onPointerCancel={() => { interaction.current = null }}
          onClick={() => onSelect?.(element.feature)}
        >
          <ResultArtwork feature={element.feature} result={results} image={image} />
          {editable && (
            <>
              <span className="region-label">{featureLabels[element.feature]}</span>
              <button
                className="region-resize"
                aria-label={`Resize ${featureLabels[element.feature]}`}
                onPointerDown={(event) => begin(event, element, "resize")}
              />
            </>
          )}
        </article>
      ))}
    </div>
  )
}

function FinalScreen({
  image,
  results,
  onRestart,
  onEdit,
}: {
  image: string
  results: Results
  onRestart: () => void
  onEdit: () => void
}) {
  const completed = (Object.keys(results) as Feature[]).filter((feature) => results[feature])
  const [stage, setStage] = useState<"choose" | "separate" | "edit" | "sign" | "finished">("choose")
  const [elements, setElements] = useState(() => defaultComposition(completed))
  const [selected, setSelected] = useState<Feature>(completed[0] ?? "blob")
  const [name, setName] = useState("")
  const [postcardRotation, setPostcardRotation] = useState(0)
  const [actionState, setActionState] = useState<"idle" | "downloaded" | "shared">("idle")

  const updateElement = (feature: Feature, changes: Partial<CompositionElement>) => {
    setElements((current) => current.map((element) => (
      element.feature === feature ? { ...element, ...changes } : element
    )))
  }
  const selectedElement = elements.find((element) => element.feature === selected)
  const ordered = [...elements].sort((a, b) => a.z - b.z)

  const createPostcardBlob = async () => {
    const canvas = document.createElement("canvas")
    canvas.width = 1800
    canvas.height = 1240
    const context = canvas.getContext("2d")
    if (!context) return null
    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, canvas.width, canvas.height)
    const inset = 54
    const artWidth = canvas.width - inset * 2
    const artHeight = canvas.height - 170
    context.fillStyle = "#f7f4e9"
    context.fillRect(inset, inset, artWidth, artHeight)

    const loadImage = (source: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const artwork = new Image()
      artwork.onload = () => resolve(artwork)
      artwork.onerror = reject
      artwork.src = source
    })

    for (const element of ordered.filter((item) => item.visible)) {
      const x = inset + (element.x / 100) * artWidth
      const y = inset + (element.y / 100) * artHeight
      const width = (element.width / 100) * artWidth
      const height = (element.height / 100) * artHeight
      const rotation = element.rotation ?? 0
      context.save()
      if (rotation !== 0) {
        const cx = x + width / 2
        const cy = y + height / 2
        const rad = (rotation * Math.PI) / 180
        context.translate(cx, cy)
        context.rotate(rad)
        context.translate(-cx, -cy)
      } else {
        context.beginPath()
        context.rect(x, y, width, height)
        context.clip()
      }
      context.fillStyle = "#f7f4e9"
      context.fillRect(x, y, width, height)
      try {
        if (element.feature === "note" && results.note) {
          context.fillStyle = results.note.color
          context.fillRect(x, y, width, height)
          context.fillStyle = "#30453d"
          context.font = `700 ${Math.max(24, Math.min(62, width / 8))}px "Figma Hand:Bold", cursive`
          context.textAlign = "center"
          context.textBaseline = "middle"
          context.fillText(results.note.text, x + width / 2, y + height / 2, width * .86)
        } else {
          const source = element.feature === "blob"
            ? results.blob
            : element.feature === "doodle"
              ? results.doodle
              : image
          if (source) {
            const artwork = await loadImage(source)
            const scale = Math.max(width / artwork.naturalWidth, height / artwork.naturalHeight)
            const drawnWidth = artwork.naturalWidth * scale
            const drawnHeight = artwork.naturalHeight * scale
            context.drawImage(artwork, x + (width - drawnWidth) / 2, y + (height - drawnHeight) / 2, drawnWidth, drawnHeight)
          }
        }
      } catch {
        context.fillStyle = "#e9e9df"
        context.fillRect(x, y, width, height)
      }
      context.restore()
    }
    context.strokeStyle = "#292b27"
    context.lineWidth = 3
    context.strokeRect(inset, inset, artWidth, artHeight)
    context.fillStyle = "#30453d"
    context.font = '700 42px "Figma Hand:Bold", cursive'
    context.textAlign = "left"
    context.fillText(name.trim(), inset, canvas.height - 54)
    context.fillStyle = "#77796f"
    context.font = '500 18px "Inter:Medium", sans-serif'
    context.textAlign = "right"
    context.fillText("ART—TRACE · A WALK REMADE", canvas.width - inset, canvas.height - 54)
    return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
  }

  const download = async () => {
    const blob = await createPostcardBlob()
    if (!blob) return
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "art-trace-postcard.png"
    link.click()
    URL.revokeObjectURL(link.href)
    setActionState("downloaded")
  }

  const share = async () => {
    const blob = await createPostcardBlob()
    if (!blob) return
    const file = new File([blob], "art-trace-postcard.png", { type: "image/png" })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: "My ArtTrace postcard", files: [file] })
      setActionState("shared")
    } else {
      await download()
    }
  }

  if (stage === "separate") {
    return (
      <main className="separate-screen">
        <header><Brand /><span>{completed.length} SEPARATE POSTCARDS</span></header>
        <section className="separate-heading">
          <p className="eyebrow">ONE FEATURE, ONE COMPOSITION</p>
          <h1>Choose a postcard to preview.</h1>
        </section>
        <article className="separate-preview">
          <PostcardComposition elements={elements} results={results} image={image} />
        </article>
        <nav className="separate-tabs" aria-label="Postcard previews">
          {completed.map((feature, index) => (
            <Button
              key={feature}
              className={selected === feature ? "active" : ""}
              onClick={() => {
                setSelected(feature)
                setElements(defaultComposition([feature]))
              }}
            >
              <i className={`feature-dot dot-${feature}`} />
              <span>{String(index + 1).padStart(2, "0")}</span>
              <b>{featureLabels[feature]}</b>
            </Button>
          ))}
        </nav>
        <div className="separate-actions">
          <Button onClick={() => setStage("choose")}>Back</Button>
          <Button className="active" onClick={() => setStage("sign")}>Finish selected postcard</Button>
        </div>
      </main>
    )
  }

  if (stage === "edit") {
    return (
      <main className="composer-screen">
        <header><Brand /><span>POSTCARD COMPOSER</span></header>
        <section className="composer-heading">
          <div><h1><strong>Personalize</strong> your <strong>Postcard...</strong></h1></div>
          <p>MOVE, RESIZE, ROTATE OR LAYER YOUR ARTWORKS. MAKE IT FEEL YOURS.</p>
        </section>
        <section className="composer-workspace">
          <PostcardComposition
            elements={elements}
            results={results}
            image={image}
            selected={selected}
            editable
            onSelect={setSelected}
            onChange={updateElement}
          />
          <aside className="composition-panel">
            <div className="region-tabs">
              {elements.map((element) => (
                <Button
                  key={element.feature}
                  className={selected === element.feature ? "active" : ""}
                  onClick={() => setSelected(element.feature)}
                >
                  <i className={`feature-dot dot-${element.feature}`} />
                  {featureLabels[element.feature]}
                  {!element.visible && <span>Removed</span>}
                </Button>
              ))}
            </div>
            {selectedElement && (
              <div className="region-controls">
                <header><span>EDIT REGION</span><b>{featureLabels[selectedElement.feature]}</b></header>
                <label>Width <span>{Math.round(selectedElement.width)}%</span><input type="range" min="8" max="100" value={selectedElement.width} onChange={(event) => updateElement(selected, { width: Number(event.target.value), x: Math.min(selectedElement.x, 100 - Number(event.target.value)) })} /></label>
                <label>Height <span>{Math.round(selectedElement.height)}%</span><input type="range" min="8" max="100" value={selectedElement.height} onChange={(event) => updateElement(selected, { height: Number(event.target.value), y: Math.min(selectedElement.y, 100 - Number(event.target.value)) })} /></label>
                <label>Rotation <span>{Math.round(selectedElement.rotation ?? 0)}°</span><input type="range" min="-45" max="45" value={selectedElement.rotation ?? 0} onChange={(event) => updateElement(selected, { rotation: Math.max(-45, Math.min(45, Number(event.target.value))) })} /></label>
                <div className="layer-actions">
                  <Button onClick={() => updateElement(selected, { z: Math.max(...elements.map((element) => element.z)) + 1 })}><Icon path="M12 3 4 9l8 6 8-6-8-6ZM4 15l8 6 8-6" />Bring forward</Button>
                  <Button onClick={() => updateElement(selected, { z: Math.min(...elements.map((element) => element.z)) - 1 })}><Icon path="m4 9 8 6 8-6-8-6-8 6Zm0 6 8 6 8-6" />Send backward</Button>
                </div>
                <Button className="visibility-action" onClick={() => updateElement(selected, { visible: !selectedElement.visible })}>
                  {selectedElement.visible ? "Remove from postcard" : "Restore to postcard"}
                </Button>
              </div>
            )}
            <Button className="reset-layout" onClick={() => setElements(defaultComposition(completed))}><Icon path="M5 5v5h5M5 10a8 8 0 1 1 2 7" />Reset treemap layout</Button>
          </aside>
        </section>
        <Button className="composer-back" onClick={() => setStage("choose")}><Icon path="M15 18l-6-6 6-6" /> Back</Button>
        <Button className="composer-continue" onClick={() => setStage("sign")}>Continue <Icon path="M5 12h14M14 7l5 5-5 5" /></Button>
      </main>
    )
  }

  if (stage === "sign") {
    return (
      <main className="sign-screen">
        <header><Brand /><span>FINAL TOUCH</span></header>
        <section className="sign-card">
          <p className="eyebrow">SIGN YOUR WORK</p>
          <h1>Add your name<br />to this postcard</h1>
          <label>
            <span>Your name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={32} placeholder="Write your name…" autoFocus />
          </label>
          <div className="signature-preview">{name || "Your name"}</div>
          <Button disabled={!name.trim()} onClick={() => setStage("finished")}>Done <Icon path="M5 12h14M14 7l5 5-5 5" /></Button>
        </section>
      </main>
    )
  }

  if (stage === "finished") {
    return (
      <main className="finished-screen">
        <header><Brand /><span>POSTCARD COMPLETE</span></header>
        <section className="finished-heading">
          <p className="eyebrow">READY TO KEEP</p>
          <h1>Your walk,<br /><em>made tangible.</em></h1>
        </section>
        <article className="print-postcard">
          <div className="postcard-rotator" style={{ transform: `rotateY(${postcardRotation}deg)` }}>
            <PostcardComposition elements={elements} results={results} image={image} />
          </div>
          <footer><b>{name}</b><span>ART—TRACE · A WALK REMADE</span></footer>
        </article>
        <label className="rotation-control">
          <span>ROTATE POSTCARD</span>
          <input type="range" min="0" max="360" value={postcardRotation} onChange={(event) => setPostcardRotation(Number(event.target.value))} />
          <b>{postcardRotation}°</b>
        </label>
        <section className="final-actions">
          <Button className="download-action" onClick={download}><Icon path="M12 3v12M7 10l5 5 5-5M5 20h14" />Download Postcard</Button>
          <Button onClick={share}><Icon path="M18 8a3 3 0 1 0-2.8-4M6 15a3 3 0 1 0 0 6M18 14a3 3 0 1 0 0 6M8.6 17.5l6.8-3M8.6 6.5l6.8 3" />Share</Button>
          <Button onClick={onEdit}><Icon path="M4 20h4L19 9l-4-4L4 16v4ZM13 7l4 4" />Edit Features</Button>
          <Button onClick={onRestart}>Start Another Postcard</Button>
        </section>
        {actionState !== "idle" && (
          <p className="action-confirmation" role="status">
            {actionState === "shared" ? "Your postcard was shared." : "Your postcard was downloaded."}
          </p>
        )}
      </main>
    )
  }

  return (
    <main className="final-screen">
      <header><Brand /><span>YOUR INTERPRETATIONS</span></header>
      <section className="final-heading">
        <h1><strong>Preview</strong> your <strong>Postcard...</strong></h1>
        <p>WRITE A SHORT MEMORY OR ANY FEELING YOU HAD DURING YOUR WALK TODAY.</p>
      </section>
      <section className={`postcard-results count-${completed.length}`}>
        {completed.map((feature, cardIndex) => (
          <article key={feature} className={`final-postcard card-${feature}`}>
            <div>
              <ResultArtwork feature={feature} result={results} image={image} />
            </div>
            <footer><span>{feature === "blob" ? "ColorBlob" : feature === "cutout" ? "Stamp" : feature === "note" ? "Note" : "Doodle"}</span><b>{String(cardIndex + 1).padStart(2, "0")}</b></footer>
          </article>
        ))}
      </section>
      <section className="composition-actions">
        <Button
          disabled={!completed.length}
          onClick={() => {
            const first = completed[0]
            if (!first) return
            setSelected(first)
            setElements(defaultComposition([first]))
            setStage("separate")
          }}
        >
          <b>Create {completed.length} Separate Postcard{completed.length === 1 ? "" : "s"}</b>
          <span>Preview each completed feature on its own</span>
        </Button>
        <Button className="active" disabled={!completed.length} onClick={() => setStage("edit")}>
          <b>Merge All into 1 Postcard</b><span>Open the editable treemap composer</span>
        </Button>
      </section>
      <Button className="preview-back" onClick={onRestart}><Icon path="M15 18l-6-6 6-6" /> Back</Button>
      <Button className="preview-next" disabled={!completed.length} onClick={() => setStage("edit")}>Next <Icon path="M5 12h14M14 7l5 5-5 5" /></Button>
    </main>
  )
}

// S0 STARTING SCREEN. The staged `STARTING SCREEN ANIMATION.svg` has only three
// <path> nodes and no element ids, so we classify them after inlining: the organic
// form sits inside the <g filter=...> group, the wordmark path begins at M126.65,
// and the tagline path begins at M85.076 (verified against the source SVG). We tag
// each so index.css can animate them, make the <svg> fluid, and tint strokes from
// --ink via currentColor without editing the staged file.
function buildStartMarkup(raw: string): string {
  return raw
    // Make the inlined SVG scale to the stage and inherit ink for night tinting.
    .replace(
      /<svg\b([^>]*)\bwidth="1280"\s+height="832"/,
      '<svg$1width="100%" height="100%" preserveAspectRatio="xMidYMid meet"',
    )
    // Organic form: the only group carrying the fractal-noise filter.
    .replace(
      /<g filter="url\(#filter0_n_116_3839\)">/,
      '<g class="at-start-organic" filter="url(#filter0_n_116_3839)">',
    )
    // Wordmark "arttrace." outlined path. The organic group already closed on the
    // preceding line, so we only open the wordmark group here.
    .replace(
      /<path d="M126\.65 400\.3/,
      '<g class="at-start-wordmark"><path d="M126.65 400.3',
    )
    // Tagline outlined path. Close the wordmark group, open the tagline group,
    // then close the tagline group before the clip group closes.
    .replace(
      /<path d="M85\.076 488\.604/,
      '</g><g class="at-start-tagline"><path d="M85.076 488.604',
    )
    // The tagline path is the last child inside clip0; close its wrapper group.
    .replace(
      /(fill="white"\/>)(\s*<\/g>\s*<defs>)/,
      '$1</g>$2',
    )
}

const START_MARKUP = buildStartMarkup(startingScreenMarkup)
// Keyframe duration (ms) for the start animation; the auto-advance timeout matches
// the longest CSS @keyframes run in index.css (organic 2.6s + tagline reveal).
const START_ANIMATION_MS = 4200

function StartAnimationScreen({ onDone }: { onDone: () => void }) {
  const doneRef = useRef(false)
  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    onDone()
  }

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
    // Honor reduced motion: show the final frame briefly, then advance. With full
    // motion, auto-advance when the keyframes finish (timeout matches the CSS).
    const delay = prefersReduced ? 1800 : START_ANIMATION_MS
    const timer = window.setTimeout(finish, delay)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " " || event.key === "Escape") {
        event.preventDefault()
        finish()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener("keydown", onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="start-screen" aria-label="ArtTrace intro">
      <div
        className="at-start-art"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: START_MARKUP }}
      />
      <button
        type="button"
        className="at-start-skip"
        aria-label="Skip intro and start creating"
        onClick={finish}
      />
    </main>
  )
}

class App extends Component<
  Record<string, never>,
  { screen: Screen; image: string; step: number; results: Results; theme: Theme }
> {
  state = {
    screen: "start" as Screen,
    image: campusArt[0],
    step: 0,
    results: {} as Results,
    theme: "day" as Theme,
  }

  componentDidMount() {
    const stored = window.localStorage.getItem("arttrace-theme")
    if (stored === "day" || stored === "night") {
      this.setState({ theme: stored })
    }
  }

  toggleTheme = () => {
    this.setState((state) => {
      const theme = state.theme === "day" ? "night" : "day"
      window.localStorage.setItem("arttrace-theme", theme)
      return { theme }
    })
  }

  advance = (feature: Feature, value?: string | CutoutResult | NoteResult) => {
    this.setState((state) => ({
      results: value ? { ...state.results, [feature]: value } : state.results,
      step: Math.min(3, state.step + 1),
      screen: state.step === 3 ? "final" : "making",
    }))
  }

  skip = () => {
    this.setState((state) => ({
      step: Math.min(3, state.step + 1),
      screen: state.step === 3 ? "final" : "making",
    }))
  }

  render() {
    const { screen, image, step, results, theme } = this.state
    let content: ReactNode
    if (screen === "start") {
      content = <StartAnimationScreen onDone={() => this.setState({ screen: "upload" })} />
    } else if (screen === "upload") {
      content = <UploadScreen onSelect={(selected) => this.setState({ image: selected, screen: "making", step: 0, results: {} })} />
    } else if (screen === "final") {
      content = (
        <FinalScreen
          image={image}
          results={results}
          onEdit={() => this.setState({ screen: "making", step: 0 })}
          onRestart={() => this.setState({ screen: "upload", step: 0, results: {} })}
        />
      )
    } else if (step === 0) {
      content = <BlobFeature image={image} initialBlob={results.blob} onNext={(value) => this.advance("blob", value)} onSkip={this.skip} onBack={() => this.setState({ screen: "upload" })} />
    } else if (step === 1) {
      content = <CutoutFeature image={image} initialCutout={results.cutout} onNext={(value) => this.advance("cutout", value)} onSkip={this.skip} onBack={() => this.setState({ step: 0 })} />
    } else if (step === 2) {
      content = <DoodleFeature initialDoodle={results.doodle} onNext={(value) => this.advance("doodle", value)} onSkip={this.skip} onBack={() => this.setState({ step: 1 })} />
    } else {
      content = <NoteFeature initialNote={results.note} onNext={(value) => this.advance("note", value)} onSkip={this.skip} onBack={() => this.setState({ step: 2 })} />
    }
    return (
      <div className="app-root" data-theme={theme}>
        {/*
          FEAT-003 / design-review NIT-2: the Photo-Cutout stamp mask uses the
          single rounded-rect clip from 6.svg (298-983 x 275-708, radius 15 on
          the 715x433 inner panel), NOT the 23 cosmetic scallop stroke paths.
          6.svg frays that rounded rect's edge with a fractalNoise filter; we
          reproduce only the edge treatment here so the live, resizable crop
          frame drives the mask size (the rounded-rect geometry lives in CSS as
          clip-path/border-radius). Rendered once at the root; referenced from
          index.css via filter: url(#at-stamp-fray).
        */}
        <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
          <filter id="at-stamp-fray" x="-6%" y="-6%" width="112%" height="112%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.014" numOctaves={2} seed={7} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={9} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        <HeaderPill theme={theme} onToggle={this.toggleTheme} />
        <div className="screen-transition" key={`${screen}-${step}`}>
          {content}
        </div>
      </div>
    )
  }
}

export default App
