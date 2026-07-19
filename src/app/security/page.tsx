"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import RoleGuard from "@/components/RoleGuard"
import Navbar from "@/components/Navbar"
import LoadingSpinner from "@/components/LoadingSpinner"
import { formatDate } from "@/lib/utils"
import {
  Shield,
  Search,
  CheckCircle,
  AlertCircle,
  User,
  Home,
  Phone,
  Clock,
  Check,
  X,
  Ban,
  QrCode,
  Camera,
  Upload,
} from "lucide-react"

interface VisitorResult {
  id: string
  visitor_name: string
  visitor_phone: string | null
  code: string
  status: "pending" | "used"
  created_at: string
  used_at: string | null
  expires_at: string | null
  resident: {
    full_name: string
    unit_number: string
  }
}

export default function SecurityDashboard() {
  return (
    <RoleGuard allowedRoles={["security"]}>
      <SecurityContent />
    </RoleGuard>
  )
}

function SecurityContent() {
  const supabase = createClient()
  const { profile } = useAuth()
  const [code, setCode] = useState("")
  const [visitor, setVisitor] = useState<VisitorResult | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [success, setSuccess] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [scanResult, setScanResult] = useState("")

  // Dynamically import jsQR only when needed
  const [jsQRLoaded, setJsQRLoaded] = useState(false)
  const jsQRRef = useRef<any>(null)

  useEffect(() => {
    if (scanning && !jsQRLoaded) {
      import("jsqr").then((mod) => {
        jsQRRef.current = mod.default || mod
        setJsQRLoaded(true)
      }).catch(() => {
        setCameraError("Failed to load QR scanner library.")
      })
    }
  }, [scanning, jsQRLoaded])

  const verifyCode = async (codeToVerify: string) => {
    setError("")
    setVisitor(null)
    setSuccess(false)
    setLoading(true)

    const { data, error: queryError } = await supabase
      .from("visitors")
      .select(`
        *,
        resident:resident_id (full_name, unit_number)
      `)
      .eq("code", codeToVerify)
      .single()

    if (queryError || !data) {
      setError("Invalid code.")
      setLoading(false)
      return
    }

    if (data.expires_at && new Date(data.expires_at) < new Date() && data.status === "pending") {
      setError("This code has expired. Please ask the resident to generate a new one.")
      setVisitor(data as VisitorResult)
      setLoading(false)
      return
    }

    if (data.status === "used") {
      setError(`This code has already been used on ${formatDate(data.used_at)}.`)
      setVisitor(data as VisitorResult)
      setLoading(false)
      return
    }

    setVisitor(data as VisitorResult)
    setLoading(false)
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    await verifyCode(code.toUpperCase())
  }

  const handleConfirm = async () => {
    if (!visitor) return
    setConfirming(true)

    const { error: updateError } = await supabase
      .from("visitors")
      .update({
        status: "used",
        used_at: new Date().toISOString(),
        confirmed_by: profile!.id,
      })
      .eq("id", visitor.id)

    if (updateError) {
      setError("Failed to confirm entry. Please try again.")
      setConfirming(false)
      return
    }

    setSuccess(true)
    setVisitor(null)
    setCode("")
    setConfirming(false)
  }

  const reset = () => {
    setCode("")
    setVisitor(null)
    setError("")
    setSuccess(false)
    stopScanner()
  }

  // QR Scanner functions
  const startScanner = async () => {
    setScanning(true)
    setCameraError("")
    setError("")
    setVisitor(null)
    setSuccess(false)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (err: any) {
      setCameraError("Camera access denied. Please allow camera permissions in your browser settings.")
      setScanning(false)
    }
  }

  const stopScanner = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setScanning(false)
    setCameraError("")
  }, [])

  // Scan loop
  useEffect(() => {
    if (!scanning || !jsQRLoaded || !jsQRRef.current) return

    scanIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current || !jsQRRef.current) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQRRef.current(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      })

      if (code) {
        stopScanner()
        const scannedCode = code.data.toUpperCase()
        setCode(scannedCode)
        setScanResult(scannedCode)
        verifyCode(scannedCode)
      }
    }, 200)

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
    }
  }, [scanning, jsQRLoaded, stopScanner])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [stopScanner])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Gate Verification</h1>
          <p className="text-gray-500 mt-1">Enter the visitor code to verify</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-green-700 font-semibold">Entry confirmed!</p>
            <p className="text-green-600 text-sm mt-1">The visitor has been granted access.</p>
            <button onClick={reset} className="mt-3 text-sm text-green-700 font-medium hover:underline">
              Verify another code
            </button>
          </div>
        )}

        {!success && !visitor && !scanning && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Visitor Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  maxLength={6}
                  className="w-full text-center text-2xl font-bold tracking-[0.5em] uppercase px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono"
                  placeholder="______"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <LoadingSpinner size="sm" /> : <><Search className="w-4 h-4" /> Verify Code</>}
              </button>
            </form>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              onClick={startScanner}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              <Camera className="w-4 h-4" />
              Scan QR Code
            </button>
          </div>
        )}

        {/* QR Scanner */}
        {scanning && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Scan QR Code
              </h3>
              <button
                onClick={stopScanner}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Cancel
              </button>
            </div>
            {cameraError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {cameraError}
              </div>
            )}
            <div className="relative rounded-lg overflow-hidden bg-black" style={{ minHeight: "300px" }}>
              <video
                ref={videoRef}
                className="w-full h-auto"
                style={{ maxHeight: "400px", objectFit: "cover" }}
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              {!jsQRLoaded && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <LoadingSpinner size="md" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 text-center mt-3">
              Point camera at the visitor&apos;s QR code
            </p>
          </div>
        )}

        {visitor && visitor.status === "pending" && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-blue-600 px-6 py-4">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Valid Code Found
              </h2>
              <p className="text-blue-100 text-sm mt-0.5">Review visitor details before confirming entry</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Visitor</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-gray-400" />
                    {visitor.visitor_name}
                  </p>
                  {visitor.visitor_phone && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      {visitor.visitor_phone}
                    </p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Resident</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-gray-400" />
                    {visitor.resident.full_name}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <Home className="w-3 h-3" />
                    {visitor.resident.unit_number}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                <span>Code generated on {formatDate(visitor.created_at)}</span>
              </div>

              {visitor.expires_at && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span>Expires {formatDate(visitor.expires_at)}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={reset} className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="flex-[2] flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {confirming ? <LoadingSpinner size="sm" /> : <><Check className="w-4 h-4" /> Confirm & Let In</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {visitor && (visitor.status === "used" || error?.includes("expired")) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className={`px-6 py-4 ${error?.includes("expired") ? "bg-red-600" : "bg-red-600"}`}>
              <h2 className="text-white font-semibold flex items-center gap-2">
                {error?.includes("expired") ? <Ban className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {error?.includes("expired") ? "Code Expired" : "Code Already Used"}
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                {error?.includes("expired")
                  ? "This code has expired. Please ask the resident to generate a new one."
                  : `This code was already used on ${formatDate(visitor.used_at)}.`}
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500">Visitor</p>
                <p className="font-semibold text-gray-900">{visitor.visitor_name}</p>
                <p className="text-xs text-gray-500 mt-2">Resident</p>
                <p className="font-semibold text-gray-900">{visitor.resident.full_name}</p>
                <p className="text-sm text-gray-500">{visitor.resident.unit_number}</p>
              </div>
              <button onClick={reset} className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors">
                Verify Another Code
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
