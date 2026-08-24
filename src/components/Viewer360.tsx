'use client'

/**
 * Dependency-free equirectangular (360°) viewer for images and video.
 *
 * Deliberately raw WebGL rather than three.js: the whole component is a few KB
 * against ~600KB for three, and Plotmarket's buyers are overwhelmingly on
 * metered Nigerian mobile data. Drag or swipe to look around, pinch or scroll
 * to zoom. Falls back to a flat <img>/<video> when WebGL is unavailable.
 */

import { useEffect, useRef, useState } from 'react'
import { Rotate3d, AlertCircle, Play } from 'lucide-react'

interface Viewer360Props {
  src: string
  type: 'image' | 'video'
  className?: string
}

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

// Ray-march free: for each screen pixel we build a view ray from yaw/pitch/fov,
// then convert that direction to equirectangular UVs.
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uYaw;
uniform float uPitch;
uniform float uFov;

const float PI = 3.14159265359;

void main() {
  vec2 ndc = (vUv * 2.0 - 1.0);
  ndc.x *= uRes.x / uRes.y;

  float f = 1.0 / tan(uFov * 0.5);
  vec3 dir = normalize(vec3(ndc.x, ndc.y, -f));

  float cp = cos(uPitch), sp = sin(uPitch);
  dir = vec3(dir.x, dir.y * cp - dir.z * sp, dir.y * sp + dir.z * cp);

  float cy = cos(uYaw), sy = sin(uYaw);
  dir = vec3(dir.x * cy + dir.z * sy, dir.y, -dir.x * sy + dir.z * cy);

  float u = atan(dir.x, -dir.z) / (2.0 * PI) + 0.5;
  float v = acos(clamp(dir.y, -1.0, 1.0)) / PI;

  gl_FragColor = texture2D(uTex, vec2(u, v));
}
`

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export function Viewer360({ src, type, className = '' }: Viewer360Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)

  // Camera state lives in refs so the render loop never restarts.
  const yaw = useRef(0)
  const pitch = useRef(0)
  const fov = useRef(Math.PI / 2)
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const pinchDist = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = (canvas.getContext('webgl', { alpha: false }) ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) {
      setFailed(true)
      return
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) {
      if (vs) gl.deleteShader(vs)
      if (fs) gl.deleteShader(fs)
      setFailed(true)
      return
    }

    const program = gl.createProgram()
    if (!program) {
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      setFailed(true)
      return
    }
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      setFailed(true)
      return
    }
    gl.useProgram(program)

    // Full-screen triangle pair
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    )
    const aPos = gl.getAttribLocation(program, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uTex = gl.getUniformLocation(program, 'uTex')
    const uRes = gl.getUniformLocation(program, 'uRes')
    const uYaw = gl.getUniformLocation(program, 'uYaw')
    const uPitch = gl.getUniformLocation(program, 'uPitch')
    const uFov = gl.getUniformLocation(program, 'uFov')

    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    // 1x1 placeholder so we can draw before the media decodes
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([20, 40, 30, 255])
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.uniform1i(uTex, 0)

    let source: HTMLImageElement | HTMLVideoElement | null = null
    let disposed = false
    let raf = 0

    const uploadTexture = () => {
      if (!source) return
      try {
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
      } catch {
        // Typically a cross-origin frame tainting the canvas. Fall back to flat.
        disposed = true
        setFailed(true)
      }
    }

    if (type === 'image') {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        if (disposed) return
        source = img
        uploadTexture()
        setReady(true)
      }
      img.onerror = () => !disposed && setFailed(true)
      img.src = src
    } else {
      const video = videoRef.current
      if (video) {
        video.crossOrigin = 'anonymous'
        video.onloadeddata = () => {
          if (disposed) return
          source = video
          // Push the first frame immediately. Without this the viewer shows a
          // flat placeholder colour until the visitor presses play.
          uploadTexture()
          setReady(true)
        }
        // A seek lands a new frame while paused, so it needs an upload too.
        video.onseeked = () => !disposed && uploadTexture()
        video.onplay = () => !disposed && setPlaying(true)
        video.onpause = () => !disposed && setPlaying(false)
        video.onerror = () => !disposed && setFailed(true)
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.floor(canvas.clientWidth * dpr)
      const h = Math.floor(canvas.clientHeight * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    const render = () => {
      if (disposed) return
      resize()
      // Video needs a fresh upload every frame while it is playing.
      if (type === 'video' && source && !(source as HTMLVideoElement).paused) {
        uploadTexture()
      }
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uYaw, yaw.current)
      gl.uniform1f(uPitch, pitch.current)
      gl.uniform1f(uFov, fov.current)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      gl.deleteTexture(texture)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
    }
  }, [src, type])

  // Wheel zoom needs a non-passive native listener. React attaches its own
  // wheel handler passively, so preventDefault there is ignored and the page
  // scrolls behind the viewer while the visitor is zooming.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || failed) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      fov.current = Math.max(0.5, Math.min(2.2, fov.current + e.deltaY * 0.001))
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [failed])

  // ---- pointer / touch controls -------------------------------------------
  const clampPitch = (p: number) => Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, p))

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragging.current = true
    last.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current) return
    const dx = e.clientX - last.current.x
    const dy = e.clientY - last.current.y
    last.current = { x: e.clientX, y: e.clientY }
    const speed = fov.current / 600
    // Drag moves the scene with the finger on both axes, as Street View does.
    yaw.current += dx * speed
    pitch.current = clampPitch(pitch.current + dy * speed)
  }

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragging.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const onTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 2) return
    const [a, b] = [e.touches[0], e.touches[1]]
    const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
    if (pinchDist.current !== null) {
      fov.current = Math.max(0.5, Math.min(2.2, fov.current - (dist - pinchDist.current) * 0.004))
    }
    pinchDist.current = dist
  }

  const onTouchEnd = () => {
    pinchDist.current = null
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      // The play/pause listeners set `playing`, so a rejected play() leaves the
      // button showing the truth rather than a state that never happened.
      video.play().catch(() => setPlaying(false))
    } else {
      video.pause()
    }
  }

  // ---- fallback ------------------------------------------------------------
  if (failed) {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-gray-900 ${className}`}>
        {type === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="360° property view" className="h-full w-full object-cover" />
        ) : (
          <video src={src} controls playsInline className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-black/70 px-3 py-2 text-xs text-white">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Your browser cannot display the 360° view. Showing the flat version.
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gray-900 ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
      />

      {/*
        Kept in the layout rather than display:none — several browsers refuse to
        decode frames for a fully hidden video, which would freeze the texture.
      */}
      {type === 'video' && (
        <video
          ref={videoRef}
          src={src}
          playsInline
          loop
          muted
          preload="auto"
          aria-hidden="true"
          className="pointer-events-none absolute h-px w-px opacity-0"
        />
      )}

      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white">
        <Rotate3d className="h-3.5 w-3.5" />
        360° view
      </div>

      {type === 'video' && ready && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-black/80"
        >
          <Play className="h-3.5 w-3.5" />
          {playing ? 'Pause tour' : 'Play tour'}
        </button>
      )}

      <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white">
        Drag to look around
      </div>

      {!ready && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-white/70">Loading 360° view…</span>
        </div>
      )}
    </div>
  )
}
