const { createClient } = require('@supabase/supabase-js');
const asyncHandler = require('express-async-handler');
const path = require('path');
const sharp = require('sharp');
const logger = require('../utils/logger');

// Supabase storage client (service role)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// POST /api/v1/teachers/upload-photo
const uploadTeacherPhoto = asyncHandler(async (req, res) => {
  logger.debug('Teacher photo upload started');

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
    const filePath = `teachers/${req.user.schoolId || 'unknown'}/${fileName}`;

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
      logger.error('Storage upload failed:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload photo to storage'
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from('student-photos')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl;

    if (!publicUrl) {
      return res.status(500).json({ success: false, message: 'Failed to get public URL' });
    }

    logger.debug('Teacher photo uploaded successfully');

    res.json({
      success: true,
      message: 'Photo uploaded successfully',
      photoUrl: publicUrl,
      filePath,
      filename: fileName
    });
  } catch (error) {
    logger.error('Photo processing failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Photo processing failed'
    });
  }
});

module.exports = { uploadTeacherPhoto };
