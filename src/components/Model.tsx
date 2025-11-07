import * as THREE from 'three'
import React from 'react'
import { useGLTF } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

type ModelProps = React.JSX.IntrinsicElements['group']

export function Model(props: ModelProps) {
  const { scene } = useGLTF('/gltf/test.gltf')
  const lightMap = useLoader(RGBELoader, '/gltf/texture/lightmap.hdr')
  
  lightMap.flipY = false
  lightMap.colorSpace = THREE.NoColorSpace
  lightMap.channel = 1 // TEXCOORD_1 (uv2) 사용

  scene.traverse((o) => {
    if ((o as any).isMesh) {
      const mesh = o as THREE.Mesh
      const g = mesh.geometry as THREE.BufferGeometry

      // 스무스 쉐이딩을 위한 vertex normals 재계산
      g.computeVertexNormals()

      // uv2가 없고 uv가 있으면 uv를 uv2로 복사
      if (!g.getAttribute('uv2') && g.getAttribute('uv')) {
        g.setAttribute('uv2', new THREE.BufferAttribute(g.getAttribute('uv').array, 2))
      }

      const apply = (mat: THREE.Material) => {
        if ((mat as any).isMeshStandardMaterial) {
          const m = mat as THREE.MeshStandardMaterial
          // GLTF의 원래 emissive, roughness, metallic 맵은 그대로 유지
          // lightmap만 추가로 적용
          m.lightMap = lightMap
          m.lightMapIntensity = 1.0
          m.flatShading = false // 스무스 쉐이딩 활성화
        }
      }
      
      Array.isArray(mesh.material) ? mesh.material.forEach(apply) : apply(mesh.material as THREE.Material)
    }
  })

  return <primitive object={scene} {...props} />
}

useGLTF.preload('/gltf/test.gltf')
useLoader.preload(RGBELoader, '/gltf/texture/lightmap.hdr')
