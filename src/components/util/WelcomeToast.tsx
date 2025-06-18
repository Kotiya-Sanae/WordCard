'use client'

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"
import { createClient } from "@/utils/supabase/client"

export function WelcomeToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const welcome = searchParams.get('welcome')
    if (welcome === 'true') {
      const showToast = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          toast.success(`欢迎回来，${user.email}！`)
        } else {
          toast.success('欢迎回来！')
        }
        // Clean the URL after showing the toast
        router.replace(pathname, { scroll: false })
      }
      showToast()
    }
  }, [searchParams, supabase, router, pathname])

  return null
}