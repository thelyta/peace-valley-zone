"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import RoleGuard from "@/components/RoleGuard"
import Navbar from "@/components/Navbar"
import LoadingSpinner from "@/components/LoadingSpinner"
import { formatDate, formatDateShort } from "@/lib/utils"
import {
  Users,
  Megaphone,
  ClipboardList,
  Search,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Send,
  User,
  Home,
  Phone,
  Mail,
  Clock,
  Check,
  X,
  Download,
  UserPlus,
  Ban,
  Unlock,
  Lock,
} from "lucide-react"

interface Resident {
  id: string
  full_name: string
  phone: string
  email: string
  unit_number: string
  dues_status: string
  dues_year: string
  is_active: boolean
  password_changed: boolean
}

interface Announcement {
  id: string
  title: string
  message: string
  created_at: string
}

interface VisitationLog {
  id: string
  visitor_name: string
  visitor_phone: string | null
  code: string
  status: string
  created_at: string
  used_at: string | null
  expires_at: string | null
  resident: { full_name: string; unit_number: string }
  confirmed_by_profile?: { full_name: string } | null
}

type Tab = "residents" | "add-resident" | "announcements" | "log"

export default function AdminDashboard() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminContent />
    </RoleGuard>
  )
}

function AdminContent() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<Tab>("residents")
  const [residents, setResidents] = useState<Resident[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [visitationLog, setVisitationLog] = useState<VisitationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [announcementForm, setAnnouncementForm] = useState({ title: "", message: "" })
  const [posting, setPosting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  // Add Resident form state
  const [residentForm, setResidentForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    unit_number: "",
    temp_password: "",
  })
  const [creatingResident, setCreatingResident] = useState(false)
  const [residentSuccess, setResidentSuccess] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    const [{ data: residentsData }, { data: announcementsData }, { data: logData }] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("role", "resident").order("created_at", { ascending: false }),
        supabase.from("announcements").select("*").order("created_at", { ascending: false }),
        supabase
          .from("visitors")
          .select(`
            *,
            resident:resident_id (full_name, unit_number),
            confirmed_by_profile:confirmed_by (full_name)
          `)
          .order("created_at", { ascending: false }),
      ])

    setResidents(residentsData || [])
    setAnnouncements(announcementsData || [])
    setVisitationLog(logData || [])
    setLoading(false)
  }

  const toggleDues = async (resident: Resident) => {
    setTogglingId(resident.id)
    const newStatus = resident.dues_status === "paid" ? "unpaid" : "paid"
    const { error } = await supabase
      .from("profiles")
      .update({ dues_status: newStatus })
      .eq("id", resident.id)

    if (!error) {
      setResidents((prev) =>
        prev.map((r) => (r.id === resident.id ? { ...r, dues_status: newStatus } : r))
      )
    }
    setTogglingId(null)
  }

  const toggleActive = async (resident: Resident) => {
    setRevokingId(resident.id)
    const newActive = !resident.is_active
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: newActive })
      .eq("id", resident.id)

    if (!error) {
      setResidents((prev) =>
        prev.map((r) => (r.id === resident.id ? { ...r, is_active: newActive } : r))
      )
    }
    setRevokingId(null)
  }

  const createResident = async (e: React.FormEvent) => {
    e.preventDefault()
    setResidentSuccess("")

    if (residentForm.temp_password.length < 6) {
      setResidentSuccess("Password must be at least 6 characters.")
      return
    }

    setCreatingResident(true)

    // Create auth user via Supabase Admin API (requires service role key)
    // Since we don't have service role in frontend, we'll use signUp with metadata
    // and the trigger will create the profile
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: residentForm.email,
      password: residentForm.temp_password,
      options: {
        data: {
          full_name: residentForm.full_name,
          phone: residentForm.phone,
          unit_number: residentForm.unit_number,
        },
      },
    })

    if (authError) {
      setResidentSuccess("Error: " + authError.message)
      setCreatingResident(false)
      return
    }

    if (!authData.user) {
      setResidentSuccess("Failed to create account.")
      setCreatingResident(false)
      return
    }

    // Update the profile to ensure all fields are set (trigger may have created it)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: residentForm.full_name,
        phone: residentForm.phone,
        email: residentForm.email,
        unit_number: residentForm.unit_number,
        role: "resident",
        dues_status: "unpaid",
        is_active: true,
        password_changed: false,
      })
      .eq("id", authData.user.id)

    if (updateError) {
      setResidentSuccess("Account created but profile update failed.")
      setCreatingResident(false)
      return
    }

    setResidentSuccess(`Resident account created successfully! Email: ${residentForm.email}, Password: ${residentForm.temp_password}`)
    setResidentForm({ full_name: "", phone: "", email: "", unit_number: "", temp_password: "" })
    await fetchData()
    setCreatingResident(false)
  }

  const postAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) return

    setPosting(true)
    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase.from("announcements").insert({
      title: announcementForm.title.trim(),
      message: announcementForm.message.trim(),
      created_by: userData.user?.id,
    })

    if (!error) {
      setAnnouncementForm({ title: "", message: "" })
      await fetchData()
    }
    setPosting(false)
  }

  const deleteAnnouncement = async (id: string) => {
    setDeletingId(id)
    const { error } = await supabase.from("announcements").delete().eq("id", id)
    if (!error) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
    }
    setDeletingId(null)
  }

  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const downloadCSV = () => {
    // Filter by date range if set
    let filtered = [...visitationLog]
    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      fromDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter((log) => new Date(log.created_at) >= fromDate)
    }
    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((log) => new Date(log.created_at) <= toDate)
    }

    const headers = ["Date", "Visitor Name", "Visitor Phone", "Resident Name", "Unit", "Code", "Status", "Created At", "Used At", "Expired At", "Confirmed By"]
    const rows = filtered.map((log) => [
      formatDateShort(log.created_at),
      log.visitor_name,
      log.visitor_phone || "",
      log.resident?.full_name || "",
      log.resident?.unit_number || "",
      log.code,
      log.status,
      formatDateShort(log.created_at),
      log.used_at ? formatDateShort(log.used_at) : "",
      log.expires_at ? formatDateShort(log.expires_at) : "",
      log.confirmed_by_profile?.full_name || "",
    ])

    if (rows.length === 0) {
      alert("No records found for the selected date range.")
      return
    }

    const csv = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url

    // Filename reflects date range
    let filename = "visitation-log"
    if (dateFrom && dateTo) filename += `-${dateFrom}-to-${dateTo}`
    else if (dateFrom) filename += `-from-${dateFrom}`
    else if (dateTo) filename += `-to-${dateTo}`
    else filename += `-${new Date().toISOString().split("T")[0]}`
    a.download = `${filename}.csv`

    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filteredResidents = residents.filter(
    (r) =>
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.unit_number.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase())
  )

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

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "residents", label: "Residents", icon: <Users className="w-4 h-4" /> },
    { id: "add-resident", label: "Add Resident", icon: <UserPlus className="w-4 h-4" /> },
    { id: "announcements", label: "Announcements", icon: <Megaphone className="w-4 h-4" /> },
    { id: "log", label: "Visitation Log", icon: <ClipboardList className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Residents Tab */}
        {activeTab === "residents" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, unit, or email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium">Unit</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Contact</th>
                    <th className="text-left px-4 py-3 font-medium">Dues</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredResidents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        No residents found.
                      </td>
                    </tr>
                  ) : (
                    filteredResidents.map((resident) => (
                      <tr key={resident.id} className={`hover:bg-gray-50 ${!resident.is_active ? "opacity-60" : ""}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{resident.full_name}</span>
                            {!resident.password_changed && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Temp</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Home className="w-3.5 h-3.5" />
                            {resident.unit_number}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="space-y-0.5 text-gray-500">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {resident.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {resident.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                              resident.dues_status === "paid"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {resident.dues_status === "paid" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {resident.dues_status === "paid" ? "Paid" : "Not Paid"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                              resident.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {resident.is_active ? <Unlock className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                            {resident.is_active ? "Active" : "Revoked"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleDues(resident)}
                              disabled={togglingId === resident.id}
                              className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                                resident.dues_status === "paid"
                                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                                  : "bg-green-50 text-green-600 hover:bg-green-100"
                              } disabled:opacity-50`}
                              title="Toggle Dues"
                            >
                              {togglingId === resident.id ? <LoadingSpinner size="sm" /> : resident.dues_status === "paid" ? "Unpaid" : "Paid"}
                            </button>
                            <button
                              onClick={() => toggleActive(resident)}
                              disabled={revokingId === resident.id}
                              className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                                resident.is_active
                                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                                  : "bg-green-50 text-green-600 hover:bg-green-100"
                              } disabled:opacity-50`}
                              title={resident.is_active ? "Revoke Access" : "Restore Access"}
                            >
                              {revokingId === resident.id ? <LoadingSpinner size="sm" /> : resident.is_active ? <Ban className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Resident Tab */}
        {activeTab === "add-resident" && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Add New Resident
              </h2>

              {residentSuccess && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${residentSuccess.startsWith("Resident account created") ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                  {residentSuccess}
                </div>
              )}

              <form onSubmit={createResident} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={residentForm.full_name}
                    onChange={(e) => setResidentForm((prev) => ({ ...prev, full_name: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={residentForm.phone}
                      onChange={(e) => setResidentForm((prev) => ({ ...prev, phone: e.target.value }))}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="08012345678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={residentForm.email}
                      onChange={(e) => setResidentForm((prev) => ({ ...prev, email: e.target.value }))}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="resident@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number</label>
                  <input
                    type="text"
                    value={residentForm.unit_number}
                    onChange={(e) => setResidentForm((prev) => ({ ...prev, unit_number: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Block 4, Flat 2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                  <input
                    type="text"
                    value={residentForm.temp_password}
                    onChange={(e) => setResidentForm((prev) => ({ ...prev, temp_password: e.target.value }))}
                    required
                    minLength={6}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Min 6 characters"
                  />
                  <p className="text-xs text-gray-500 mt-1">Resident will be forced to change this on first login.</p>
                </div>
                <button
                  type="submit"
                  disabled={creatingResident}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {creatingResident ? <LoadingSpinner size="sm" /> : <><UserPlus className="w-4 h-4" /> Create Resident Account</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === "announcements" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Post New Announcement
              </h2>
              <form onSubmit={postAnnouncement} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Announcement title..."
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <textarea
                    value={announcementForm.message}
                    onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, message: e.target.value }))}
                    placeholder="Write your announcement message..."
                    required
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={posting}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {posting ? <LoadingSpinner size="sm" /> : <><Send className="w-4 h-4" /> Post Announcement</>}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Past Announcements</h2>
              {announcements.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No announcements yet.</p>
              ) : (
                <div className="space-y-3">
                  {announcements.map((a) => (
                    <div key={a.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{a.title}</h3>
                          <p className="text-gray-600 text-sm mt-1 whitespace-pre-wrap">{a.message}</p>
                          <p className="text-xs text-gray-400 mt-2">Posted {formatDateShort(a.created_at)}</p>
                        </div>
                        <button
                          onClick={() => deleteAnnouncement(a.id)}
                          disabled={deletingId === a.id}
                          className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Visitation Log Tab */}
        {activeTab === "log" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900">Visitation Log</h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 whitespace-nowrap">From:</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 whitespace-nowrap">To:</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={downloadCSV}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download CSV
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Visitor</th>
                    <th className="text-left px-4 py-3 font-medium">Resident</th>
                    <th className="text-left px-4 py-3 font-medium">Code</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Created</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Expires</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visitationLog.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                        No visitation records yet.
                      </td>
                    </tr>
                  ) : (
                    visitationLog.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{log.visitor_name}</div>
                          {log.visitor_phone && (
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" />
                              {log.visitor_phone}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-900">{log.resident?.full_name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Home className="w-3 h-3" />
                            {log.resident?.unit_number}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-gray-700 tracking-wider">{log.code}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              log.status === "used"
                                ? "bg-green-100 text-green-700"
                                : new Date(log.expires_at || "") < new Date()
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {log.status === "used" ? <Check className="w-3 h-3" /> : new Date(log.expires_at || "") < new Date() ? <X className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {log.status === "used" ? "Used" : new Date(log.expires_at || "") < new Date() ? "Expired" : "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-gray-500">{formatDateShort(log.created_at)}</td>
                        <td className="px-4 py-3 hidden lg:table-cell text-gray-500">{log.expires_at ? formatDateShort(log.expires_at) : "—"}</td>
                        <td className="px-4 py-3 hidden lg:table-cell text-gray-500">
                          {log.used_at ? formatDateShort(log.used_at) : "—"}
                          {log.confirmed_by_profile?.full_name && (
                            <div className="text-xs text-gray-400 mt-0.5">by {log.confirmed_by_profile.full_name}</div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
