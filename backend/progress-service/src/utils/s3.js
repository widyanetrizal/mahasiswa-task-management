const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const path = require("path");


const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});

async function uploadFileToS3(file) {
    const safeName = file.originalname.replace(/\s+/g, "_");
  const key = `progress/${Date.now()}_${safeName}`;
  
  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    // ACL: "public-read"
    ContentDisposition: `inline; filename="${safeName}"`
  }));

  // public URL (virtual-hosted style)
  const publicUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodeURIComponent(key)}`;

  return { key, publicUrl };
}

/**
 * Hapus file dari S3
 * @param {string} key - nama file di S3
 */
const deleteFileFromS3 = async (key) => {
  if (!key) return;
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
      })
    );
    console.log(`✅ File ${key} berhasil dihapus dari S3`);
  } catch (error) {
    console.error(`❌ Gagal menghapus file ${key} dari S3:`, error.message);
  }
};

// async function getFileUrlFromS3(key) {
//   const command = new GetObjectCommand({
//     Bucket: process.env.AWS_S3_BUCKET,
//     Key: key,
//   });
//   return await getSignedUrl(s3, command, { expiresIn: 3600 }); // Link berlaku 1 jam
// }

module.exports = { 
    uploadFileToS3, 
    deleteFileFromS3 
};
