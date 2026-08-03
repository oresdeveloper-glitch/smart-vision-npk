const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImage(file: File): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file format "${ext}". Please upload a JPG, JPEG, or PNG image.`,
    };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported image type "${file.type}". Please upload a JPG, JPEG, or PNG image.`,
    };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum size is ${MAX_SIZE_MB}MB.`,
    };
  }

  return { valid: true };
}

export function getFileExtension(filename: string): string {
  return '.' + (filename.split('.').pop()?.toLowerCase() || 'jpg');
}
