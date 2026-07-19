"use client"

import { useAuth } from "@/hooks/useAuth"
import { LogOut, Shield, Home, User } from "lucide-react"

export default function Navbar() {
  const { profile, signOut } = useAuth()

  if (!profile) return null

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    security: "Security",
    resident: "Resident",
  }

  const roleIcons: Record<string, React.ReactNode> = {
    admin: <Shield className="w-4 h-4" />,
    security: <Shield className="w-4 h-4" />,
    resident: <Home className="w-4 h-4" />,
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Peace Valley Zone</h1>
              <p className="text-xs text-gray-500">Magodo Phase 2</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              {roleIcons[profile.role]}
              <span className="font-medium">{profile.full_name}</span>
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {roleLabels[profile.role]}
              </span>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
