// Cloudinary gallery config
// Add your asset public IDs here (folder/filename without extension)
// Example: if your image is at farav/my-photo.jpg, the public ID is 'farav/my-photo'

export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  folder: 'farav',
};

// Add your assets here manually
// Type: 'image' or 'video'
// The gallery JS will try to auto-detect from Cloudinary API first,
// and fall back to this list if the API is not accessible
export const GALLERY_ASSETS = [
  // Example entries — replace with your actual assets:
  // { id: 'farav/photo1', type: 'image' },
  // { id: 'farav/photo2', type: 'image' },
  { id: 'farav-01', type: 'image' },
  { id: 'farav-02', type: 'image' },
  { id: 'farav-03', type: 'image' },
  { id: 'farav-04', type: 'image' },
  { id: 'farav-05', type: 'image' },
  { id: 'farav-06', type: 'image' },
  { id: 'farav-08', type: 'image' },
  // { id: 'farav_z5azr1', type: 'video' },



];
