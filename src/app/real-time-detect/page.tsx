"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { io, Socket } from "socket.io-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Video,
  VideoOff,
  Camera,
  Play,
  Square,
  Settings2,
  Activity,
  Wifi,
  WifiOff,
  FlipHorizontal
} from "lucide-react"

// Types
interface Detection {
  class: string
  class_id: number
  confidence: number
  bbox_normalized: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
}

interface YoloResult {
  detection_count: number
  detections: Detection[]
  frame_size: { width: number; height: number }
}

interface UnetResult {
  class_percentages: Record<string, {
    percentage: number
    pixel_count: number
    class_id: number
    color: number[]
  }>
  dominant_class: string | null
  dominant_percentage: number
  mask?: string
  mask_shape?: number[]
}

interface DetectionResult {
  frame_id: number
  type: string
  timestamp: string
  result: YoloResult | UnetResult | { yolo: YoloResult; unet: UnetResult }
}

const SOCKET_URL = "https://api.microfilaria.click"  // No path suffix!
const SOCKET_PATH = "/microphilaria_model_api/socket.io"
// const SOCKET_URL = "http://localhost:5001"  // No path suffix!
// const SOCKET_PATH = "/socket.io"
// Detection colors (RGB)
const CLASS_COLORS: Record<string, string> = {
  'Background': 'rgba(0, 0, 0, 0.5)',
  'WB Wuschereria Bancrofti': 'rgba(0, 255, 0, 0.7)',
  'BM Brugia Malayi': 'rgba(255, 0, 0, 0.7)',
  'BT Brugia Timori': 'rgba(255, 255, 0, 0.7)',
  'BP Brugia Pahangi': 'rgba(0, 0, 255, 0.7)'
}

export default function RealTimeDetectPage() {
  // Connection state
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)

  // Settings
  const [processType, setProcessType] = useState<"yolo" | "unet" | "combined">("yolo")
  const [confidence, setConfidence] = useState(0.25)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")

  // Results
  const [latestResult, setLatestResult] = useState<DetectionResult | null>(null)
  const [fps, setFps] = useState(0)
  const [processingTime, setProcessingTime] = useState(0)

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameIdRef = useRef(0)
  const lastFrameTimeRef = useRef(0)
  const frameTimesRef = useRef<number[]>([])
  const processingRef = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize socket connection
  useEffect(() => {
    console.log("🔌 Connecting to:", SOCKET_URL)

    const newSocket = io(SOCKET_URL, {
      path: SOCKET_PATH,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    newSocket.on("connect", () => {
      console.log("✅ Connected:", newSocket.id)
      setIsConnected(true)
    })

    newSocket.on("disconnect", () => {
      console.log("❌ Disconnected")
      setIsConnected(false)
      stopStreaming()
    })

    newSocket.on("connected", (data) => {
      console.log("Server info:", data)
    })

    newSocket.on("detection_result", (data: DetectionResult) => {
      const now = Date.now()
      
      // Calculate processing time
      setProcessingTime(now - lastFrameTimeRef.current)
      
      // Calculate FPS
      frameTimesRef.current.push(now)
      if (frameTimesRef.current.length > 10) {
        frameTimesRef.current.shift()
      }
      if (frameTimesRef.current.length > 1) {
        const timeSpan = frameTimesRef.current[frameTimesRef.current.length - 1] - frameTimesRef.current[0]
        setFps(Math.round((frameTimesRef.current.length - 1) / (timeSpan / 1000)))
      }

      setLatestResult(data)
      drawOverlay(data)
      processingRef.current = false
    })

    newSocket.on("error", (error) => {
      console.error("Socket error:", error)
      processingRef.current = false
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  // Draw detection overlay on canvas
  const drawOverlay = useCallback((data: DetectionResult) => {
    const overlayCanvas = overlayCanvasRef.current
    const video = videoRef.current
    if (!overlayCanvas || !video) return

    const ctx = overlayCanvas.getContext("2d")
    if (!ctx) return

    // Match canvas size to video
    overlayCanvas.width = video.videoWidth
    overlayCanvas.height = video.videoHeight

    // Clear previous overlay
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)

    if (data.type === "yolo" || data.type === "combined") {
      const yoloResult = data.type === "yolo" 
        ? data.result as YoloResult 
        : (data.result as { yolo: YoloResult }).yolo

      // Draw bounding boxes
      yoloResult.detections.forEach((det) => {
        const { x1, y1, x2, y2 } = det.bbox_normalized
        const boxX = x1 * overlayCanvas.width
        const boxY = y1 * overlayCanvas.height
        const boxW = (x2 - x1) * overlayCanvas.width
        const boxH = (y2 - y1) * overlayCanvas.height

        // Draw box
        ctx.strokeStyle = CLASS_COLORS[det.class] || "rgba(0, 255, 0, 0.8)"
        ctx.lineWidth = 3
        ctx.strokeRect(boxX, boxY, boxW, boxH)

        // Draw label background
        const label = `${det.class} ${(det.confidence * 100).toFixed(1)}%`
        ctx.font = "bold 14px Arial"
        const textWidth = ctx.measureText(label).width
        ctx.fillStyle = CLASS_COLORS[det.class] || "rgba(0, 255, 0, 0.8)"
        ctx.fillRect(boxX, boxY - 22, textWidth + 10, 22)

        // Draw label text
        ctx.fillStyle = "white"
        ctx.fillText(label, boxX + 5, boxY - 6)
      })
    }

    if (data.type === "unet" || data.type === "combined") {
      const unetResult = data.type === "unet"
        ? data.result as UnetResult
        : (data.result as { unet: UnetResult }).unet

      // If mask is provided, draw segmentation overlay
      if (unetResult.mask && unetResult.mask_shape) {
        try {
          const maskBytes = Uint8Array.from(atob(unetResult.mask), c => c.charCodeAt(0))
          const [maskH, maskW] = unetResult.mask_shape

          // Create temporary canvas for mask
          const maskCanvas = document.createElement("canvas")
          maskCanvas.width = maskW
          maskCanvas.height = maskH
          const maskCtx = maskCanvas.getContext("2d")
          if (maskCtx) {
            const imageData = maskCtx.createImageData(maskW, maskH)
            
            for (let i = 0; i < maskBytes.length; i++) {
              const classId = maskBytes[i]
              const colors: Record<number, number[]> = {
                0: [0, 0, 0, 0],      // Background - transparent
                1: [0, 255, 0, 100],  // WB - Green
                2: [255, 0, 0, 100],  // BM - Red
                3: [255, 255, 0, 100], // BT - Yellow
                4: [0, 0, 255, 100]   // BP - Blue
              }
              const [r, g, b, a] = colors[classId] || [0, 0, 0, 0]
              imageData.data[i * 4] = r
              imageData.data[i * 4 + 1] = g
              imageData.data[i * 4 + 2] = b
              imageData.data[i * 4 + 3] = a
            }
            
            maskCtx.putImageData(imageData, 0, 0)
            
            // Draw scaled mask on overlay
            ctx.drawImage(maskCanvas, 0, 0, overlayCanvas.width, overlayCanvas.height)
          }
        } catch (e) {
          console.error("Failed to draw mask:", e)
        }
      }
    }
  }, [])

  // Capture and send frame
  const captureAndSendFrame = useCallback(() => {
    if (!socket || !isConnected || !videoRef.current || !canvasRef.current || processingRef.current) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx || video.readyState !== 4) return

    // Set canvas size to video size (or smaller for bandwidth)
    const maxWidth = 640
    const scale = Math.min(1, maxWidth / video.videoWidth)
    canvas.width = video.videoWidth * scale
    canvas.height = video.videoHeight * scale

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to JPEG blob
    canvas.toBlob((blob) => {
      if (!blob || !socket) return

      processingRef.current = true
      lastFrameTimeRef.current = Date.now()
      frameIdRef.current++

      // Convert blob to array buffer and send
      blob.arrayBuffer().then((buffer) => {
        socket.emit("process_frame", {
          frame: new Uint8Array(buffer),
          type: processType,
          conf: confidence,
          return_mask: processType === "unet" || processType === "combined",
          frame_id: frameIdRef.current
        })
      })
    }, "image/jpeg", 0.7)
  }, [socket, isConnected, processType, confidence])

  // Start camera and streaming
  const startStreaming = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setIsStreaming(true)

      // Start sending frames at 10 FPS
      intervalRef.current = setInterval(captureAndSendFrame, 100)

    } catch (error) {
      console.error("Failed to start camera:", error)
    }
  }, [facingMode, captureAndSendFrame])

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsStreaming(false)
    setLatestResult(null)
    setFps(0)
    frameTimesRef.current = []
    processingRef.current = false
  }, [])

  // Toggle camera
  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === "user" ? "environment" : "user")
    if (isStreaming) {
      stopStreaming()
      setTimeout(startStreaming, 100)
    }
  }, [isStreaming, stopStreaming, startStreaming])

  // Render metadata panel
  const renderMetadata = () => {
    if (!latestResult) return null

    if (processType === "yolo" || processType === "combined") {
      const yoloResult = processType === "yolo"
        ? latestResult.result as YoloResult
        : (latestResult.result as { yolo: YoloResult }).yolo

      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Detections</span>
            <Badge variant="secondary">{yoloResult.detection_count}</Badge>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {yoloResult.detections.map((det, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-md bg-muted p-2 text-sm"
                >
                  <span className="font-medium">{det.class}</span>
                  <Badge variant={det.confidence > 0.7 ? "default" : "outline"}>
                    {(det.confidence * 100).toFixed(1)}%
                  </Badge>
                </div>
              ))}
              {yoloResult.detections.length === 0 && (
                <p className="text-sm text-muted-foreground">No detections</p>
              )}
            </div>
          </ScrollArea>
        </div>
      )
    }

    if (processType === "unet") {
      const unetResult = latestResult.result as UnetResult
      return (
        <div className="space-y-3">
          {unetResult.dominant_class && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Dominant Class</span>
              <Badge>{unetResult.dominant_class}</Badge>
            </div>
          )}
          <Separator />
          <div className="space-y-2">
            <span className="text-sm font-medium">Class Distribution</span>
            {Object.entries(unetResult.class_percentages || {}).map(([cls, info]) => (
              <div key={cls} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="truncate">{cls}</span>
                  <span className="text-muted-foreground">{info.percentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${Math.min(info.percentage, 100)}%`,
                      backgroundColor: `rgb(${info.color.join(',')})`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    // <div className="container py-6 space-y-6">
    //   {/* Header */}
    //   <div className="flex items-center justify-between">
    //     <div>
    //       <h1 className="text-2xl font-semibold">Real-time Detection</h1>
    //       <p className="text-muted-foreground">
    //         Camera streaming with YOLO/U-Net processing
    //       </p>
    //     </div>
    //     <div className="flex items-center gap-2">
    //       {isConnected ? (
    //         <Badge variant="default" className="gap-1">
    //           <Wifi className="h-3 w-3" />
    //           Connected
    //         </Badge>
    //       ) : (
    //         <Badge variant="destructive" className="gap-1">
    //           <WifiOff className="h-3 w-3" />
    //           Disconnected
    //         </Badge>
    //       )}
    //     </div>
    //   </div>

    //   {/* Main Content */}
    //   <div className="grid gap-6 lg:grid-cols-3">
    //     {/* Video Panel */}
    //     <div className="lg:col-span-2 space-y-4">
    //       <Card>
    //         <CardContent className="p-0">
    //           <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
    //             {/* Live video feed */}
    //             <video
    //               ref={videoRef}
    //               className="w-full h-full object-contain"
    //               playsInline
    //               muted
    //             />
                
    //             {/* Detection overlay canvas */}
    //             <canvas
    //               ref={overlayCanvasRef}
    //               className="absolute inset-0 w-full h-full object-contain pointer-events-none"
    //             />

    //             {/* Hidden canvas for frame capture */}
    //             <canvas ref={canvasRef} className="hidden" />

    //             {/* Overlay stats */}
    //             {isStreaming && (
    //               <div className="absolute top-2 left-2 flex gap-2">
    //                 <Badge variant="secondary" className="bg-black/50 text-white">
    //                   {fps} FPS
    //                 </Badge>
    //                 <Badge variant="secondary" className="bg-black/50 text-white">
    //                   {processingTime}ms
    //                 </Badge>
    //               </div>
    //             )}

    //             {/* Camera flip button */}
    //             {isStreaming && (
    //               <Button
    //                 variant="secondary"
    //                 size="icon"
    //                 className="absolute top-2 right-2 bg-black/50"
    //                 onClick={toggleCamera}
    //               >
    //                 <FlipHorizontal className="h-4 w-4" />
    //               </Button>
    //             )}

    //             {/* Placeholder when not streaming */}
    //             {!isStreaming && (
    //               <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
    //                 <Camera className="h-12 w-12 mb-2 opacity-50" />
    //                 <span>Click Start to begin</span>
    //               </div>
    //             )}
    //           </div>
    //         </CardContent>
    //       </Card>

    //       {/* Controls */}
    //       <div className="flex gap-2">
    //         {!isStreaming ? (
    //           <Button
    //             onClick={startStreaming}
    //             disabled={!isConnected}
    //             className="flex-1 gap-2"
    //           >
    //             <Play className="h-4 w-4" />
    //             Start Camera
    //           </Button>
    //         ) : (
    //           <Button
    //             onClick={stopStreaming}
    //             variant="destructive"
    //             className="flex-1 gap-2"
    //           >
    //             <Square className="h-4 w-4" />
    //             Stop Camera
    //           </Button>
    //         )}
    //       </div>
    //     </div>

    //     {/* Settings & Results Panel */}
    //     <div className="space-y-4">
    //       {/* Settings */}
    //       <Card>
    //         <CardHeader className="pb-3">
    //           <CardTitle className="text-base flex items-center gap-2">
    //             <Settings2 className="h-4 w-4" />
    //             Settings
    //           </CardTitle>
    //         </CardHeader>
    //         <CardContent className="space-y-4">
    //           <div className="space-y-2">
    //             <Label>Model</Label>
    //             <Select
    //               value={processType}
    //               onValueChange={(v) => setProcessType(v as typeof processType)}
    //               disabled={isStreaming}
    //             >
    //               <SelectTrigger>
    //                 <SelectValue />
    //               </SelectTrigger>
    //               <SelectContent>
    //                 <SelectItem value="yolo">YOLO Detection</SelectItem>
    //                 <SelectItem value="unet">U-Net Segmentation</SelectItem>
    //                 <SelectItem value="combined">Combined</SelectItem>
    //               </SelectContent>
    //             </Select>
    //           </div>

    //           {(processType === "yolo" || processType === "combined") && (
    //             <div className="space-y-2">
    //               <div className="flex justify-between">
    //                 <Label>Confidence</Label>
    //                 <span className="text-sm text-muted-foreground">{confidence.toFixed(2)}</span>
    //               </div>
    //               <Slider
    //                 value={[confidence]}
    //                 onValueChange={([v]) => setConfidence(v)}
    //                 min={0.1}
    //                 max={0.9}
    //                 step={0.05}
    //               />
    //             </div>
    //           )}
    //         </CardContent>
    //       </Card>

    //       {/* Results */}
    //       <Card>
    //         <CardHeader className="pb-3">
    //           <CardTitle className="text-base flex items-center gap-2">
    //             <Activity className="h-4 w-4" />
    //             Results
    //           </CardTitle>
    //           <CardDescription>
    //             {isStreaming ? "Live detection" : "Start camera to see results"}
    //           </CardDescription>
    //         </CardHeader>
    //         <CardContent>
    //           {isStreaming && latestResult ? (
    //             renderMetadata()
    //           ) : (
    //             <div className="py-8 text-center text-muted-foreground">
    //               <VideoOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
    //               <p className="text-sm">No active stream</p>
    //             </div>
    //           )}
    //         </CardContent>
    //       </Card>
    //     </div>
    //   </div>
    // </div>
    <div>
        The real-time detection is under development. Please check back later.
    </div>
  )
}