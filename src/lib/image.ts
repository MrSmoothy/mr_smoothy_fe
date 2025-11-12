/**
 * Get image URL from MinIO or fallback to placeholder
 */
export function getImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return "/placeholder-image.png"; // คุณสามารถใส่ placeholder image ได้
  }

  // ถ้า URL เริ่มต้นด้วย http:// หรือ https:// แสดงว่าเป็น URL เต็มแล้ว
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // ถ้าเป็น path แบบ relative ให้รวมกับ MinIO endpoint
  // คุณสามารถปรับแต่งตาม configuration ของคุณ
  const minioBaseUrl = process.env.NEXT_PUBLIC_MINIO_URL || "http://localhost:9000";
  return `${minioBaseUrl}/${imageUrl}`;
}

/**
 * Check if image URL is valid MinIO URL
 */
export function isMinioUrl(url: string): boolean {
  const minioBaseUrl = process.env.NEXT_PUBLIC_MINIO_URL || "http://localhost:9000";
  return url.includes(minioBaseUrl) || url.includes("mr-smoothy-images");
}

