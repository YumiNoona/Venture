'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/getUser'
import { ActionState } from '@/lib/types';

export async function updateProfile(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { authUser, dbUser } = await requireUser();
  const supabase = createClient();

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  // Update Supabase Auth Email if changed
  if (email !== authUser.email) {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) {
      return { error: error.message, success: null };
    }
  }

  // Update Prisma Profile
  await prisma.user.update({
    where: { id: dbUser?.id },
    data: { name, email }
  });

  revalidatePath('/dashboard/settings');
  return { error: null, success: "Profile updated successfully" };
}

export async function updatePassword(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { authUser } = await requireUser();
  const supabase = createClient();

  const password = formData.get('password') as string;

  const { error } = await supabase.auth.updateUser({ password });
  
  if (error) {
    return { error: error.message, success: null };
  }

  return { error: null, success: "Password updated successfully" };
}
