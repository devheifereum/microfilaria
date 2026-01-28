'use client'

import { useEffect, useState } from 'react'
import { Upload, Target, AlertCircle, Activity, Microscope, Sun, Moon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DotPattern } from '@/components/ui/dot-pattern'

interface Detection {
  id: number
  class: string
  confidence: number
  bbox: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
}

interface DetectionResponse {
  success: boolean
  timestamp: string
  image_info: {
    width: number
    height: number
    filename: string
  }
  detection_stats: {
    total_count: number
    average_confidence: number
    confidence_threshold: number
  }
  detections: Detection[]
  annotated_image: string
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<DetectionResponse | null>(null)
  const [error, setError] = useState<string>('')
  const [confidence, setConfidence] = useState(0.25)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Initialize dark mode from system preference
  useEffect(() => {
    if (typeof window === 'undefined') return
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    setIsDarkMode(prefersDark)
  }, [])

  // Sync dark mode with the <html> class so shadcn/ui (including the navbar) respects it
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (isDarkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDarkMode])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setResults(null)
      setError('')
    }
  }

  const handleDetect = async () => {
    if (!selectedFile) {
      setError('Please select an image first')
      return
    }

    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('image', selectedFile)
    formData.append('confidence', confidence.toString())

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/detect`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setResults(data)
      } else {
        setError(data.error || 'Detection failed')
      }
    } catch (err) {
      setError('Failed to connect to API. Make sure Flask server is running on port 1000')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      {/* Dot Pattern Background */}
      <DotPattern
        width={8}
        height={8}
        cr={0.8}
        className={`opacity-40 ${isDarkMode ? 'text-white' : 'text-black'}`}
        glow={true}
      />

      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-3 rounded-xl transition-all duration-300 ${isDarkMode
            ? 'bg-white text-black hover:bg-gray-100'
            : 'bg-black text-white hover:bg-gray-800'
            } shadow-lg hover:shadow-xl`}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className={`border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
          <div className="max-w-7xl mx-auto px-8 py-12">
            <div className="flex items-center gap-4 mb-3">
              <div className="relative">
                <div className={`w-14 h-14 ${isDarkMode ? 'bg-white' : 'bg-black'} rounded-xl flex items-center justify-center`}>
                  <Microscope className={`w-8 h-8 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                </div>
                <div className={`absolute -top-1 -right-1 w-4 h-4 ${isDarkMode ? 'bg-white' : 'bg-black'} rounded-full animate-pulse`}></div>
              </div>
              <div>
                <h1 className={`text-4xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-black'} mb-1`}>
                  Microfiliaria Detection System
                </h1>
                <p className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-sm tracking-wide`}>
                  Advanced YOLOv8m Neural Network • Automated Blood Smear Analysis
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Panel - Upload & Controls */}
            <div className="h-full">
              <Card className={`${isDarkMode ? 'bg-black border-white/20' : 'bg-white border-black/20'} shadow-2xl h-full flex flex-col`}>
                <CardHeader className={`border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                  <CardTitle className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Upload Sample</CardTitle>
                  <CardDescription className={isDarkMode ? 'text-white/60' : 'text-black/60'}>Select a blood smear image for analysis</CardDescription>
                </CardHeader>
                <CardContent className="pt-8 space-y-8 flex-1 flex flex-col">
                  {/* File Input */}
                  <label className="block cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className={`relative border-2 border-dashed ${isDarkMode ? 'border-white/30' : 'border-black/30'} rounded-2xl p-16 text-center transition-all duration-300 group-hover:${isDarkMode ? 'border-white' : 'border-black'} group-hover:${isDarkMode ? 'bg-white/5' : 'bg-black/5'} group-hover:scale-[1.02]`}>
                      <div className={`absolute top-4 right-4 w-2 h-2 ${isDarkMode ? 'bg-white' : 'bg-black'} rounded-full opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                      <Upload className={`w-16 h-16 mx-auto mb-6 ${isDarkMode ? 'text-white/40' : 'text-black/40'} group-hover:${isDarkMode ? 'text-white' : 'text-black'} transition-all duration-300 group-hover:scale-110`} />
                      <p className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-black'} mb-2`}>
                        {selectedFile ? selectedFile.name : 'Click to upload image'}
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                        JPG, PNG, JPEG • Maximum 10MB
                      </p>
                    </div>
                  </label>

                  {/* Preview */}
                  {previewUrl && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-1 h-5 ${isDarkMode ? 'bg-white' : 'bg-black'} rounded-full`}></div>
                        <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-black'} uppercase tracking-wider`}>Image Preview</h3>
                      </div>
                      <div className={`relative w-full aspect-video ${isDarkMode ? 'bg-white/5' : 'bg-black/5'} rounded-xl overflow-hidden border-2 ${isDarkMode ? 'border-white/20' : 'border-black/20'} shadow-lg`}>
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Confidence Slider */}
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-1 h-5 ${isDarkMode ? 'bg-white' : 'bg-black'} rounded-full`}></div>
                        <label className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-black'} uppercase tracking-wider`}>
                          Confidence Threshold
                        </label>
                      </div>
                      <span className={`text-lg font-mono font-bold ${isDarkMode ? 'text-white bg-white/10' : 'text-black bg-black/10'} px-3 py-1.5 rounded-lg border ${isDarkMode ? 'border-white/20' : 'border-black/20'}`}>
                        {confidence.toFixed(2)}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.05"
                        value={confidence}
                        onChange={(e) => setConfidence(parseFloat(e.target.value))}
                        className={`w-full h-3 ${isDarkMode ? 'bg-white/20' : 'bg-black/20'} rounded-full appearance-none cursor-pointer ${isDarkMode ? 'accent-white' : 'accent-black'}`}
                      />
                      <div className={`absolute -bottom-6 left-0 right-0 flex justify-between text-xs ${isDarkMode ? 'text-white/60' : 'text-black/60'} font-medium`}>
                        <span>0.1 LOW</span>
                        <span>0.5 MEDIUM</span>
                        <span>0.9 HIGH</span>
                      </div>
                    </div>
                  </div>

                  {/* Spacer */}
                  <div className="flex-1"></div>

                  {/* Detect Button */}
                  <button
                    onClick={handleDetect}
                    disabled={!selectedFile || loading}
                    className={`w-full ${isDarkMode ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'} py-4 rounded-xl font-bold text-base disabled:${isDarkMode ? 'bg-white/30' : 'bg-black/30'} disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-2xl hover:scale-[1.02] group`}
                  >
                    {loading ? (
                      <>
                        <div className={`animate-spin h-5 w-5 border-2 ${isDarkMode ? 'border-black' : 'border-white'} border-t-transparent rounded-full`}></div>
                        <span>ANALYZING...</span>
                      </>
                    ) : (
                      <>
                        <Target className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        <span>RUN DETECTION</span>
                      </>
                    )}
                  </button>

                  {/* Error Message */}
                  {error && (
                    <Alert variant="destructive" className={`${isDarkMode ? 'border-red-400 bg-red-900/20' : 'border-red-300 bg-red-50'}`}>
                      <AlertCircle className="h-5 w-5" />
                      <AlertDescription className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-900'} font-medium`}>
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Results */}
            <div className="h-full">
              <Card className={`${isDarkMode ? 'bg-black border-white/20' : 'bg-white border-black/20'} shadow-2xl h-full flex flex-col`}>
                <CardHeader className={`border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                  <CardTitle className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Analysis Results</CardTitle>
                  <CardDescription className={isDarkMode ? 'text-white/60' : 'text-black/60'}>Detection summary and findings</CardDescription>
                </CardHeader>
                <CardContent className="pt-8 flex-1 flex flex-col">
                  {!results && (
                    <div className="flex flex-col items-center justify-center flex-1 text-center">
                      <div className="relative mb-6">
                        <div className={`w-20 h-20 ${isDarkMode ? 'bg-white/10' : 'bg-black/10'} rounded-2xl flex items-center justify-center`}>
                          <Target className={`w-10 h-10 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} />
                        </div>
                        <div className={`absolute -top-2 -right-2 w-6 h-6 ${isDarkMode ? 'bg-white/20' : 'bg-black/20'} rounded-full`}></div>
                      </div>
                      <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-black'} mb-2`}>Awaiting Analysis</p>
                      <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-black/60'} max-w-xs`}>Upload an image and run detection to view comprehensive results</p>
                    </div>
                  )}

                  {results && (
                    <div className="space-y-8 flex-1 flex flex-col">
                      {/* Statistics */}
                      <div className="grid grid-cols-2 gap-6">
                        <div className={`relative border-2 ${isDarkMode ? 'border-white' : 'border-black'} rounded-2xl p-6 ${isDarkMode ? 'bg-black' : 'bg-white'} overflow-hidden group hover:${isDarkMode ? 'bg-white' : 'bg-black'} transition-colors duration-300`}>
                          <div className={`absolute top-0 right-0 w-20 h-20 ${isDarkMode ? 'bg-white/10' : 'bg-black/10'} rounded-bl-full opacity-50 group-hover:${isDarkMode ? 'bg-black/10' : 'bg-white/10'}`}></div>
                          <p className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-black/60'} mb-2 uppercase tracking-wider font-bold group-hover:${isDarkMode ? 'text-black/60' : 'text-white/60'} transition-colors`}>Total Detections</p>
                          <p className={`text-5xl font-black ${isDarkMode ? 'text-white' : 'text-black'} group-hover:${isDarkMode ? 'text-black' : 'text-white'} transition-colors relative z-10`}>
                            {results.detection_stats.total_count}
                          </p>
                        </div>
                        <div className={`relative border-2 ${isDarkMode ? 'border-white' : 'border-black'} rounded-2xl p-6 ${isDarkMode ? 'bg-black' : 'bg-white'} overflow-hidden group hover:${isDarkMode ? 'bg-white' : 'bg-black'} transition-colors duration-300`}>
                          <div className={`absolute top-0 right-0 w-20 h-20 ${isDarkMode ? 'bg-white/10' : 'bg-black/10'} rounded-bl-full opacity-50 group-hover:${isDarkMode ? 'bg-black/10' : 'bg-white/10'}`}></div>
                          <p className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-black/60'} mb-2 uppercase tracking-wider font-bold group-hover:${isDarkMode ? 'text-black/60' : 'text-white/60'} transition-colors`}>Avg Confidence</p>
                          <p className={`text-5xl font-black ${isDarkMode ? 'text-white' : 'text-black'} group-hover:${isDarkMode ? 'text-black' : 'text-white'} transition-colors relative z-10`}>
                            {(results.detection_stats.average_confidence * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      {/* Annotated Image */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-1 h-5 ${isDarkMode ? 'bg-white' : 'bg-black'} rounded-full`}></div>
                          <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-black'} uppercase tracking-wider`}>Annotated Image</h3>
                        </div>
                        <div className={`relative w-full ${isDarkMode ? 'bg-white/5' : 'bg-black/5'} rounded-xl overflow-hidden border-2 ${isDarkMode ? 'border-white/20' : 'border-black/20'} shadow-lg`}>
                          <img
                            src={results.annotated_image}
                            alt="Detection Result"
                            className="w-full object-contain"
                          />
                        </div>
                      </div>

                      {/* Detection List */}
                      <div className="space-y-4 flex-1 flex flex-col">
                        <div className="flex items-center gap-2">
                          <div className={`w-1 h-5 ${isDarkMode ? 'bg-white' : 'bg-black'} rounded-full`}></div>
                          <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-black'} uppercase tracking-wider`}>
                            Detection Details ({results.detections.length})
                          </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                          {results.detections.map((detection) => (
                            <div
                              key={detection.id}
                              className={`border-2 ${isDarkMode ? 'border-white/20' : 'border-black/20'} rounded-xl p-4 ${isDarkMode ? 'bg-black' : 'bg-white'} hover:${isDarkMode ? 'border-white' : 'border-black'} hover:shadow-lg transition-all duration-300 group`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-black'} group-hover:${isDarkMode ? 'text-white' : 'text-black'}`}>
                                  DETECTION #{detection.id}
                                </span>
                                <span className={`text-xs font-mono font-black ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'} px-3 py-1.5 rounded-lg`}>
                                  {(detection.confidence * 100).toFixed(1)}%
                                </span>
                              </div>
                              <p className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-black/60'} font-bold mb-2 uppercase tracking-wide`}>
                                Class: {detection.class}
                              </p>
                              <p className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-black/50'} font-mono ${isDarkMode ? 'bg-white/10' : 'bg-black/10'} px-2 py-1 rounded border ${isDarkMode ? 'border-white/20' : 'border-black/20'}`}>
                                [{detection.bbox.x1.toFixed(0)}, {detection.bbox.y1.toFixed(0)}, {detection.bbox.x2.toFixed(0)}, {detection.bbox.y2.toFixed(0)}]
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className={`mt-12 pt-8 border-t ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
            <p className={`text-center text-xs ${isDarkMode ? 'text-white/40' : 'text-black/40'} font-medium tracking-wider uppercase`}>
              Powered by YOLOv8m • Flask Backend • Next.js Frontend
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}