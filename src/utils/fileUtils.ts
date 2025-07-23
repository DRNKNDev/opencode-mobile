// Extract filename from full path
export const getFileName = (fullPath: string): string => {
  if (!fullPath) return 'Unknown file'
  return fullPath.split('/').pop() || fullPath
}

// Check if MIME type is an image
export const isImageMimeType = (mime?: string): boolean => {
  if (!mime) return false
  return [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ].includes(mime.toLowerCase())
}
