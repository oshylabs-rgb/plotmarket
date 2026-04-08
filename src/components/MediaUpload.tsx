'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, GripVertical, Image, Film, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface MediaFile {
  id: string
  file: File
  preview: string
  type: 'image' | 'video'
  progress: number
  uploaded: boolean
  url?: string
  error?: string
}

interface MediaUploadProps {
  userId: string
  propertyId: string
  onUploadComplete: (images: string[], videos: string[]) => void
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const VIDEO_TYPES = ['video/mp4', 'video/webm']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_IMAGES = 10
const MAX_VIDEOS = 2

export function MediaUpload({ userId, propertyId, onUploadComplete }: MediaUploadProps) {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  const imageCount = files.filter((f) => f.type === 'image').length
  const videoCount = files.filter((f) => f.type === 'video').length

  const validateFile = useCallback(
    (file: File): string | null => {
      const isImage = IMAGE_TYPES.includes(file.type)
      const isVideo = VIDEO_TYPES.includes(file.type)

      if (!isImage && !isVideo) {
        return `${file.name}: Unsupported format. Use JPG, PNG, WebP, MP4, or WebM.`
      }

      if (isImage && file.size > MAX_IMAGE_SIZE) {
        return `${file.name}: Image must be under 5MB.`
      }

      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        return `${file.name}: Video must be under 50MB.`
      }

      if (isImage && imageCount >= MAX_IMAGES) {
        return `Maximum ${MAX_IMAGES} images allowed.`
      }

      if (isVideo && videoCount >= MAX_VIDEOS) {
        return `Maximum ${MAX_VIDEOS} videos allowed.`
      }

      return null
    },
    [imageCount, videoCount]
  )

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      setError('')
      const filesToAdd: MediaFile[] = []
      let currentImages = imageCount
      let currentVideos = videoCount

      for (const file of Array.from(newFiles)) {
        const isImage = IMAGE_TYPES.includes(file.type)
        const isVideo = VIDEO_TYPES.includes(file.type)

        if (!isImage && !isVideo) {
          setError(`${file.name}: Unsupported format.`)
          continue
        }

        if (isImage && file.size > MAX_IMAGE_SIZE) {
          setError(`${file.name}: Image must be under 5MB.`)
          continue
        }

        if (isVideo && file.size > MAX_VIDEO_SIZE) {
          setError(`${file.name}: Video must be under 50MB.`)
          continue
        }

        if (isImage && currentImages >= MAX_IMAGES) {
          setError(`Maximum ${MAX_IMAGES} images allowed.`)
          continue
        }

        if (isVideo && currentVideos >= MAX_VIDEOS) {
          setError(`Maximum ${MAX_VIDEOS} videos allowed.`)
          continue
        }

        if (isImage) currentImages++
        if (isVideo) currentVideos++

        filesToAdd.push({
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
          type: isImage ? 'image' : 'video',
          progress: 0,
          uploaded: false,
        })
      }

      if (filesToAdd.length > 0) {
        setFiles((prev) => [...prev, ...filesToAdd])
      }
    },
    [imageCount, videoCount]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files)
      }
    },
    [addFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id)
      if (file) URL.revokeObjectURL(file.preview)
      return prev.filter((f) => f.id !== id)
    })
  }, [])

  const handleDragStart = (index: number) => {
    dragItem.current = index
  }

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index
  }

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return
    const items = [...files]
    const draggedItem = items[dragItem.current]
    items.splice(dragItem.current, 1)
    items.splice(dragOverItem.current, 0, draggedItem)
    dragItem.current = null
    dragOverItem.current = null
    setFiles(items)
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)
    setError('')
    const supabase = createClient()
    const updatedFiles = [...files]

    for (let i = 0; i < updatedFiles.length; i++) {
      const mediaFile = updatedFiles[i]
      if (mediaFile.uploaded) continue

      const ext = mediaFile.file.name.split('.').pop()
      const fileName = `${Date.now()}-${i}.${ext}`
      const filePath = `${userId}/${propertyId}/${fileName}`

      // Simulate progress
      updatedFiles[i] = { ...updatedFiles[i], progress: 30 }
      setFiles([...updatedFiles])

      const { data, error: uploadError } = await supabase.storage
        .from('property-media')
        .upload(filePath, mediaFile.file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        updatedFiles[i] = { ...updatedFiles[i], progress: 0, error: uploadError.message }
        setFiles([...updatedFiles])
        continue
      }

      updatedFiles[i] = { ...updatedFiles[i], progress: 80 }
      setFiles([...updatedFiles])

      const {
        data: { publicUrl },
      } = supabase.storage.from('property-media').getPublicUrl(filePath)

      updatedFiles[i] = {
        ...updatedFiles[i],
        progress: 100,
        uploaded: true,
        url: publicUrl,
      }
      setFiles([...updatedFiles])
    }

    const imageUrls = updatedFiles.filter((f) => f.type === 'image' && f.url).map((f) => f.url!)
    const videoUrls = updatedFiles.filter((f) => f.type === 'video' && f.url).map((f) => f.url!)

    onUploadComplete(imageUrls, videoUrls)
    setUploading(false)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          dragOver
            ? 'border-brand-green-400 bg-brand-green-50'
            : 'border-brand-cream-400 bg-brand-cream-50 hover:border-brand-green-300 hover:bg-brand-green-50/50'
        }`}
      >
        <Upload
          className={`mx-auto h-10 w-10 ${dragOver ? 'text-brand-green-500' : 'text-gray-400'}`}
        />
        <p className="mt-3 text-sm font-medium text-gray-700">
          Drag & drop images or videos here
        </p>
        <p className="mt-1 text-xs text-gray-500">
          or click to browse files
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Image className="h-3 w-3" />
            JPG, PNG, WebP (max 5MB)
          </span>
          <span className="flex items-center gap-1">
            <Film className="h-3 w-3" />
            MP4, WebM (max 50MB)
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Up to {MAX_IMAGES} images + {MAX_VIDEOS} videos
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,.mp4,.webm"
        onChange={(e) => e.target.files && addFiles(e.target.files)}
        className="hidden"
      />

      {/* File previews */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              {imageCount} image{imageCount !== 1 ? 's' : ''}, {videoCount} video
              {videoCount !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-gray-400">Drag to reorder. First image = cover photo.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {files.map((mediaFile, index) => (
              <div
                key={mediaFile.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`group relative overflow-hidden rounded-lg border ${
                  index === 0
                    ? 'border-brand-green-400 ring-2 ring-brand-green-200'
                    : 'border-brand-cream-300'
                } bg-white`}
              >
                {/* Preview */}
                <div className="relative aspect-square">
                  {mediaFile.type === 'image' ? (
                    <img
                      src={mediaFile.preview}
                      alt={`Preview ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      src={mediaFile.preview}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                    />
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/30" />

                  {/* Drag handle */}
                  <div className="absolute left-1.5 top-1.5 cursor-grab rounded bg-black/50 p-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <GripVertical className="h-3.5 w-3.5 text-white" />
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(mediaFile.id)
                    }}
                    className="absolute right-1.5 top-1.5 rounded-full bg-red-500 p-0.5 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>

                  {/* Cover badge */}
                  {index === 0 && mediaFile.type === 'image' && (
                    <div className="absolute bottom-1.5 left-1.5 rounded bg-brand-green-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      Cover
                    </div>
                  )}

                  {/* Video badge */}
                  {mediaFile.type === 'video' && (
                    <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      <Film className="h-3 w-3" />
                      Video
                    </div>
                  )}

                  {/* Upload progress */}
                  {mediaFile.progress > 0 && !mediaFile.uploaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-white" />
                        <p className="mt-1 text-xs text-white">{mediaFile.progress}%</p>
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {mediaFile.error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/80">
                      <div className="text-center px-2">
                        <AlertCircle className="mx-auto h-5 w-5 text-white" />
                        <p className="mt-1 text-[10px] text-white">{mediaFile.error}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* File info */}
                <div className="px-2 py-1.5">
                  <p className="truncate text-[11px] text-gray-600">{mediaFile.file.name}</p>
                  <p className="text-[10px] text-gray-400">{formatSize(mediaFile.file.size)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Upload button */}
          <button
            type="button"
            onClick={uploadFiles}
            disabled={uploading || files.every((f) => f.uploaded)}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </span>
            ) : files.every((f) => f.uploaded) ? (
              'All files uploaded'
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload {files.filter((f) => !f.uploaded).length} file
                {files.filter((f) => !f.uploaded).length !== 1 ? 's' : ''}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
