import { supabase } from '@/lib/supabase';

/**
 * Upload a staff photo to Supabase Storage and return the public URL
 * @param base64Image - Base64 encoded image string
 * @param staffId - Unique identifier for the staff member
 * @returns Promise<string | null> - Public URL of uploaded image or null on failure
 */
export const uploadStaffPhoto = async (base64Image: string, staffId: string): Promise<string | null> => {
  try {
    // Convert base64 to blob
    const response = await fetch(base64Image);
    if (!response.ok) return null;
    const blob = await response.blob();

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `staff-photos/${staffId}-${timestamp}.jpg`;

    if (!supabase) return null;

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('staff-images')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) return null;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('staff-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch {
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
    if (!supabase) return false;

    // Extract filename from URL
    const urlParts = photoUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];

    const { error } = await supabase.storage
      .from('staff-images')
      .remove([`staff-photos/${fileName}`]);

    if (error) return false;

    return true;
  } catch {
    return false;
  }
};