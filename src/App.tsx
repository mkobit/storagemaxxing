import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { initDb, incrementVisits, getVisitCount } from './db'

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [visitCount, setVisitCount] = useState<number | null>(null)

  useEffect(() => {
    initDb()
      .then(incrementVisits)
      .then(getVisitCount)
      .then(setVisitCount)
      .catch(console.error)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(0, 0, 4)

    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
    const material = new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.3, metalness: 0.6 })
    const cube = new THREE.Mesh(geometry, material)
    scene.add(cube)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
    dirLight.position.set(5, 8, 5)
    scene.add(dirLight)

    let frameId: number

    const animate = () => {
      frameId = requestAnimationFrame(animate)
      cube.rotation.x += 0.005
      cube.rotation.y += 0.008
      renderer.render(scene, camera)
    }

    animate()

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          fontFamily: 'monospace',
          color: '#f0f0f0',
          userSelect: 'none',
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>storagemaxxing</div>
        {visitCount !== null && (
          <div style={{ fontSize: 14, opacity: 0.6 }}>visit #{visitCount} (IndexedDB)</div>
        )}
      </div>
    </div>
  )
}
