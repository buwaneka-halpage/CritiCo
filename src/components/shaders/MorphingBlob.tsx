'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// Vertex shader for morphing blob
const blobVertexShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  
  // Simplex noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  void main() {
    vUv = uv;
    vNormal = normal;
    vPosition = position;
    
    vec3 pos = position;
    
    // Apply noise-based displacement
    float noise = snoise(pos * 1.5 + uTime * 0.3) * 0.3;
    noise += snoise(pos * 3.0 + uTime * 0.5) * 0.15;
    noise += snoise(pos * 6.0 + uTime * 0.7) * 0.075;
    
    // Mouse influence
    float mouseInfluence = length(uMouse - 0.5) * 0.2;
    noise += mouseInfluence;
    
    pos += normal * noise;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

// Fragment shader for blob
const blobFragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  
  void main() {
    // Fresnel effect
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - dot(viewDirection, vNormal), 3.0);
    
    // Color gradient
    vec3 color1 = vec3(0.231, 0.510, 0.965); // Blue
    vec3 color2 = vec3(0.937, 0.267, 0.267); // Red
    vec3 color3 = vec3(0.4, 0.2, 0.8); // Purple
    
    // Mix colors based on position and time
    float colorMix = sin(vPosition.x * 2.0 + uTime) * 0.5 + 0.5;
    vec3 baseColor = mix(color1, color2, colorMix);
    baseColor = mix(baseColor, color3, sin(vPosition.y * 2.0 + uTime * 0.7) * 0.5 + 0.5);
    
    // Add fresnel glow
    vec3 finalColor = baseColor + fresnel * vec3(0.5, 0.7, 1.0);
    
    // Add subtle shimmer
    float shimmer = sin(vPosition.x * 10.0 + uTime * 2.0) * sin(vPosition.y * 10.0 + uTime * 2.0) * 0.1;
    finalColor += shimmer;
    
    gl_FragColor = vec4(finalColor, 0.8);
  }
`

export function MorphingBlob() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })

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

    // Geometry - Icosahedron for smoother blob (reduced detail for performance)
    const geometry = new THREE.IcosahedronGeometry(1, 16)

    // Material with shaders
    const material = new THREE.ShaderMaterial({
      vertexShader: blobVertexShader,
      fragmentShader: blobFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      },
      transparent: true,
      side: THREE.DoubleSide,
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // Add inner glow sphere
    const innerGeometry = new THREE.IcosahedronGeometry(0.8, 12)
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.1,
    })
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial)
    scene.add(innerMesh)

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / window.innerWidth
      mouseRef.current.y = 1.0 - e.clientY / window.innerHeight
    }

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('mousemove', handleMouseMove)
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
      material.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y)

      // Rotate mesh slowly
      mesh.rotation.x = elapsedTime * 0.1
      mesh.rotation.y = elapsedTime * 0.15
      innerMesh.rotation.x = -elapsedTime * 0.1
      innerMesh.rotation.y = -elapsedTime * 0.15

      renderer.render(scene, camera)
    }

    animate(0)

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      geometry.dispose()
      material.dispose()
      innerGeometry.dispose()
      innerMaterial.dispose()
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
