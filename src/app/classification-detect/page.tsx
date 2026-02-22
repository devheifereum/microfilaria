'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Upload, Target, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DotPattern } from '@/components/ui/dot-pattern'
import { useTheme } from '@/components/ThemeProvider'

// 40x UNET / Categorize API response types (snake_case from API)
interface ClassStatistics {
  class_id: number
  avg_confidence: number
  max_confidence: number
  min_confidence: number
  percentage: number
  pixel_count: number
}

interface SegmentationResults {
  class_statistics: Record<string, ClassStatistics>
  dominant_class: string
  dominant_confidence: number
  dominant_percentage: number
  overall_confidence: number
}

interface CategorizeImageResponse {
  success: boolean
  timestamp: string
  image_info?: {
    width: number
    height: number
    filename: string
    format: string
  }
  class_legend?: Record<string, string>
  overlay_image: string  // data URI e.g. "data:image/jpeg;base64,..."
  overlay_path?: string
  segmentation_results: SegmentationResults
}

function legendColorFromName(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('blue')) return '#3b82f6'
  if (n.includes('red')) return '#ef4444'
  if (n.includes('yellow')) return '#eab308'
  if (n.includes('green')) return '#22c55e'
  if (n.includes('orange')) return '#f97316'
  return '#6b7280'
}

// Helper function to split class name into abbreviation and full name
function splitClassName(className: string): { abbreviation: string; fullName: string } {
  const parts = className.split(' ')
  if (parts.length >= 2) {
    const abbreviation = parts[0]
    const fullName = parts.slice(1).join(' ')
    return { abbreviation, fullName }
  }
  return { abbreviation: className, fullName: '' }
}

export default function ClassificationDetectPage() {
  const { isDarkMode } = useTheme()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CategorizeImageResponse | null>(null)
  const [error, setError] = useState<string>('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setResults(null)
      setError('')
    }
  }

  const handleCategorize = async () => {
    if (!selectedFile) {
      setError('Please select an image first')
      return
    }

    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('image', selectedFile)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categorize`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success && data.overlay_image) {
        setResults(data as CategorizeImageResponse)
      } else {
        setError(data.error || data.message || 'Segmentation failed')
      }
    } catch (err) {
      setError('Failed to connect to API. Make sure the server is running.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const seg = results?.segmentation_results
  const classStats = seg?.class_statistics ? Object.entries(seg.class_statistics) : []
  const classLegend = results?.class_legend ?? {}

  // Detected classes: not Background, avg_confidence > 0.9, percentage > 0.01
  const detectedClasses = classStats.filter(([className, stats]) => {
    if (className === 'Background') return false
    return (stats.avg_confidence ?? 0) > 0.9 && (stats.percentage ?? 0) > 0.01
  })

  return (
    <main className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      <DotPattern
        width={8}
        height={8}
        cr={0.8}
        className={`opacity-40 ${isDarkMode ? 'text-white' : 'text-black'}`}
        glow={true}
      />

      <div className="relative z-10">
        <div className={`border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
          <div className="max-w-7xl mx-auto px-8 py-12">
            <div className="flex items-center gap-4 mb-3">
              <div className="relative">
                <div className={`relative w-14 h-14 ${isDarkMode ? 'bg-white' : 'bg-black'} rounded-2xl flex items-center justify-center overflow-hidden`}>
                  <Image src="/favicon.ico" alt="Microfilaria" fill className="object-contain rounded-2xl" sizes="3.5rem" />
                </div>
                <div className={`absolute -top-1 -right-1 w-4 h-4 ${isDarkMode ? 'bg-white' : 'bg-black'} rounded-full animate-pulse`}></div>
              </div>
              <div>
                <h1 className={`text-4xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-black'} mb-1`}>
                  Microfilaria <span className="font-analyser font-semibold lowercase">analyser</span>
                </h1>
                <p className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-sm tracking-wide`}>
                  AI-Based Microfilaria Species Differentiation System • 40x Microscopy Image  
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Panel - Upload */}
            <div className="h-full">
              <Card className={`${isDarkMode ? 'bg-black border-white/20' : 'bg-white border-black/20'} shadow-2xl h-full flex flex-col`}>
                <CardHeader className={`border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                  <CardTitle className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Upload Image (40×)</CardTitle>
                  <CardDescription className={isDarkMode ? 'text-white/60' : 'text-black/60'}>
                    Select a blood smear image for segmentation
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-8 space-y-8 flex-1 flex flex-col">
                  <label className="block cursor-pointer group">
                    <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
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

                  {previewUrl && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-1 h-5 ${isDarkMode ? 'bg-white' : 'bg-black'} rounded-full`}></div>
                        <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-black'} uppercase tracking-wider`}>Image Preview</h3>
                      </div>
                      <div className={`relative w-full aspect-video ${isDarkMode ? 'bg-white/5' : 'bg-black/5'} rounded-xl overflow-hidden border-2 ${isDarkMode ? 'border-white/20' : 'border-black/20'} shadow-lg`}>
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                    </div>
                  )}

                  <div className="flex-1"></div>

                  <button
                    onClick={handleCategorize}
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
                        <span>RUN SEGMENTATION</span>
                      </>
                    )}
                  </button>

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
                  <CardTitle className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Segmentation Results</CardTitle>
                  <CardDescription className={isDarkMode ? 'text-white/60' : 'text-black/60'}>
                    Detected classes, overlay, and class statistics
                  </CardDescription>
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
                      <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-black/60'} max-w-xs`}>
                        Upload a 40× image and run segmentation to view results
                      </p>
                    </div>
                  )}

                  {results && (
                    <div className="space-y-8 flex-1 flex flex-col">
                      {/* Detected classes (avg_confidence > 0.9, percentage > 0.01, exclude Background) */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-1 h-5 ${isDarkMode ? 'bg-white' : 'bg-black'} rounded-full`}></div>
                          <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-black'} uppercase tracking-wider`}>
                            Detected classes ({detectedClasses.length})
                          </h3>
                        </div>
                        {detectedClasses.length === 0 ? (
                          <div className={`relative border-2 ${isDarkMode ? 'border-white/30' : 'border-black/30'} rounded-2xl p-6 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                            <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                              No species detected above threshold (avg confidence &gt; 90%, coverage &gt; 0.01%)
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {detectedClasses.map(([className, stats]) => {
                              const color = legendColorFromName(classLegend[className] ?? 'grey')
                              const { abbreviation, fullName } = splitClassName(className)
                              return (
                                <div
                                  key={className}
                                  className={`relative border-2 ${isDarkMode ? 'border-white' : 'border-black'} rounded-2xl p-6 ${isDarkMode ? 'bg-black' : 'bg-white'} overflow-hidden group hover:${isDarkMode ? 'bg-white/5' : 'bg-black/5'} transition-colors duration-300`}
                                >
                                  <div className={`absolute top-0 right-0 w-20 h-20 ${isDarkMode ? 'bg-white/10' : 'bg-black/10'} rounded-bl-full opacity-50`}></div>
                                  <div className="flex items-center gap-3 relative z-10">
                                    <div
                                      className="w-2 h-10 rounded-full shrink-0"
                                      style={{ backgroundColor: color }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-black'} break-words`}>
                                        {abbreviation}
                                        {fullName && <span className="italic"> {fullName}</span>}
                                      </p>
                                      <p className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-black/60'} mt-0.5`}>
                                        Avg confidence: {((stats.avg_confidence ?? 0) * 100).toFixed(1)}% • Pixels: {stats.pixel_count?.toLocaleString() ?? 0}
                                      </p>
                                    </div>
                                    <span
                                      className="text-sm font-mono font-bold px-3 py-1.5 rounded-lg shrink-0"
                                      style={{ backgroundColor: `${color}20`, color }}
                                    >
                                      {(stats.percentage ?? 0).toFixed(2)}%
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {/* Class legend */}
                      {Object.keys(classLegend).length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-1 h-5 ${isDarkMode ? 'bg-white' : 'bg-black'} rounded-full`}></div>
                            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-black'} uppercase tracking-wider`}>Class legend</h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(classLegend).map(([className, colorName]) => {
                              const { abbreviation, fullName } = splitClassName(className)
                              return (
                                <span
                                  key={className}
                                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border ${isDarkMode ? 'border-white/20 bg-white/5' : 'border-black/20 bg-black/5'}`}
                                >
                                  <span
                                    className="w-3 h-3 rounded-full shrink-0"
                                    style={{ backgroundColor: legendColorFromName(colorName) }}
                                  />
                                  <span className={isDarkMode ? 'text-white' : 'text-black'}>
                                    {abbreviation}
                                    {fullName && <span className="italic"> {fullName}</span>}
                                  </span>
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Overlay image */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-1 h-5 ${isDarkMode ? 'bg-white' : 'bg-black'} rounded-full`}></div>
                          <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-black'} uppercase tracking-wider`}>Annotated image</h3>
                        </div>
                        <div className={`relative w-full ${isDarkMode ? 'bg-white/5' : 'bg-black/5'} rounded-xl overflow-hidden border-2 ${isDarkMode ? 'border-white/20' : 'border-black/20'} shadow-lg`}>
                          <img
                            src={results.overlay_image}
                            alt="Segmentation overlay"
                            className="w-full object-contain"
                          />
                        </div>
                      </div>

                      {/* Class statistics */}
                      <div className="space-y-4 flex-1 flex flex-col">
                        <div className="flex items-center gap-2">
                          <div className={`w-1 h-5 ${isDarkMode ? 'bg-white' : 'bg-black'} rounded-full`}></div>
                          <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-black'} uppercase tracking-wider`}>
                            Class statistics ({classStats.length})
                          </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                          {classStats.map(([className, stats]) => {
                            const color = legendColorFromName(classLegend[className] ?? 'grey')
                            const { abbreviation, fullName } = splitClassName(className)
                            return (
                              <div
                                key={className}
                                className={`border-2 ${isDarkMode ? 'border-white/20' : 'border-black/20'} rounded-xl p-4 ${isDarkMode ? 'bg-black' : 'bg-white'} hover:shadow-lg transition-all duration-300 flex items-center gap-4`}
                              >
                                <div
                                  className="w-1 h-12 rounded-full shrink-0"
                                  style={{ backgroundColor: color }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-black'} truncate`}>
                                    {abbreviation}
                                    {fullName && <span className="italic"> {fullName}</span>}
                                  </p>
                                  <p className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                                    Pixels: {stats.pixel_count?.toLocaleString() ?? 0} • Avg confidence: {((stats.avg_confidence ?? 0) * 100).toFixed(1)}%
                                  </p>
                                </div>
                                <span
                                  className="text-sm font-mono font-bold px-3 py-1.5 rounded-lg shrink-0 italic"
                                  style={{ backgroundColor: `${color}20`, color }}
                                >
                                  {(stats.percentage ?? 0).toFixed(1)}%
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className={`mt-12 pt-8 border-t ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
            <p className={`text-center text-xs ${isDarkMode ? 'text-white/40' : 'text-black/40'} font-medium tracking-wider uppercase`}>
              40× UNET segmentation • Flask backend • Next.js frontend
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}