import { useRef, useEffect, useMemo } from 'react'
import { extend, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Reflector as ThreeReflector } from 'three/examples/jsm/objects/Reflector.js'

type ReflectorProps = React.JSX.IntrinsicElements['group']

// Three.js 네임스페이스에 리플렉터 추가
extend({ ThreeReflector })

export function Reflector(props: ReflectorProps) {
  const groupRef = useRef<THREE.Group>(null)
  const reflectorsRef = useRef<THREE.Object3D[]>([])

  // scenes.ts의 첫 번째 씬 reflector 설정 참고
  const reflectorData = useMemo(() => [
    {
      // Plane 1 - 큰 거울 (벽면)
      position: [0, 1, 1.75] as [number, number, number],
      rotation: [-Math.PI / 1, 0, 0] as [number, number, number],
      args: [1.74, 1.96],
      color: "#a0a0a0",
      clipBias: 0.003,
      overlayOpacity: 0.5,
      overlayOffset: [0, 0, -0.01] as [number, number, number]
    },
    {
      // Plane 2 - 작은 거울
      position: [-1.16, 0.6, 1.64] as [number, number, number],
      rotation: [-Math.PI / 1.025, 0, 0] as [number, number, number],
      args: [.25, 1.11],
      clipBias: 0,
      color: "#aaaaaa",
      overlayOpacity: 0,
      overlayOffset: [0, 0, -0.01] as [number, number, number]
    }
  ], [])

  useEffect(() => {
    if (!groupRef.current) return

    // 기존 리플렉터와 오버레이 제거
    const existingObjects = groupRef.current.children.filter(
      child => child.userData.isReflector || child.userData.isReflectorOverlay
    )
    existingObjects.forEach(child => {
      groupRef.current?.remove(child)
      const mesh = child as THREE.Mesh
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m: THREE.Material) => m.dispose())
        } else {
          mesh.material.dispose()
        }
      }
      if (mesh.geometry) mesh.geometry.dispose()
    })

    reflectorsRef.current = []

    // 새로운 리플렉터 생성
    reflectorData.forEach((item, index) => {
      const geometry = new THREE.PlaneGeometry(item.args[0], item.args[1])
      
      const resolution = 1024
      const color = new THREE.Color(item.color)
      
      const reflector = new ThreeReflector(geometry, {
        clipBias: item.clipBias,
        textureWidth: resolution,
        textureHeight: resolution,
        color: color.getHex()
      })

      reflector.position.set(item.position[0], item.position[1], item.position[2])
      reflector.rotation.set(item.rotation[0], item.rotation[1], item.rotation[2])

      reflector.userData.isReflector = true
      reflector.castShadow = false
      reflector.receiveShadow = false

      // material 설정
      if (reflector.material) {
        const material = reflector.material as THREE.Material
        material.transparent = true
        material.opacity = 0.3
      }

      groupRef.current?.add(reflector)
      reflectorsRef.current.push(reflector)

      // 오버레이 생성 (어두운 효과)
      if (item.overlayOpacity > 0) {
        const overlayGeometry = geometry.clone()
        const overlayMaterial = new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: item.overlayOpacity,
          side: THREE.FrontSide
        })

        const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
        
        overlay.position.set(
          item.position[0] + item.overlayOffset[0],
          item.position[1] + item.overlayOffset[1],
          item.position[2] + item.overlayOffset[2]
        )
        overlay.rotation.set(item.rotation[0], item.rotation[1], item.rotation[2])

        overlay.userData.isReflectorOverlay = true
        overlay.castShadow = false
        overlay.receiveShadow = false

        groupRef.current?.add(overlay)
      }
    })

    return () => {
      // cleanup
    }
  }, [reflectorData])

  // 프레임마다 리플렉터 업데이트
  const frameCounterRef = useRef(0)
  useFrame(() => {
    if (reflectorsRef.current.length === 0) return
    
    // 성능을 위해 6프레임마다 업데이트
    frameCounterRef.current = (frameCounterRef.current + 1) % 6
    if (frameCounterRef.current !== 0) return
    
    reflectorsRef.current.forEach(reflector => {
      if (reflector && (reflector as any).needsUpdate !== undefined) {
        (reflector as any).needsUpdate = true
      }
    })
  })

  return <group ref={groupRef} {...props} />
}

