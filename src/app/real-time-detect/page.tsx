"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  VideoOff,
  Upload,
  Camera,
  Play,
  Square,
  Settings2,
  Activity,
  Wifi,
  WifiOff,
} from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export default function RealTimeDetectPage() {
  // Stream state
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)
  const [streamUrl, setStreamUrl] = useState<string>("")

  // Stream settings
  const [streamType, setStreamType] = useState<"yolo" | "unet" | "combined">("yolo")
  const [confidence, setConfidence] = useState(0.25)
  const [alpha, setAlpha] = useState(0.4)
  const [source, setSource] = useState("0")

  // Tab state
  const [activeTab, setActiveTab] = useState<"stream" | "upload">("stream")

  // Get MJPEG stream URL
  const getMjpegUrl = () => {
    const params = new URLSearchParams()
    params.set('source', source)

    if (streamType === 'yolo' || streamType === 'combined') {
      params.set('conf', confidence.toString())
    }
    if (streamType === 'unet' || streamType === 'combined') {
      params.set('alpha', alpha.toString())
    }

    const endpoint = streamType === 'yolo' ? 'detect' :
      streamType === 'unet' ? 'segment' : 'combined'

    return `${API_BASE_URL}/api/stream/${endpoint}?${params.toString()}`
  }

  // Start streaming
  const startStream = () => {
    setStreamError(null)
    setIsLoading(true)
    const url = getMjpegUrl()
    setStreamUrl(url)
    console.log('Starting MJPEG stream:', url)
    setIsStreaming(true)
  }

  // Stop streaming
  const stopStream = () => {
    setIsStreaming(false)
    setIsLoading(false)
    setStreamError(null)
    setStreamUrl("")
  }

  // Handle image load success
  const handleImageLoad = () => {
    console.log('MJPEG stream loaded successfully')
    setIsLoading(false)
    setStreamError(null)
  }

  // Handle image load error
  const handleImageError = () => {
    console.error('Failed to load MJPEG stream from:', streamUrl)
    setStreamError('Failed to connect to stream. Please check if the Flask server is running.')
    setIsLoading(false)
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Real-time Detection</h1>
          <p className="text-muted-foreground">
            Stream video for YOLO detection or U-Net segmentation using MJPEG
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <Badge variant="default" className="gap-1">
              <Wifi className="h-3 w-3" />
              Streaming
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <WifiOff className="h-3 w-3" />
              Idle
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Video Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stream" className="gap-2">
                <Camera className="h-4 w-4" />
                Live Stream
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Video
              </TabsTrigger>
            </TabsList>

            {/* Stream Tab */}
            <TabsContent value="stream" className="space-y-4">
              <Card>
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    {isStreaming ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={streamUrl}
                          alt="MJPEG Stream"
                          className="w-full h-full object-contain"
                          onLoad={handleImageLoad}
                          onError={handleImageError}
                        />
                        {isLoading && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/80">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-2"></div>
                            <span>Connecting to stream...</span>
                            <span className="text-xs text-gray-400 mt-2">Opening webcam</span>
                          </div>
                        )}
                        {streamError && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/90 p-4">
                            <VideoOff className="h-12 w-12 mb-2 text-red-500" />
                            <span className="text-center mb-2">{streamError}</span>
                            <Button onClick={stopStream} variant="secondary" size="sm">
                              Close
                            </Button>
                          </div>
                        )}
                        {!isLoading && !streamError && (
                          <div className="absolute top-2 left-2 flex gap-2">
                            <Badge variant="secondary" className="bg-black/50 text-white">
                              MJPEG
                            </Badge>
                            <Badge variant="secondary" className="bg-black/50 text-white">
                              {streamType.toUpperCase()}
                            </Badge>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/80">
                        <Camera className="h-12 w-12 mb-2" />
                        <span>Click Start to begin streaming</span>
                        <span className="text-sm text-gray-400 mt-1">Low latency MJPEG stream</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stream URL Display (for debugging) */}
              {streamUrl && (
                <Card className="bg-muted">
                  <CardContent className="p-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Stream URL</Label>
                      <code className="text-xs block break-all bg-background p-2 rounded">
                        {streamUrl}
                      </code>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2">
                {!isStreaming ? (
                  <Button
                    onClick={startStream}
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

            {/* Upload Tab */}
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Settings Panel */}
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
              <div className="space-y-2">
                <Label>Video Source</Label>
                <Input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="0 for webcam, or video path"
                  disabled={isStreaming}
                />
                <p className="text-xs text-muted-foreground">
                  Use 0, 1, 2 for cameras or path to video file
                </p>
              </div>

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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Stream Information
              </CardTitle>
              <CardDescription>
                {isStreaming ? "Currently streaming" : "Configure settings and start stream"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isStreaming ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Protocol</span>
                    <span className="font-medium">MJPEG</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Model</span>
                    <span className="font-medium capitalize">{streamType}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Source</span>
                    <span className="font-medium">{source === "0" ? "Webcam" : source}</span>
                  </div>
                </div>
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