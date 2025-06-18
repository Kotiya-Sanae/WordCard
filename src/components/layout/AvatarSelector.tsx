'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { updateAvatar } from "@/app/login/actions"
import Image from "next/image"
import { Button } from "../ui/button"
import { useState } from "react"

const avatars = [
  '001.png',
  '002.png',
  '003.png',
  '004.png',
  '005.png',
  '006.png',
]

export function AvatarSelector({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>选择您的头像</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          {avatars.map((avatar) => (
            <form
              action={updateAvatar.bind(null, `/avatars/${avatar}`)}
              onSubmit={() => setOpen(false)}
              key={avatar}
            >
              <Button
                type="submit"
                variant="ghost"
                className="h-auto w-auto rounded-full p-0"
              >
                <Image
                  src={`/avatars/${avatar}`}
                  alt={`Avatar ${avatar}`}
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              </Button>
            </form>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}