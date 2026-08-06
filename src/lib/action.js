'use server'

import { supabase } from './supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * AUTH: DAFTAR AKUN BARU
 */
export async function handleSignup(formData) {
  const username = formData.get('username');
  const email = formData.get('email');
  const password = formData.get('password');

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) throw error;

    if (data?.user) {
      const { error: profileError } = await supabase.from('profiles').upsert([
        {
          id: data.user.id,
          username,
          role: 'user',
          avatar_url: null,
        },
      ]);

      if (profileError) throw profileError;
    }

    revalidatePath('/auth/signup');
    redirect('/auth/login');
  } catch (err) {
    console.error('handleSignup error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * AUTH: UPDATE PROFIL PENGGUNA
 */
export async function updateProfile(formData) {
  const userId = formData.get('userId');
  const username = formData.get('username');
  const avatarUrl = formData.get('avatar_url') || null;

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ username, avatar_url: avatarUrl })
      .eq('id', userId);

    if (error) throw error;

    revalidatePath('/profile');
    revalidatePath('/user');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * CREATE: TAMBAH BURUNG
 */
export async function addBird(formData) {
  const name = formData.get('name');
  const species = formData.get('species');
  const price = parseFloat(formData.get('price'));
  const stock = parseInt(formData.get('stock'));
  const imageFile = formData.get('image_file'); 

  try {
    let imageUrl = '';
    if (imageFile && imageFile.size > 0) {
      const fileName = `${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('bird-images').upload(fileName, imageFile);
      if (uploadError) throw new Error("Gagal upload: " + uploadError.message);
      const { data: publicUrlData } = supabase.storage.from('bird-images').getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from('birds').insert([
      { name, species, price, stock, image_url: imageUrl, is_hidden: false }
    ]);
    if (error) throw error;
    revalidatePath('/admin/birds');
    revalidatePath('/');
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
}

/**
 * UPDATE: EDIT DATA BURUNG
 */
export async function updateBird(id, formData) {
  const name = formData.get('name');
  const species = formData.get('species');
  const price = parseFloat(formData.get('price'));
  const stock = parseInt(formData.get('stock'));
  const imageFile = formData.get('image_file');
  const oldImageUrl = formData.get('old_image_url');
  const isHidden = formData.get('is_hidden') === 'on'; // Checkbox mengembalikan 'on' jika dicentang

  try {
    let imageUrl = oldImageUrl;
    if (imageFile && imageFile.size > 0) {
      const fileName = `${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`;
      await supabase.storage.from('bird-images').upload(fileName, imageFile);
      const { data } = supabase.storage.from('bird-images').getPublicUrl(fileName);
      imageUrl = data.publicUrl;
    }

    const { error } = await supabase.from('birds')
      .update({ name, species, price, stock, image_url: imageUrl, is_hidden: isHidden })
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/admin/birds');
    revalidatePath('/');
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
}

/**
 * DELETE: HAPUS BURUNG
 */
export async function deleteBird(id) {
  try {
    // By default perform a soft delete (set deleted_at). To hard delete, pass an object { id, hard: true }
    if (typeof id === 'object' && id !== null) {
      const { id: realId, hard } = id;
      if (hard) {
        const { error } = await supabase.from('birds').delete().eq('id', realId);
        if (error) throw error;
        revalidatePath('/admin/birds');
        revalidatePath('/');
        return { success: true };
      }
      id = realId;
    }

    const deletedAt = new Date().toISOString();
    const { error } = await supabase.from('birds').update({ deleted_at: deletedAt }).eq('id', id);
    if (error) throw error;
    revalidatePath('/admin/birds');
    revalidatePath('/');
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
}

/**
 * TOGGLE HIDE: SEMBUNYIKAN/TAMPILKAN CEPAT
 */
export async function toggleHideBird(id, currentStatus) {
  try {
    const { error } = await supabase.from('birds')
      .update({ is_hidden: !currentStatus })
      .eq('id', id);
    if (error) throw error;
    revalidatePath('/admin/birds');
    revalidatePath('/');
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
  
}