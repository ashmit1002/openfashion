# Mobile Image Upload Functionality

This document explains the mobile image upload functionality implemented in the OpenFashion app.

## Overview

The mobile image upload feature allows users on mobile devices to either:
1. **Take a new photo** using their device's camera
2. **Select an existing photo** from their camera roll/photo library

## Components

### 1. MobileImageUpload Component
Located at `frontend/components/ui/MobileImageUpload.tsx`

This is a reusable component that provides mobile-friendly image upload functionality:

```tsx
<MobileImageUpload
  onImageSelect={(file) => handleFile(file)}
  disabled={false}
  className="mb-4"
>
  Upload Image
</MobileImageUpload>
```

**Props:**
- `onImageSelect`: Callback function that receives the selected File object
- `disabled`: Whether the upload is disabled
- `className`: Additional CSS classes
- `children`: Text to display on the upload button
- `showPreview`: Whether to show image preview mode
- `previewUrl`: URL of the image to preview
- `onPreviewClick`: Callback when preview is clicked

### 2. Mobile Detection Hook
Located at `frontend/lib/hooks.ts`

The `useMobileDetection()` hook detects if the user is on a mobile device:

```tsx
const isMobile = useMobileDetection()
```

This hook:
- Detects mobile devices using user agent strings
- Detects touch devices
- Updates state when window is resized
- Returns a boolean indicating if the device is mobile

## How It Works

### Mobile Detection
The app detects mobile devices using:
1. **User Agent Detection**: Checks for mobile device strings (Android, iOS, etc.)
2. **Touch Detection**: Checks for touch capabilities
3. **Responsive Updates**: Listens for window resize events

### File Input Behavior
On mobile devices, the component renders two separate file inputs:

1. **"Take Photo" Button**:
   ```html
   <input type="file" accept="image/*" capture="environment" />
   ```
   - Uses `capture="environment"` to open the camera
   - Allows users to take a new photo

2. **"Choose Photo" Button**:
   ```html
   <input type="file" accept="image/*" />
   ```
   - Opens the photo library/camera roll
   - Allows users to select existing photos

### Desktop Fallback
On desktop devices, it renders a single upload button without the `capture` attribute.

## Implementation Examples

### Basic Usage
```tsx
import MobileImageUpload from "@/components/ui/MobileImageUpload"

function MyComponent() {
  const handleImageSelect = (file: File) => {
    // Handle the selected image file
    console.log('Selected file:', file)
  }

  return (
    <MobileImageUpload onImageSelect={handleImageSelect}>
      Upload Image
    </MobileImageUpload>
  )
}
```

### With Preview
```tsx
<MobileImageUpload
  onImageSelect={handleImageSelect}
  showPreview={true}
  previewUrl={imageUrl}
  onPreviewClick={() => setImageUrl(null)}
  className="w-full h-full"
/>
```

## Browser Support

### Mobile Browsers
- **iOS Safari**: ✅ Full support
- **Android Chrome**: ✅ Full support
- **Android Firefox**: ✅ Full support
- **Samsung Internet**: ✅ Full support

### Desktop Browsers
- **Chrome**: ✅ Standard file input
- **Firefox**: ✅ Standard file input
- **Safari**: ✅ Standard file input
- **Edge**: ✅ Standard file input

## Permissions

On mobile devices, users will be prompted for:
1. **Camera Permission**: When using "Take Photo"
2. **Photo Library Permission**: When using "Choose Photo"

The permission prompts are handled by the browser and operating system.

## Security Considerations

- File inputs are restricted to `accept="image/*"` for security
- No direct access to device camera or photo library
- All file handling goes through standard browser APIs
- File size and type validation should be implemented in the `onImageSelect` callback

## Troubleshooting

### Common Issues

1. **Camera not opening on iOS**:
   - Ensure the site is served over HTTPS
   - Check that camera permissions are granted

2. **Photo library not accessible**:
   - Check photo library permissions
   - Ensure the site is served over HTTPS

3. **File input not working**:
   - Verify the component is properly imported
   - Check that the `onImageSelect` callback is defined

### Debug Mode
To debug mobile detection, you can log the mobile state:

```tsx
const isMobile = useMobileDetection()
console.log('Is mobile device:', isMobile)
```

## Future Enhancements

Potential improvements:
1. **Multiple file selection** for batch uploads
2. **Image compression** before upload
3. **Drag and drop** support for desktop
4. **Progress indicators** for large files
5. **Image editing** capabilities before upload 