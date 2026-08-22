'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from './supabase';
import { getAuthedUser } from './apiAuth';

/**
 * AUTH: DAFTAR AKUN BARU
 * Mengembalikan { success } atau { success: false, error }.
 * Redirect dilakukan di client setelah sukses (bukan di dalam try/catch).
 */
export async function handleSignup(formData) {
  const username = String(formData.get('username') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!username) return { success: false, error: 'Username wajib diisi.' };
  if (!email) return { success: false, error: 'Email wajib diisi.' };
  if (password.length < 6) {
    return { success: false, error: 'Password minimal 6 karakter.' };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) throw error;

    // Profile sudah dibuat otomatis oleh trigger handle_new_user
    // Tidak perlu upsert manual → hindari RLS conflict

    revalidatePath('/auth/signup');
    return { success: true };
  } catch (err) {
    console.error('handleSignup error:', err);
    return { success: false, error: err.message || 'Pendaftaran gagal.' };
  }
}

/**
 * AUTH: UPDATE PROFIL PENGGUNA
 * userId diambil dari session terverifikasi, BUKAN dari form.
 */
export async function updateProfile(formData) {
  const username = String(formData.get('username') || '').trim();
  const avatarUrl = formData.get('avatar_url') || null;

  if (!username) return { success: false, error: 'Username wajib diisi.' };

  try {
    const { user, profile, supabase } = await getAuthedUser();
    if (!user) return { success: false, error: 'Sesi berakhir, silakan login ulang.' };

    // Role tidak boleh diubah lewat form; hanya username & avatar.
    const { error } = await supabase
      .from('profiles')
      .update({ username, avatar_url: avatarUrl })
      .eq('id', profile?.id ?? user.id);

    if (error) throw error;

    revalidatePath('/profile');
    revalidatePath('/user');
    return { success: true };
  } catch (err) {
    console.error('updateProfile error:', err);
    return { success: false, error: err.message || 'Gagal menyimpan profil.' };
  }
}
