const { createClient } = require('@supabase/supabase-js');
const asyncHandler = require('express-async-handler');
const path = require('path');
const sharp = require('sharp');

// Supabase storage client (service role)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// POST /api/v1/teachers/upload-photo
// Upload teacher profile photo to the 'student-photos' bucket, under a
// teachers/ prefix (reuses the existing bucket so no new Supabase Storage
// bucket needs to be created).
const uploadTeacherPhoto = asyncHandler(async (req, res) => {
  console.log('[uploadTeacherPhoto] START', {
    hasFile: !!req.file,
    user: req.user ? { id: req.user.id, role: req.user.role, schoolId: req.user.schoolId } : null
  });

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  if (req.user.role !== 'super_admin' && !req.user.schoolId) {
    return res.status(403).json({ success: false, message: 'School access required' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const file = req.file;
  const school_id = req.user.schoolId;
  const label = req.body.filename || req.body.employee_number || path.parse(file.originalname).name;

  if (!file.mimetype.startsWith('image/')) {
    return res.status(400).json({ success: false, message: 'Only image files allowed' });
  }

  if (file.size > 5 * 1024 * 1024) {
    return res.status(400).json({ success: false, message: 'File size exceeds 5MB limit' });
  }

  try {
    const timestamp = Date.now();
    const safeLabel = String(label).replace(/[^a-zA-Z0-9-_]/g, '') || 'teacher';
    const fileName = `${safeLabel}-${timestamp}.webp`;
    const filePath = `teachers/${school_id}/${fileName}`;

    const buffer = await sharp(file.buffer)
      .resize(400, 400, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    const { error } = await supabase.storage
      .from('student-photos')
      .upload(filePath, buffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (error) {
      console.error('[uploadTeacherPhoto] Storage upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload photo to storage',
        error: error.message
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from('student-photos')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl;

    if (!publicUrl) {
      return res.status(500).json({ success: false, message: 'Failed to get public URL' });
    }

    console.log('[uploadTeacherPhoto] Success', { publicUrl });

    res.json({
      success: true,
      message: 'Photo uploaded successfully',
      photoUrl: publicUrl,
      filePath,
      filename: fileName
    });
  } catch (error) {
    console.error('[uploadTeacherPhoto] Processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Photo processing failed',
      error: error.message
    });
  }
});

module.exports = { uploadTeacherPhoto };
