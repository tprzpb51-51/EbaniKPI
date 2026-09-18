const { v2: cloudinary } = require('cloudinary');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

const uploadImage = (buffer, folder) => {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary не налаштовано');
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', quality: 'auto', fetch_format: 'auto' },
      (error, result) => error ? reject(error) : resolve(result.secure_url)
    );
    stream.end(buffer);
  });
};

module.exports = { uploadImage };