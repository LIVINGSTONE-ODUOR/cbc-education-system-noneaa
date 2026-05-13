import { supabase } from '@/lib/supabase';

/**
 * Upload a staff photo to Supabase Storage and return the public URL
 * @param base64Image - Base64 encoded image string
 * @param staffId - Unique identifier for the staff member
 * @returns Promise<string | null> - Public URL of uploaded image or null on failure
 */
export const uploadStaffPhoto = async (base64Image: string, staffId: string): Promise<string | null> => {
  try {
    console.log('[DEBUG] uploadStaffPhoto starting for staffId:', staffId);
    console.log('[DEBUG] base64Image length:', base64Image.length);
    console.log('[DEBUG] base64Image starts with:', base64Image.substring(0, 30));

    // Convert base64 to blob
    const response = await fetch(base64Image);
    if (!response.ok) {
      console.error('[DEBUG] fetch failed with status:', response.status, response.statusText);
      return null;
    }
    const blob = await response.blob();
    console.log('[DEBUG] Blob created, size:', blob.size);

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `staff-photos/${staffId}-${timestamp}.jpg`;
    console.log('[DEBUG] Uploading to:', fileName);

    if (!supabase) {
      console.error('[uploadStaffPhoto] Supabase is not configured (missing VITE_SUPABASE_URL/ANON_KEY).');
      return null;
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('staff-images')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      console.error('[DEBUG] Supabase upload error:', error.message, error);
      return null;
    }

    console.log('[DEBUG] Upload successful, data:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('staff-images')
      .getPublicUrl(fileName);

    console.log('[DEBUG] Public URL generated:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('[DEBUG] uploadStaffPhoto error:', error);
    return null;
  }
};

/**
 * Delete a staff photo from Supabase Storage
 * @param photoUrl - The public URL of the photo to delete
 * @returns Promise<boolean> - True if deleted successfully
 */
export const deleteStaffPhoto = async (photoUrl: string): Promise<boolean> => {
  try {
    if (!supabase) {
      console.error('[deleteStaffPhoto] Supabase is not configured (missing VITE_SUPABASE_URL/ANON_KEY).');
      return false;
    }

    // Extract filename from URL
    const urlParts = photoUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];

    const { error } = await supabase.storage
      .from('staff-images')
      .remove([`staff-photos/${fileName}`]);

    if (error) {
      console.error('Error deleting staff photo:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting staff photo:', error);
    return false;
  }
};