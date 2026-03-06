'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  Search,
  BarChart3,
  FileStack,
  Upload,
  Microscope,
  Globe,
  Mail,
  Settings,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/ThemeProvider'

export default function LandingPage() {
  const { isDarkMode } = useTheme()

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-white text-neutral-900'
      }`}
    >
      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 md:px-8 pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6">
            <span className="inline-block bg-violet-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
            V1.0.1 NOW LIVE
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Microfilaria Analyser
              <br />
              <span className="text-violet-600 dark:text-violet-400">Powered by Computer Vision</span>
            </h1>
            <p
              className={`text-lg max-w-xl ${
                isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
              } leading-relaxed`}
            >
              Precision microfilaria detection and segmentation for clinical research. Automate
              diagnosis with more than ~90% accuracy using our YOLO and UNet-based computer vision architecture.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-6 py-3 text-base font-medium"
              >
                <Link href="/detect">
                  Start Analysis <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className={`rounded-lg px-6 py-3 text-base border-2 ${
                  isDarkMode
                    ? 'border-neutral-600 text-neutral-200 hover:bg-neutral-800'
                    : 'border-neutral-300 text-neutral-800 hover:bg-neutral-50'
                }`}
              >
                <Link href="#methodology">Documentation</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div
              className={`rounded-2xl overflow-hidden border shadow-2xl ${
                isDarkMode ? 'border-neutral-700' : 'border-neutral-200'
              }`}
            >
              {/* macOS-style window chrome */}
              <div
                className={`flex items-center gap-2 px-4 py-3 ${
                  isDarkMode ? 'bg-neutral-800' : 'bg-neutral-100'
                } border-b`}
              >
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
              </div>
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src="/landing_image.png"
                  alt="Microfilaria analyser app — UNet segmentation and diagnostic output"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by */}
      <section className="py-12 border-t border-b border-neutral-200 dark:border-neutral-800">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-8">
          Developed and Engineered by 
        </p>
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap justify-center items-center gap-12 opacity-80">
          <Image
            src="/polarythm_logo.png"
            alt="Polarythm"
            width={120}
            height={48}
            className="h-12 w-auto object-contain"
          />
          <Image
            src="/ukm_logo.png"
            alt="Universiti Kebangsaan Malaysia"
            width={200}
            height={100}
            className="h-12 w-auto object-contain"
          />
          <Image
            src="/umbi_logo.jpeg"
            alt="UKM Medical Molecular Biology Institute"
            width={120}
            height={48}
            className="h-12 w-auto object-contain"
          />
        </div>
      </section>

      {/* Precision Analysis Infrastructure */}
      <section id="methodology" className="max-w-7xl mx-auto px-6 md:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Precision Analysis Infrastructure
          </h2>
          <p
            className={`text-lg ${
              isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
            }`}
          >
            Our platform combines high-resolution microscopy with deep learning to deliver
            instant, actionable data for parasitology.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card
            className={`border rounded-2xl overflow-hidden ${
              isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
            }`}
          >
            <CardHeader>
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${
                  isDarkMode ? 'bg-violet-500/20' : 'bg-violet-100'
                }`}
              >
                <Search className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <CardTitle className="text-xl">Multi-Scale Support</CardTitle>
              <CardDescription
                className={isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}
              >
                Seamlessly switch between 10x for broad screening and 40x for detailed species
                differentiation and segmentation.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card
            className={`border rounded-2xl overflow-hidden ${
              isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
            }`}
          >
            <CardHeader>
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${
                  isDarkMode ? 'bg-violet-500/20' : 'bg-violet-100'
                }`}
              >
                <BarChart3 className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <CardTitle className="text-xl">High-Confidence Stats</CardTitle>
              <CardDescription
                className={isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}
              >
                Adjustable confidence thresholds allow researchers to fine-tune sensitivity versus
                specificity for specific studies.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-violet-600 py-12 md:py-16 -mx-4 md:-mx-8 px-4 md:px-8">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 gap-8 text-center text-white">
          <div>
            <p className="text-3xl md:text-4xl font-bold">~90%</p>
            <p className="text-sm font-medium opacity-90 uppercase tracking-wider mt-1">
              Accuracy
            </p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-bold">150ms</p>
            <p className="text-sm font-medium opacity-90 uppercase tracking-wider mt-1">
              Latency
            </p>
          </div>
        </div>
      </section>

      {/* Ready to accelerate */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to accelerate your research?
          </h2>
          <p
            className={`text-lg ${
              isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
            }`}
          >
            Start analyzing your microscopy samples today with our AI-powered workbench.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card
            className={`border rounded-2xl overflow-hidden ${
              isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
            }`}
          >
            <CardHeader className="relative">
              <span
                className={`absolute top-4 right-4 rounded-full text-xs px-2.5 py-0.5 font-medium ${
                  isDarkMode ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-700'
                }`}
              >
                Available
              </span>
              <CardTitle className="text-xl pr-20">10x Detection</CardTitle>
              <CardDescription
                className={isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}
              >
                Used for detecting presence of microfilaria in 10x microscopy images
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className={`aspect-video rounded-xl flex items-center justify-center ${
                  isDarkMode ? 'bg-neutral-800' : 'bg-neutral-100'
                }`}
              >
                <Upload className="h-16 w-16 text-neutral-400 dark:text-neutral-500" />
              </div>
              <Button asChild className="w-full rounded-lg py-3 font-medium" variant="secondary">
                <Link href="/detect">Launch Detection</Link>
              </Button>
            </CardContent>
          </Card>
          <Card
            className={`border rounded-2xl overflow-hidden ${
              isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
            }`}
          >
            <CardHeader className="relative">
              <span className={`absolute top-4 right-4 rounded-full text-xs px-2.5 py-0.5 font-medium ${
                  isDarkMode ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-700'
                }`}
              >
                Available
              </span>
              <CardTitle className="text-xl pr-24">40x Classification</CardTitle>
              <CardDescription
                className={isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}
              >
                Used for classifying microfilaria species in 40x microscopy images
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className={`aspect-video rounded-xl flex items-center justify-center ${
                  isDarkMode ? 'bg-neutral-800' : 'bg-neutral-100'
                }`}
              >
                <Microscope className="h-16 w-16 text-neutral-400 dark:text-neutral-500" />
              </div>
              <Button asChild className="w-full rounded-lg py-3 font-medium" variant="secondary">
                <Link href="/classification-detect">Launch Classification</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer
        className={`border-t py-12 ${
          isDarkMode ? 'border-neutral-800 bg-neutral-950' : 'border-neutral-200 bg-neutral-50'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Image
              src="/favicon.ico"
              alt=""
              width={24}
              height={24}
              className="rounded-md"
            />
            <span className="font-semibold">
              Microfilaria <span className="font-analyser font-normal lowercase">analyser</span>
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-500">
            © 2026 Polarythm Microfilaria Analyser. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <button type="button" aria-label="Website" className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800">
              <Globe className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Email" className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800">
              <Mail className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Settings" className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
