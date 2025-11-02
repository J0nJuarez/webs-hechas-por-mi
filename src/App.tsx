import { useEffect, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'
import './app.css'
import Boton from './componentes/boton'
import LiquidEther from './componentes/background/liquidBckg'
import Wrapper from './componentes/wrapper'

type Site = {
  id: string
  titulo: string
  descripcion: string
  logoUrl: string
  iframeUrl: string
}

const Screen: React.FC<{ url: string; fallbackUrl?: string }> = ({ url, fallbackUrl }) => {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const texRef = useRef<THREE.Texture | null>(null)

  useEffect(() => {
    let mounted = true
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.top = '-9999px'
    iframe.style.width = '1024px'
    iframe.style.height = '768px'
    iframe.sandbox.add('allow-scripts', 'allow-same-origin') 
    iframe.src = url
    document.body.appendChild(iframe)
    iframeRef.current = iframe

    const loadFallbackTexture = (fallback?: string) => {
      if (!fallback) return
      const loader = new THREE.TextureLoader()
      loader.load(
        fallback,
        (tex) => {
          if (!mounted) return
          tex.minFilter = THREE.LinearFilter
          tex.magFilter = THREE.LinearFilter
          tex.needsUpdate = true
          texRef.current = tex
          setTexture(tex)
        },
        undefined,
        () => {
          // ignore
        }
      )
    }

    const updateTexture = async () => {
      if (!iframeRef.current) return
      try {
        // html2canvas on iframe element — puede fallar por CORS en la mayoría de sitios externos
        const canvas = await html2canvas(iframeRef.current, { useCORS: true, logging: false })
        if (!mounted) return
        const newTexture = new THREE.CanvasTexture(canvas)
        newTexture.minFilter = THREE.LinearFilter
        newTexture.magFilter = THREE.LinearFilter
        newTexture.needsUpdate = true
        // dispose previous
        if (texRef.current && texRef.current !== newTexture) texRef.current.dispose()
        texRef.current = newTexture
        setTexture(newTexture)
      } catch (err) {
        // Si falla (tainted canvas por CORS), cargar fallback (logo) como textura
        if (mounted) loadFallbackTexture(fallbackUrl)
      }
    }

    // primera actualización tras cargar el iframe
    const onLoadHandler = () => {
      updateTexture()
    }
    iframe.addEventListener('load', onLoadHandler)

    // intentar actualizar periódicamente
    const interval = window.setInterval(updateTexture, 3000)

    // limpieza
    return () => {
      mounted = false
      iframe.removeEventListener('load', onLoadHandler)
      clearInterval(interval)
      if (iframe.parentElement) iframe.parentElement.removeChild(iframe)
      if (texRef.current) {
        texRef.current.dispose()
        texRef.current = null
      }
    }
  }, [url, fallbackUrl])

  return (
    <mesh position={[0.4, 0.8, -0.3]} rotation={[-0.2, 0, 0]}>
      <planeGeometry args={[0.8, 0.5]} />
      <meshBasicMaterial side={THREE.DoubleSide}>
        {texture && <primitive attach="map" object={texture} />}
      </meshBasicMaterial>
    </mesh>
  )
}

const Laptop: React.FC = () => {
  const [model, setModel] = useState<THREE.Group | null>(null)

  useEffect(() => {
    const loader = new GLTFLoader()
    loader.load('/model/laptop.glb', (gltf) => {
      const scene = gltf.scene
      scene.scale.set(5, 5, 5)
      scene.position.set(0, 0, 0)

      const box = new THREE.Box3().setFromObject(scene)
      const center = box.getCenter(new THREE.Vector3())
      scene.position.sub(center)

      scene.position.add(new THREE.Vector3(0.4, 0.3, -0.5))
      setModel(scene)
    })
  }, [])

  return model ? <primitive object={model} /> : null
}

const App: React.FC = () => {
const [sites, setSites] = useState<Site[]>([])
const [selectedIndex, setSelectedIndex] = useState(0)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  fetch('/data.json')
    // cambiar por
    .then(res => {
      if (!res.ok) throw new Error('Error al cargar los sitios')
      return res.json()
    })
    .then(data => {
      setSites(data)
      setSelectedIndex(0)
    })
    .catch(err => setError(err.message))
    .finally(() => setLoading(false))
}, [])


  if (loading) return <main className="app-container">Cargando sitios...</main>
  if (error) return <main className="app-container">Error: {error}</main>
  if (sites.length === 0) return <main className="app-container">No hay sitios disponibles</main>

  const selected = sites[selectedIndex]
  if (!selected) return null 

  return (
    <main className="app-container h-full">
      <div className="grid h-full grid-cols-4 grid-rows-4 gap-4">
        <div id="info" className="col-span-1 row-span-4">
          <Wrapper
            titulo={selected.titulo}
            descripcion={selected.descripcion}
            logoUrl={selected.logoUrl}
            tecnologias={['React', 'Three.js', 'TypeScript']}
            url={selected.iframeUrl}
          />
        </div>
        <div id="render" className="col-span-3 row-span-3">
          <LiquidEther
            colors={['#5227FF', '#FF9FFC', '#B19EEF']}
            mouseForce={20}
            cursorSize={100}
            isViscous={false}
            viscous={30}
            iterationsViscous={32}
            iterationsPoisson={32}
            resolution={0.2}
            isBounce={false}
            autoDemo={true}
            autoSpeed={0.5}
            autoIntensity={1.2}
            takeoverDuration={0.25}
            autoResumeDelay={3000}
            autoRampDuration={0.6}
          />
          <Canvas
            camera={{ position: [1, 1, 2], fov: 50 }}
            resize={{ scroll: true }}
            style={{ height: '100dvh', width: '100dvw', position: 'absolute', top: 0, left: 0 }}
          >
            <directionalLight position={[0.9, 4, 0.4]} intensity={5} color="#808080" />
            <OrbitControls enableZoom={true} enablePan={false} enableRotate={true} target={[0, 0, 0]} minDistance={2} maxDistance={10} />
            <Laptop />
            <Screen url={selected.iframeUrl} fallbackUrl={selected.logoUrl} />
          </Canvas>
        </div>
        <nav className="app-nav col-span-3 row-span-1">
            <div className="boton-list flex gap-2 items-center">
              {sites.map((site, i) => (
                <Boton
                  key={site.id}
                  logoUrl={site.logoUrl}
                  onClick={() => setSelectedIndex(i)}
                  aria-label={`Seleccionar ${site.titulo}`}
                />
              ))}
            </div>
         </nav>
      </div>
    </main>
  )
}

export default App