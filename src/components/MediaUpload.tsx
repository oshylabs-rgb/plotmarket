'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Upload,
  X,
  GripVertical,
  Image as ImageIcon,
  Film,
  Loader2,
  AlertCircle,
  Rotate3d,
  CheckCircle2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface MediaFile {
  id: string
  file: File
  preview: string
  type: 'image' | 'video'
  is360: boolean
  progress: number
  uploaded: boolean
  url?: string
  error?: string
}

export interface MediaUploadResult {
  images: string[]
  videos: string[]
  images360: string[]
  videos360: string[]
}

interface MediaUploadProps {
  userId: string
  propertyId: string
  onChange: (result: MediaUploadResult) => void
  /** Raised while any file is still uploading so the parent can block submit. */
  onBusyChange?: (busy: boolean) => void
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const VIDEO_TYPES = ['video/mp4', 'video/webm']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB — 360° stills are large
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_IMAGES = 20
const MAX_VIDEOS = 4

/**
 * A 360° equirectangular still is always 2:1. We use that to auto-detect
 * panoramas on add, so sellers rarely have to tick the box themselves.
 */
function detectEquirectangular(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    if (!IMAGE_TYPES.includes(file.type)) {
      resolve(false)
      return
    }
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const ratio = img.width / img.height
      URL.revokeObjectURL(url)
      // Allow a little tolerance around exactly 2.0
      resolve(ratio > 1.95 && ratio < 2.05 && img.width >= 2000)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(false)
    }
    img.src = url
  })
}

export function MediaUpload({ userId, propertyId, onChange, onBusyChange }: MediaUploadProps) {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)
  const queueRef = useRef<Promise<void>>(Promise.resolve())

  const imageCount = files.filter((f) => f.type === 'image').length
  const videoCount = files.filter((f) => f.type === 'video').length
  const pendingCount = files.filter((f) => !f.uploaded && !f.error).length

  // Publish the current URL sets upward whenever anything settles.
  useEffect(() => {
    const done = files.filter((f) => f.uploaded && f.url)
    onChange({
      images: done.filter((f) => f.type === 'image' && !f.is360).map((f) => f.url!),
      videos: done.filter((f) => f.type === 'video' && !f.is360).map((f) => f.url!),
      images360: done.filter((f) => f.type === 'image' && f.is360).map((f) => f.url!),
      videos360: done.filter((f) => f.type === 'video' && f.is360).map((f) => f.url!),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files])

  useEffect(() => {
    onBusyChange?.(uploading || pendingCount > 0)
  }, [uploading, pendingCount, onBusyChange])

  const uploadOne = useCallback(
    async (target: MediaFile) => {
      const supabase = createClient()
      const ext = target.file.name.split('.').pop()?.toLowerCase() || 'bin'
      const filePath = `${userId}/${propertyId}/${target.id}.${ext}`

      setFiles((prev) => prev.map((f) => (f.id === target.id ? { ...f, progress: 25 } : f)))

      const { error: uploadError } = await supabase.storage
        .from('property-media')
        .upload(filePath, target.file, { cacheControl: '3600', upsert: false })

      if (uploadError) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === target.id ? { ...f, progress: 0, error: uploadError.message } : f
          )
        )
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('property-media').getPublicUrl(filePath)

      setFiles((prev) =>
        prev.map((f) =>
          f.id === target.id
            ? { ...f, progress: 100, uploaded: true, url: publicUrl, error: undefined }
            : f
        )
      )
    },
    [userId, propertyId]
  )

  /** Uploads run in a serial queue so slow connections do not thrash. */
  const enqueue = useCallback(
    (targets: MediaFile[]) => {
      setUploading(true)
      queueRef.current = queueRef.current.then(async () => {
        for (const target of targets) {
          await uploadOne(target)
        }
        setUploading(false)
      })
    },
    [uploadOne]
  )

  const addFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      setError('')
      const filesToAdd: MediaFile[] = []
      let currentImages = imageCount
      let currentVideos = videoCount

      for (const file of Array.from(newFiles)) {
        const isImage = IMAGE_TYPES.includes(file.type)
        const isVideo = VIDEO_TYPES.includes(file.type)

        if (!isImage && !isVideo) {
          setError(`${file.name}: unsupported format. Use JPG, PNG, WebP, MP4 or WebM.`)
          continue
        }
        if (isImage && file.size > MAX_IMAGE_SIZE) {
          setError(`${file.name}: image must be under 10MB.`)
          continue
        }
        if (isVideo && file.size > MAX_VIDEO_SIZE) {
          setError(`${file.name}: video must be under 50MB.`)
          continue
        }
        if (isImage && currentImages >= MAX_IMAGES) {
          setError(`Maximum ${MAX_IMAGES} images.`)
          continue
        }
        if (isVideo && currentVideos >= MAX_VIDEOS) {
          setError(`Maximum ${MAX_VIDEOS} videos.`)
          continue
        }

        if (isImage) currentImages++
        if (isVideo) currentVideos++

        filesToAdd.push({
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
          type: isImage ? 'image' : 'video',
          is360: isImage ? await detectEquirectangular(file) : false,
          progress: 0,
          uploaded: false,
        })
      }

      if (filesToAdd.length > 0) {
        setFiles((prev) => [...prev, ...filesToAdd])
        enqueue(filesToAdd)
      }
    },
    [imageCount, videoCount, enqueue]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (e.dataTransfer.files.length > 0) void addFiles(e.dataTransfer.files)
    },
    [addFiles]
  )

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id)
      if (file) URL.revokeObjectURL(file.preview)
      return prev.filter((f) => f.id !== id)
    })
  }, [])

  const toggle360 = useCallback((id: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, is360: !f.is360 } : f)))
  }, [])

  const retry = useCallback(
    (id: string) => {
      const target = files.find((f) => f.id === id)
      if (!target) return
      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, error: undefined } : f)))
      enqueue([target])
    },
    [files, enqueue]
  )

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return
    const items = [...files]
    const dragged = items[dragItem.current]
    items.splice(dragItem.current, 1)
    items.splice(dragOverItem.current, 0, dragged)
    dragItem.current = null
    dragOverItem.current = null
    setFiles(items)
  }

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(0)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

  const count360 = files.filter((f) => f.is360).length

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setDragOver(false)
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          dragOver
            ? 'border-brand-green-400 bg-brand-green-50'
            : 'border-brand-cream-400 bg-brand-cream-50 hover:border-brand-green-300 hover:bg-brand-green-50/50'
        }`}
      >
        <Upload className={`mx-auto h-10 w-10 ${dragOver ? 'text-brand-green-500' : 'text-gray-400'}`} />
        <p className="mt-3 text-sm font-medium text-gray-700">
          Tap to add photos and videos
        </p>
        <p className="mt-1 text-xs text-gray-500">Uploads start automatically</p>
        <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <ImageIcon className="h-3 w-3" />
            JPG, PNG, WebP up to 10MB
          </span>
          <span className="flex items-center gap-1">
            <Film className="h-3 w-3" />
            MP4, WebM up to 50MB
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Up to {MAX_IMAGES} images and {MAX_VIDEOS} videos
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-brand-green-50 px-4 py-3 text-xs text-brand-green-700">
        <Rotate3d className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <strong className="font-semibold">Got a 360° photo or video?</strong> Upload it and tick
          the 360° badge on it. Buyers can then look around the property from their phone. Most
          phones shoot these in Panorama or 360 mode, and any 360 camera export works.
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,.mp4,.webm"
        onChange={(e) => e.target.files && void addFiles(e.target.files)}
        className="hidden"
      />

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-700">
              {imageCount} image{imageCount !== 1 ? 's' : ''}, {videoCount} video
              {videoCount !== 1 ? 's' : ''}
              {count360 > 0 && (
                <span className="ml-2 text-brand-green-600">({count360} in 360°)</span>
              )}
            </p>
            <p className="text-xs text-gray-400">Drag to reorder. First photo is the cover.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {files.map((mediaFile, index) => (
              <div
                key={mediaFile.id}
                draggable
                onDragStart={() => (dragItem.current = index)}
                onDragEnter={() => (dragOverItem.current = index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`group relative overflow-hidden rounded-lg border bg-white ${
                  index === 0
                    ? 'border-brand-green-400 ring-2 ring-brand-green-200'
                    : 'border-brand-cream-300'
                }`}
              >
                <div className="relative aspect-square">
                  {mediaFile.type === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaFile.preview}
                      alt={`Preview ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <video src={mediaFile.preview} className="h-full w-full object-cover" muted playsInline />
                  )}

                  <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/20" />

                  <div className="absolute left-1.5 top-1.5 cursor-grab rounded bg-black/50 p-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <GripVertical className="h-3.5 w-3.5 text-white" />
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(mediaFile.id)
                    }}
                    aria-label="Remove file"
                    className="absolute right-1.5 top-1.5 rounded-full bg-red-500 p-0.5 text-white transition-opacity hover:bg-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>

                  {/* 360 toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggle360(mediaFile.id)
                    }}
                    aria-pressed={mediaFile.is360}
                    className={`absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                      mediaFile.is360
                        ? 'bg-brand-green-600 text-white'
                        : 'bg-black/60 text-white/80 hover:bg-black/80'
                    }`}
                  >
                    <Rotate3d className="h-3 w-3" />
                    360°
                  </button>

                  {index === 0 && mediaFile.type === 'image' && !mediaFile.is360 && (
                    <div className="absolute bottom-1.5 left-1.5 rounded bg-brand-green-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      Cover
                    </div>
                  )}

                  {mediaFile.type === 'video' && (
                    <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      <Film className="h-3 w-3" />
                      Video
                    </div>
                  )}

                  {mediaFile.progress > 0 && !mediaFile.uploaded && !mediaFile.error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}

                  {mediaFile.uploaded && (
                    <div className="absolute right-1.5 top-8 rounded-full bg-brand-green-600 p-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}

                  {mediaFile.error && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        retry(mediaFile.id)
                      }}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/85 px-2 text-white"
                    >
                      <AlertCircle className="h-5 w-5" />
                      <span className="mt-1 text-[10px] leading-tight">Upload failed</span>
                      <span className="mt-0.5 text-[10px] font-semibold underline">Tap to retry</span>
                    </button>
                  )}
                </div>

                <div className="px-2 py-1.5">
                  <p className="truncate text-[11px] text-gray-600">{mediaFile.file.name}</p>
                  <p className="text-[10px] text-gray-400">{formatSize(mediaFile.file.size)}</p>
                </div>
              </div>
            ))}
          </div>

          {pendingCount > 0 ? (
            <p className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading {pendingCount} file{pendingCount !== 1 ? 's' : ''}. You can keep filling in
              the form.
            </p>
          ) : (
            <p className="flex items-center gap-2 text-sm text-brand-green-600">
              <CheckCircle2 className="h-4 w-4" />
              All media uploaded.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
