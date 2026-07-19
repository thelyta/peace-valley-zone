"use client"

import { useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import LoadingSpinner from "./LoadingSpinner"

interface RoleGuardProps {
  allowedRoles: ("admin" | "security" | "resident")[]
  children: React.ReactNode
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { profile, loading } = useAuth()

  useEffect(() => {
    if (!loading && !profile) {
      window.location.href = "/"
    }
    if (!loading && profile && !allowedRoles.includes(profile.role)) {
      const redirectMap: Record<string, string> = {
        admin: "/admin",
        security: "/security",
        resident: "/resident",
      }
      window.location.href = redirectMap[profile.role] || "/"
    }
    // Redirect residents who haven't changed their temp password
    if (!loading && profile && profile.role === "resident" && profile.password_changed === false) {
      if (window.location.pathname !== "/change-password") {
        window.location.href = "/change-password"
      }
    }
  }, [profile, loading, allowedRoles])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    return null
  }

  // Force password change for residents
  if (profile.role === "resident" && profile.password_changed === false && window.location.pathname !== "/change-password") {
    return null
  }

  return <>{children}</>
}
