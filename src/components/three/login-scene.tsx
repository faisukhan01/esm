'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Premium login background — a subtle, elegant 3D particle field with
 * a slowly rotating wireframe icosahedron. Emerald + gold. Lightweight.
 */
export function LoginScene({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0x88ffd8, 0.5));
    const key = new THREE.PointLight(0x10b981, 2, 25);
    key.position.set(4, 3, 5);
    scene.add(key);
    const gold = new THREE.PointLight(0xf5b544, 1.5, 20);
    gold.position.set(-4, -2, 3);
    scene.add(gold);

    // Central wireframe icosahedron — knowledge core
    const coreGeo = new THREE.IcosahedronGeometry(2.2, 1);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true, transparent: true, opacity: 0.25 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // Inner solid glow
    const innerGeo = new THREE.IcosahedronGeometry(1.5, 0);
    const innerMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, emissive: 0x10b981, emissiveIntensity: 0.3, metalness: 0.7, roughness: 0.3, flatShading: true, transparent: true, opacity: 0.6 });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    scene.add(inner);

    // Gold wireframe shell
    const shellGeo = new THREE.IcosahedronGeometry(2.8, 0);
    const shellMat = new THREE.MeshBasicMaterial({ color: 0xf5b544, wireframe: true, transparent: true, opacity: 0.15 });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    scene.add(shell);

    // Particle field
    const count = 500;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 5 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3+2] = r * Math.cos(phi);
      const c = new THREE.Color(Math.random() > 0.4 ? 0x34d399 : 0xf5b544);
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.7, sizeAttenuation: true });
    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    // Mouse parallax
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: MouseEvent) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove);

    let raf = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;

      core.rotation.x = t * 0.15;
      core.rotation.y = t * 0.2;
      inner.rotation.x = -t * 0.1;
      inner.rotation.y = -t * 0.15;
      shell.rotation.x = t * 0.08;
      shell.rotation.y = -t * 0.06;
      particles.rotation.y = t * 0.015;

      const pulse = 1 + Math.sin(t * 1.2) * 0.04;
      inner.scale.setScalar(pulse);

      camera.position.x += (mouse.x * 0.6 - camera.position.x) * 0.03;
      camera.position.y += (-mouse.y * 0.4 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      coreGeo.dispose(); coreMat.dispose();
      innerGeo.dispose(); innerMat.dispose();
      shellGeo.dispose(); shellMat.dispose();
      geo.dispose(); mat.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}
