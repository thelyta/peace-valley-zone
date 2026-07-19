"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import RoleGuard from "@/components/RoleGuard"
import Navbar from "@/components/Navbar"
import LoadingSpinner from "@/components/LoadingSpinner"
import { generateVisitorCode, formatDate, formatDateShort } from "@/lib/utils"
import {
  UserPlus,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  Megaphone,
  Home,
  Phone,
  User,
  Calendar,
  Check,
  X,
  Ban,
  MessageCircle,
  Share2,
  QrCode,
} from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

interface Visitor {
  id: string
  visitor_name: string
  visitor_phone: string | null
  code: string
  status: "pending" | "used"
  created_at: string
  used_at: string | null
  expires_at: string | null
}

interface Announcement {
  id: string
  title: string
  message: string
  created_at: string
}

export default function ResidentDashboard() {
  return (
    <RoleGuard allowedRoles={["resident"]}>
      <ResidentContent />
    </RoleGuard>
  )
}

function ResidentContent() {
  const supabase = createClient()
  const { profile } = useAuth()
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [visitorForm, setVisitorForm] = useState({ name: "", phone: "" })
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")
  const [whatsAppSent, setWhatsAppSent] = useState(false)
  const [lastVisitorPhone, setLastVisitorPhone] = useState("")

  const duesPaid = profile?.dues_status === "paid"

  useEffect(() => {
    if (profile) {
      fetchData()
    }
  }, [profile])

  const fetchData = async () => {
    setLoading(true)

    const { data: visitorData } = await supabase
      .from("visitors")
      .select("*")
      .eq("resident_id", profile!.id)
      .order("created_at", { ascending: false })

    const { data: announcementData } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })

    setVisitors(visitorData || [])
    setAnnouncements(announcementData || [])
    setLoading(false)
  }

  const handleAddVisitor = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setGeneratedCode(null)
    setWhatsAppSent(false)
    setSubmitting(true)

    let code = generateVisitorCode()
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 50) {
      const { data: existing } = await supabase
        .from("visitors")
        .select("id")
        .eq("code", code)
        .single()

      if (!existing) {
        isUnique = true
      } else {
        code = generateVisitorCode()
        attempts++
      }
    }

    const { error: insertError } = await supabase.from("visitors").insert({
      resident_id: profile!.id,
      visitor_name: visitorForm.name,
      visitor_phone: visitorForm.phone || null,
      code,
      status: "pending",
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    })

    if (insertError) {
      setError("Failed to generate code. Please try again.")
      setSubmitting(false)
      return
    }

    setGeneratedCode(code)
    setLastVisitorPhone(visitorForm.phone)
    setVisitorForm({ name: "", phone: "" })
    await fetchData()
    setSubmitting(false)
  }

  const copyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const sendWhatsApp = () => {
    if (!generatedCode || !lastVisitorPhone) return
    const message = encodeURIComponent(
      `Hello, you have been invited to visit ${profile?.full_name} at ${profile?.unit_number}, Peace Valley Zone, Magodo Phase 2.\n\nYour access code is: ${generatedCode}\n\nThis code expires in 12 hours. Please show it at the gate for entry.`
    )
    // Format phone: remove all non-digits, ensure it starts with country code (234 for Nigeria)
    let phone = lastVisitorPhone.replace(/\D/g, "")
    if (phone.startsWith("0")) {
      phone = "234" + phone.substring(1)
    }
    if (!phone.startsWith("234")) {
      phone = "234" + phone
    }
    const url = `https://wa.me/${phone}?text=${message}`
    window.open(url, "_blank")
    setWhatsAppSent(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile?.full_name}</h1>
              <div className="flex items-center gap-2 mt-1 text-gray-500">
                <Home className="w-4 h-4" />
                <span className="text-sm">{profile?.unit_number}</span>
              </div>
            </div>
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                duesPaid
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-red-100 text-red-700 border border-red-200"
              }`}
            >
              {duesPaid ? (
                <><CheckCircle className="w-4 h-4" /> Dues Paid ({profile?.dues_year})</>
              ) : (
                <><AlertCircle className="w-4 h-4" /> Dues Not Paid ({profile?.dues_year})</>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Dues Unpaid Banner */}
            {!duesPaid && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <Ban className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-700 font-medium">Visitor invitations disabled</p>
                  <p className="text-red-600 text-sm mt-0.5">
                    Your dues are unpaid. Please visit the estate office to settle your dues before inviting visitors. You will need to go to the gate with your visitor.
                  </p>
                </div>
              </div>
            )}

            {/* Add Visitor */}
            <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${!duesPaid ? "opacity-50 pointer-events-none" : ""}`}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Add Visitor
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              {generatedCode && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm text-green-700 font-medium mb-2">
                    Visitor code generated! Share this with your visitor:
                  </p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 bg-white border-2 border-green-300 rounded-lg px-4 py-3 text-center">
                      <span className="text-3xl font-bold tracking-widest text-gray-900 font-mono">
                        {generatedCode}
                      </span>
                    </div>
                    <button
                      onClick={copyCode}
                      className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                    >
                      {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
                    </button>
                  </div>

                  {/* QR Code */}
                  <div className="bg-white rounded-lg p-4 mb-3 flex flex-col items-center">
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <QrCode className="w-3 h-3" />
                      Visitor can show this QR code at the gate
                    </p>
                    <QRCodeSVG 
                      value={generatedCode} 
                      size={180}
                      level="H"
                      includeMargin={true}
                      className="mx-auto"
                    />
                    <p className="text-xs text-gray-400 mt-2 font-mono">{generatedCode}</p>
                  </div>

                  {lastVisitorPhone && (
                    <button
                      onClick={sendWhatsApp}
                      className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-lg transition-colors mb-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {whatsAppSent ? "Sent!" : "Send via WhatsApp"}
                    </button>
                  )}
                  <p className="text-xs text-green-600">
                    <Clock className="w-3 h-3 inline mr-1" />
                    This code expires in 12 hours.
                  </p>
                </div>
              )}

              <form onSubmit={handleAddVisitor} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visitor Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={visitorForm.name}
                      onChange={(e) => setVisitorForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="e.g. John Smith"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Visitor Phone <span className="text-gray-400">(optional, for WhatsApp)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={visitorForm.phone}
                      onChange={(e) => setVisitorForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="08012345678"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting || !duesPaid}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <LoadingSpinner size="sm" /> : <><UserPlus className="w-4 h-4" /> Generate Code</>}
                </button>
              </form>
            </div>

            {/* My Visitors */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                My Visitors
              </h2>

              {visitors.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <UserPlus className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No visitors added yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visitors.map((visitor) => {
                    const isExpired = visitor.expires_at && new Date(visitor.expires_at) < new Date() && visitor.status === "pending"
                    return (
                      <div key={visitor.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{visitor.visitor_name}</p>
                            {visitor.visitor_phone && (
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3" />
                                {visitor.visitor_phone}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">Added {formatDateShort(visitor.created_at)}</p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                visitor.status === "used"
                                  ? "bg-green-100 text-green-700"
                                  : isExpired
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {visitor.status === "used" ? <CheckCircle className="w-3 h-3" /> : isExpired ? <X className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {visitor.status === "used" ? "Used" : isExpired ? "Expired" : "Pending"}
                            </span>
                            <p className="text-lg font-mono font-bold text-gray-700 mt-1 tracking-wider">{visitor.code}</p>
                          </div>
                        </div>
                        {visitor.status === "used" && visitor.used_at && (
                          <p className="text-xs text-green-600 mt-2 pt-2 border-t border-gray-100">
                            Entry confirmed on {formatDate(visitor.used_at)}
                          </p>
                        )}
                        {visitor.status === "pending" && visitor.expires_at && !isExpired && (
                          <p className="text-xs text-yellow-600 mt-2 pt-2 border-t border-gray-100">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Expires {formatDateShort(visitor.expires_at)}
                          </p>
                        )}
                        {isExpired && (
                          <p className="text-xs text-red-600 mt-2 pt-2 border-t border-gray-100">
                            <X className="w-3 h-3 inline mr-1" />
                            Expired on {formatDateShort(visitor.expires_at)}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Announcements */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-blue-600" />
              Announcements
            </h2>

            {announcements.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No announcements yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="border-l-4 border-blue-500 bg-blue-50/50 rounded-r-lg p-4"
                  >
                    <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                    <p className="text-gray-600 text-sm mt-1 whitespace-pre-wrap">{announcement.message}</p>
                    <p className="text-xs text-gray-400 mt-2">Posted {formatDateShort(announcement.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
