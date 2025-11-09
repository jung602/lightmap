"use client";

import { Suspense, useMemo, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Model } from "./Model";
import { ReflectTest } from "./ReflectTest";
import { Reflector } from "./Reflector";
import * as THREE from "three/webgpu";
import { useControls } from "leva";

// 카메라 전환을 위한 컴포넌트
function CameraController({ isPerspective }: { isPerspective: boolean }) {
  const { camera, gl, set } = useThree();
  
  useEffect(() => {
    if (isPerspective) {
      // Perspective 카메라로 전환
      const perspectiveCamera = new THREE.PerspectiveCamera(30, gl.domElement.width / gl.domElement.height, 0.01, 1000);
      perspectiveCamera.position.set(5, 5, -5);
      set({ camera: perspectiveCamera });
    } else {
      // Orthographic 카메라로 전환
      const aspect = gl.domElement.width / gl.domElement.height;
      const frustumSize = 150;
      const orthographicCamera = new THREE.OrthographicCamera(
        -frustumSize * aspect / 2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        -frustumSize / 2,
        0.01,
        1000
      );
      orthographicCamera.position.set(10, 10, -10);
      orthographicCamera.zoom = 25;
      set({ camera: orthographicCamera });
    }
  }, [isPerspective, gl, set]);
  
  return null;
}

export default function Scene() {
  // 통합 컨트롤: nightMix 값으로 다른 값들 자동 계산
  const { uNightMix, isPerspective } = useControls('Scene Settings', {
    uNightMix: { value: 0, min: 0, max: 1, step: 0.01, label: 'Night Mix' },
    isPerspective: { value: false, label: 'Perspective Camera' }
  })
  
  // nightMix에 따라 선형 보간 (lerp)
  const envIntensity = useMemo(() => {
    // nightMix 0 → 0.75, nightMix 1 → 0.25
    return 1 - (uNightMix * 0.75)
  }, [uNightMix])
  
  const floorOpacity = useMemo(() => {
    // nightMix 0 → 0.05, nightMix 1 → 0.15
    return 0.05 + (uNightMix * 0.1)
  }, [uNightMix])

  // 카메라 설정
  const cameraConfig = useMemo(() => {
    if (isPerspective) {
      return {
        orthographic: false,
        camera: {
          position: [5, 5, -5],
          fov: 45,
          near: 0.01,
          far: 1000
        }
      }
    } else {
      return {
        orthographic: true,
        camera: {
          position: [10, 10, -10],
          zoom: 150,
          near: 0.01,
          far: 1000
        }
      }
    }
  }, [isPerspective])

  return (
    <div className="w-screen h-screen">
      <Canvas 
        orthographic={!isPerspective}
        camera={cameraConfig.camera as any}
        gl={async (canvasProps) => {
          const renderer = new THREE.WebGPURenderer({
            canvas: canvasProps.canvas as HTMLCanvasElement,
            antialias: true
          });
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 1;
          await renderer.init();
          return renderer;
        }}
      >
        <CameraController isPerspective={isPerspective} />
        
        <color attach="background" args={["#111"]} />
        <Environment preset="city" environmentIntensity={envIntensity} />
        <Suspense fallback={null}>
          <Model nightMix={uNightMix} />
          <ReflectTest floorOpacity={floorOpacity} />
          <Reflector />
        </Suspense>

        <OrbitControls autoRotate={true} autoRotateSpeed={0.1} enableDamping makeDefault target={[0, 1.5, 0]} />

      </Canvas>
    </div>
  );
}
 

