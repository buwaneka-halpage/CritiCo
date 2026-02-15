'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const particleVertexShader = `
  attribute float aScale;
  attribute vec3 aRandomness;
  
  uniform float uTime;
  uniform float uSize;
  
  varying vec3 vColor;
  
  void main() {
    vec3 pos = position;
    
    // Animate particles
    pos.x += sin(uTime + aRandomness.x * 10.0) * 0.3;
    pos.y += cos(uTime + aRandomness.y * 10.0) * 0.3;
    pos.z += sin(uTime * 0.5 + aRandomness.z * 10.0) * 0.3;
    
    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    
    gl_Position = projectedPosition;
    
    // Size based on distance
    gl_PointSize = uSize * aScale * (1.0 / -viewPosition.z);
    
    // Color based on position
    float colorMix = (pos.y + 1.5) / 3.0;
    vColor = mix(vec3(0.231, 0.510, 0.965), vec3(0.937, 0.267, 0.267), colorMix);
  }
`

const particleFragmentShader = `
  varying vec3 vColor;
  
  void main() {
    // Circular particle
    float distanceToCenter = length(gl_PointCoord - vec2(0.5));
    if (distanceToCenter > 0.5) discard;
    
    // Soft edge
    float alpha = 1.0 - smoothstep(0.3, 0.5, distanceToCenter);
    
    // Glow effect
    vec3 glow = vColor * (1.0 - distanceToCenter * 2.0);
    
    gl_FragColor = vec4(vColor + glow * 0.5, alpha * 0.6);
  }
`

export function ParticleField() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.z = 3

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(1)
    containerRef.current.appendChild(renderer.domElement)

    // Particle count (reduced for performance)
    const count = 800

    // Geometry
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const scales = new Float32Array(count)
    const randomness = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      
      // Spread particles in 3D space
      positions[i3] = (Math.random() - 0.5) * 8
      positions[i3 + 1] = (Math.random() - 0.5) * 8
      positions[i3 + 2] = (Math.random() - 0.5) * 8
      
      scales[i] = Math.random() * 0.5 + 0.5
      
      randomness[i3] = Math.random()
      randomness[i3 + 1] = Math.random()
      randomness[i3 + 2] = Math.random()
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3))

    // Material
    const material = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 30 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    // Points
    const points = new THREE.Points(geometry, material)
    scene.add(points)

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    // Animation loop (throttled to ~30fps)
    let animationId: number
    const clock = new THREE.Clock()
    let lastFrame = 0
    const frameInterval = 1000 / 30

    const animate = (time: number) => {
      animationId = requestAnimationFrame(animate)

      if (time - lastFrame < frameInterval) return
      lastFrame = time

      const elapsedTime = clock.getElapsedTime()
      material.uniforms.uTime.value = elapsedTime

      // Rotate particle field
      points.rotation.x = elapsedTime * 0.02
      points.rotation.y = elapsedTime * 0.03

      renderer.render(scene, camera)
    }

    animate(0)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 opacity-15 pointer-events-none"
    />
  )
}
