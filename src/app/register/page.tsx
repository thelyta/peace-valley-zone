"use client"

import { useEffect } from "react"

export default function RegisterRedirect() {
  useEffect(() => {
    window.location.href = "/"
  }, [])

  return null
}
