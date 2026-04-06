const { createClient } = require('@supabase/supabase-js');
const asyncHandler = require('express-async-handler');
const path = require('path');
const sharp = require('sharp');

// Supabase storage client (service role)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// POST /api/v1/learners/upload-photo
// Upload student profile photo to 'student-photos' bucket
const uploadLearnerPhoto = asyncHandler(async (req, res) => {
  if (!req.user.schoolId && req.user.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'School access required' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const file = req.file;
  const school_id = req.user.schoolId || req.body.school_id;
  const admission_number = req.body.filename || req.body.admission_number || path.parse(file.originalname).name;
  
  // Validate file type
  if (!file.mimetype.startsWith('image/')) {
    return res.status(400).json({ success: false, message: 'Only image files allowed' });
  }

  // Resize and optimize image (max 400x400, webp)
  const timestamp = Date.now();
  const fileName = `${admission_number}-${timestamp}.webp`;
  const filePath = `students/${school_id}/${fileName}`;

  try {
    const buffer = await sharp(file.buffer)
      .resize(400, 400, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('student-photos')
      .upload(filePath, buffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (error) {
      console.error('Storage upload error:', error);
      return res.status(500).json({ success: false, message: 'Failed to upload photo' });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('student-photos')
      .getPublicUrl(filePath);

    res.json({
      success: true,
      message: 'Photo uploaded successfully',
      photoUrl: publicUrl,
      filePath: filePath,
      filename: fileName
    });
  } catch (error) {
    console.error('Photo processing error:', error);
    res.status(500).json({ success: false, message: 'Photo processing failed' });
  }
});

module.exports = { uploadLearnerPhoto };

