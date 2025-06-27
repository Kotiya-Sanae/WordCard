'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { LoginSchema, SignupSchema } from '@/lib/schemas'

export async function login(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries())
  const validationResult = LoginSchema.safeParse(rawFormData)

  if (!validationResult.success) {
    console.error("Login validation failed:", validationResult.error.flatten().fieldErrors);
    // In a real app, you'd redirect with an error message
    return redirect('/login?error=Validation failed')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(validationResult.data)

  if (error) {
    console.error("Login failed:", error.message);
    return redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/?welcome=true')
}

export async function signup(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries())
  const validationResult = SignupSchema.safeParse(rawFormData)

  if (!validationResult.success) {
    console.error("Signup validation failed:", validationResult.error.flatten().fieldErrors);
    return redirect('/login?error=Validation failed')
  }
  
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: validationResult.data.email,
    password: validationResult.data.password,
    options: {
      data: {
        avatar_url: '/avatars/002.png',
      },
    },
  })

  if (error) {
    console.error("Signup failed:", error.message);
    return redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/auth/check-email')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function updateAvatar(avatarUrl: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/login');
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      avatar_url: avatarUrl,
    },
  });

  if (error) {
    console.error('Error updating avatar:', error);
    return;
  }

  revalidatePath('/', 'layout');
}