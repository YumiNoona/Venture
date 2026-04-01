'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

export async function login(formData: FormData) {
  const supabase = createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    redirect('/signup?error=' + encodeURIComponent(error.message))
  }

  if (authData.user) {
    try {
      await prisma.user.create({
        data: {
          id: authData.user.id,
          email,
          name,
        }
      });
    } catch (e) {
      console.error("Prisma user creation error:", e);
      // Even if prisma fails, auth worked. Need a way to handle this robustly, but for now continue
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
