"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { io, Socket } from "socket.io-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Video, 
  VideoOff, 
  Upload, 
  Camera, 
  Play, 
  Square, 
  Settings2, 
  Activity,
  Loader2,
  Wifi,
  WifiOff,
  RefreshCw
} from "lucide-react"

// Types
interface Detection {
  class: string
  confidence: number
  bbox: number[]
}

interface YoloMetadata {
  detection_count: number
  detections: Detection[]
}

interface UnetMetadata {
  class_percentages: Record<string, number>
  dominant_class: string | null
  dominant_percentage: number
}

interface FrameData {
  image: string
  frame_number: number
  timestamp: number
  metadata: YoloMetadata | UnetMetadata | { yolo: YoloMetadata; unet: UnetMetadata }
}

interface StreamInfo {
  type: string
  source: string
  width: number
  height: number
  fps: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export default function RealTimeDetectPage() {
  // Connection state
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  
  // Stream settings
  const [streamType, setStreamType] = useState<"yolo" | "unet" | "combined">("yolo")
  const [confidence, setConfidence] = useState(0.25)
  const [alpha, setAlpha] = useState(0.4)
  const [source, setSource] = useState("0")
  
  // Frame data
  const [currentFrame, setCurrentFrame] = useState<string | null>(null)
  const [frameNumber, setFrameNumber] = useState(0)
  const [fps, setFps] = useState(0)
  const [metadata, setMetadata] = useState<FrameData["metadata"] | null>(null)
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null)
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"webcam" | "upload">("webcam")
  
  // FPS calculation
  const frameTimestamps = useRef<number[]>([])
  const lastFpsUpdate = useRef<number>(0)

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(API_URL, {
      transports: ["websocket"],
      autoConnect: true,
    })

    newSocket.on("connect", () => {
      console.log("Connected to server")
      setIsConnected(true)
    })

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server")
      setIsConnected(false)
      setIsStreaming(false)
    })

    newSocket.on("stream_started", (data: StreamInfo) => {
      console.log("Stream started:", data)
      setStreamInfo(data)
      setIsStreaming(true)
    })

    newSocket.on("stream_stopped", () => {
      console.log("Stream stopped")
      setIsStreaming(false)
      setStreamInfo(null)
    })

    newSocket.on("frame", (data: FrameData) => {
      setCurrentFrame(data.image)
      setFrameNumber(data.frame_number)
      setMetadata(data.metadata)
      
      // Calculate FPS
      const now = Date.now()
      frameTimestamps.current.push(now)
      
      // Keep only last 30 timestamps
      if (frameTimestamps.current.length > 30) {
        frameTimestamps.current.shift()
      }
      
      // Update FPS every 500ms
      if (now - lastFpsUpdate.current > 500 && frameTimestamps.current.length > 1) {
        const timeSpan = frameTimestamps.current[frameTimestamps.current.length - 1] - frameTimestamps.current[0]
        const calculatedFps = ((frameTimestamps.current.length - 1) / timeSpan) * 1000
        setFps(Math.round(calculatedFps))
        lastFpsUpdate.current = now
      }
    })

    newSocket.on("stream_error", (data: { error: string }) => {
      console.error("Stream error:", data.error)
      setIsStreaming(false)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  const startStream = useCallback(() => {
    if (!socket || !isConnected) return

    socket.emit("start_stream", {
      type: streamType,
      source: source,
      conf: confidence,
      alpha: alpha,
    })
  }, [socket, isConnected, streamType, source, confidence, alpha])

  const stopStream = useCallback(() => {
    if (!socket) return
    socket.emit("stop_stream")
    setIsStreaming(false)
    setCurrentFrame(null)
    setMetadata(null)
    setFrameNumber(0)
    setFps(0)
    frameTimestamps.current = []
  }, [socket])

  const reconnect = useCallback(() => {
    if (socket) {
      socket.disconnect()
      socket.connect()
    }
  }, [socket])

  // Render detection metadata
  const renderMetadata = () => {
    if (!metadata) return null

    if (streamType === "yolo") {
      const yoloMeta = metadata as YoloMetadata
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Detections</span>
            <Badge variant="secondary">{yoloMeta.detection_count}</Badge>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {yoloMeta.detections?.map((det, idx) => (
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
              {(!yoloMeta.detections || yoloMeta.detections.length === 0) && (
                <p className="text-sm text-muted-foreground">No detections</p>
              )}
            </div>
          </ScrollArea>
        </div>
      )
    }

    if (streamType === "unet") {
      const unetMeta = metadata as UnetMetadata
      return (
        <div className="space-y-3">
          {unetMeta.dominant_class && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Dominant Class</span>
              <Badge>{unetMeta.dominant_class}</Badge>
            </div>
          )}
          <Separator />
          <div className="space-y-2">
            <span className="text-sm font-medium">Class Distribution</span>
            {Object.entries(unetMeta.class_percentages || {}).map(([cls, pct]) => (
              <div key={cls} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="truncate">{cls}</span>
                  <span className="text-muted-foreground">{pct.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300" 
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (streamType === "combined") {
      const combinedMeta = metadata as { yolo: YoloMetadata; unet: UnetMetadata }
      return (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">YOLO Detections</h4>
            <Badge variant="secondary">{combinedMeta.yolo?.detection_count || 0} objects</Badge>
          </div>
          <Separator />
          <div>
            <h4 className="text-sm font-semibold mb-2">U-Net Segmentation</h4>
            {combinedMeta.unet?.dominant_class && (
              <Badge>{combinedMeta.unet.dominant_class}</Badge>
            )}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Real-time Detection</h1>
          <p className="text-muted-foreground">
            Stream video for YOLO detection or U-Net segmentation
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="default" className="gap-1">
              <Wifi className="h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <WifiOff className="h-3 w-3" />
              Disconnected
            </Badge>
          )}
          <Button variant="outline" size="icon" onClick={reconnect}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Video Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "webcam" | "upload")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="webcam" className="gap-2">
                <Camera className="h-4 w-4" />
                Webcam / Stream
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Video
              </TabsTrigger>
            </TabsList>

            <TabsContent value="webcam" className="space-y-4">
              {/* Video Display */}
              <Card>
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    {currentFrame ? (
                      <img 
                        src={currentFrame} 
                        alt="Video stream" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                        {isStreaming ? (
                          <>
                            <Loader2 className="h-12 w-12 animate-spin mb-2" />
                            <span>Waiting for frames...</span>
                          </>
                        ) : (
                          <>
                            <Video className="h-12 w-12 mb-2" />
                            <span>Click Start to begin streaming</span>
                          </>
                        )}
                      </div>
                    )}
                    
                    {/* Overlay Stats */}
                    {isStreaming && currentFrame && (
                      <div className="absolute top-2 left-2 flex gap-2">
                        <Badge variant="secondary" className="bg-black/50 text-white">
                          Frame: {frameNumber}
                        </Badge>
                        <Badge variant="secondary" className="bg-black/50 text-white">
                          {fps} FPS
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Controls */}
              <div className="flex gap-2">
                {!isStreaming ? (
                  <Button 
                    onClick={startStream} 
                    disabled={!isConnected}
                    className="flex-1 gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Start Stream
                  </Button>
                ) : (
                  <Button 
                    onClick={stopStream} 
                    variant="destructive"
                    className="flex-1 gap-2"
                  >
                    <Square className="h-4 w-4" />
                    Stop Stream
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="border-2 border-dashed rounded-lg p-12 text-center">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Upload Video File</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop an MP4 file or click to browse
                    </p>
                    <Input 
                      type="file" 
                      accept="video/mp4,video/avi,video/mov"
                      className="max-w-xs mx-auto"
                    />
                    <p className="text-xs text-muted-foreground mt-4">
                      Video upload processing coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Settings & Metadata Panel */}
        <div className="space-y-4">
          {/* Settings Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Stream Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Source Input */}
              <div className="space-y-2">
                <Label>Video Source</Label>
                <Input 
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="0 for webcam, or RTSP URL"
                  disabled={isStreaming}
                />
                <p className="text-xs text-muted-foreground">
                  Use 0, 1, 2 for cameras or paste RTSP URL
                </p>
              </div>

              {/* Model Type */}
              <div className="space-y-2">
                <Label>Detection Model</Label>
                <Select 
                  value={streamType} 
                  onValueChange={(v) => setStreamType(v as typeof streamType)}
                  disabled={isStreaming}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yolo">YOLO Detection</SelectItem>
                    <SelectItem value="unet">U-Net Segmentation</SelectItem>
                    <SelectItem value="combined">Combined (Side-by-Side)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Confidence Threshold (YOLO) */}
              {(streamType === "yolo" || streamType === "combined") && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Confidence Threshold</Label>
                    <span className="text-sm text-muted-foreground">{confidence.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[confidence]}
                    onValueChange={([v]) => setConfidence(v)}
                    min={0.1}
                    max={0.9}
                    step={0.05}
                    disabled={isStreaming}
                  />
                </div>
              )}

              {/* Alpha (U-Net) */}
              {(streamType === "unet" || streamType === "combined") && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Overlay Opacity</Label>
                    <span className="text-sm text-muted-foreground">{alpha.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[alpha]}
                    onValueChange={([v]) => setAlpha(v)}
                    min={0.1}
                    max={0.9}
                    step={0.05}
                    disabled={isStreaming}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stream Info */}
          {streamInfo && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Stream Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Resolution</span>
                  <span>{streamInfo.width} × {streamInfo.height}</span>
                  <span className="text-muted-foreground">Source FPS</span>
                  <span>{streamInfo.fps}</span>
                  <span className="text-muted-foreground">Model</span>
                  <span className="capitalize">{streamInfo.type}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detection Results */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Detection Results
              </CardTitle>
              <CardDescription>
                {isStreaming ? "Live detection data" : "Start streaming to see results"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isStreaming && metadata ? (
                renderMetadata()
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <VideoOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active stream</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}