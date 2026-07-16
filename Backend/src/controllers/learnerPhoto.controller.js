const { createClient } = require('@supabase/supabase-js');
const asyncHandler = require('express-async-handler');
const path = require('path');
const sharp = require('sharp');
const logger = require('../utils/logger');

// Supabase storage client (service role)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// POST /api/v1/learners/upload-photo
// Upload student profile photo to 'student-photos' bucket
const uploadLearnerPhoto = asyncHandler(async (req, res) => {
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
  const admission_number = req.body.filename || req.body.admission_number || path.parse(file.originalname).name;

  // Validate file type
  if (!file.mimetype.startsWith('image/')) {
    return res.status(400).json({ success: false, message: 'Only image files allowed' });
  }

  // Validate file size
  if (file.size > 5 * 1024 * 1024) {
    return res.status(400).json({ success: false, message: 'File size exceeds 5MB limit' });
  }

  try {
    
    // Resize and optimize image (max 400x400, webp)
    const timestamp = Date.now();
    const fileName = `${admission_number}-${timestamp}.webp`;
    const filePath = `students/${school_id}/${fileName}`;

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
      logger.error('Storage upload failed:', error.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to upload photo to storage'
      });
    }

    // ✅ FIX #2: Proper error handling for getPublicUrl
    try {
      const { data } = supabase.storage
        .from('student-photos')
        .getPublicUrl(filePath);

      const publicUrl = data?.publicUrl;

      if (!publicUrl) {
        logger.error('No public URL returned from storage');
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to get public URL' 
        });
      }

      logger.debug('Learner photo uploaded successfully');

      res.json({
        success: true,
        message: 'Photo uploaded successfully',
        photoUrl: publicUrl,
        filePath: filePath,
        filename: fileName
      });
    } catch {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to generate photo URL'
      });
    }
  } catch (error) {
    logger.error('Photo processing failed:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Photo processing failed'
    });
  }
});

module.exports = { uploadLearnerPhoto };