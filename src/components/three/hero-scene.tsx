'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * eSM Hero Scene — a single elegant graduation cap floating with a soft
 * golden knowledge aura and gentle particle stream. Clean, meaningful,
 * premium. No abstract faceted geometry.
 */
export function HeroScene({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0.5, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Soft, warm lighting
    scene.add(new THREE.AmbientLight(0xfff0d4, 0.6));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(3, 5, 6);
    scene.add(keyLight);
    const goldLight = new THREE.PointLight(0xf5b544, 1.5, 20);
    goldLight.position.set(-3, 2, 3);
    scene.add(goldLight);
    const emeraldLight = new THREE.PointLight(0x10b981, 1.0, 18);
    emeraldLight.position.set(3, -2, 2);
    scene.add(emeraldLight);

    const group = new THREE.Group();
    scene.add(group);

    // ===== GRADUATION CAP (the single hero element) =====
    const capGroup = new THREE.Group();

    // Mortarboard — flat square top, smooth and clean
    const boardGeo = new THREE.BoxGeometry(2.4, 0.08, 2.4);
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b, roughness: 0.35, metalness: 0.2,
    });
    const board = new THREE.Mesh(boardGeo, boardMat);
    capGroup.add(board);

    // Cap base — smooth truncated cone (the head part)
    const baseGeo = new THREE.CylinderGeometry(0.55, 0.75, 0.55, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b, roughness: 0.4, metalness: 0.15,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.3;
    capGroup.add(base);

    // Gold button on top center
    const buttonGeo = new THREE.SphereGeometry(0.1, 24, 24);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf5b544, roughness: 0.15, metalness: 0.9,
      emissive: 0xf5b544, emissiveIntensity: 0.2,
    });
    const button = new THREE.Mesh(buttonGeo, goldMat);
    button.position.y = 0.06;
    capGroup.add(button);

    // Tassel — elegant curved cord using a tube geometry
    const tasselPoints = [
      new THREE.Vector3(0, 0.06, 0),
      new THREE.Vector3(0.6, 0.02, 0.2),
      new THREE.Vector3(1.05, -0.25, 0.15),
      new THREE.Vector3(1.15, -0.6, 0.05),
      new THREE.Vector3(1.1, -0.85, 0),
    ];
    const tasselCurve = new THREE.CatmullRomCurve3(tasselPoints);
    const tasselGeo = new THREE.TubeGeometry(tasselCurve, 40, 0.018, 10, false);
    const tassel = new THREE.Mesh(tasselGeo, goldMat);
    capGroup.add(tassel);

    // Tassel end knot
    const knotGeo = new THREE.SphereGeometry(0.07, 20, 20);
    const knot = new THREE.Mesh(knotGeo, goldMat);
    knot.position.set(1.1, -0.9, 0);
    capGroup.add(knot);

    // Tassel fringe (small strands)
    for (let i = 0; i < 8; i++) {
      const strandGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.18, 4);
      const strand = new THREE.Mesh(strandGeo, goldMat);
      strand.position.set(1.1 + Math.cos(i * Math.PI / 4) * 0.03, -1.0, Math.sin(i * Math.PI / 4) * 0.03);
      strand.rotation.z = Math.cos(i * Math.PI / 4) * 0.15;
      capGroup.add(strand);
    }

    capGroup.scale.setScalar(1.1);
    group.add(capGroup);

    // ===== SOFT GLOW AURA behind the cap =====
    const auraGeo = new THREE.SphereGeometry(2.8, 32, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xf5b544, transparent: true, opacity: 0.06, side: THREE.BackSide,
    });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    group.add(aura);

    // Inner glow
    const innerGlowGeo = new THREE.SphereGeometry(1.8, 32, 32);
    const innerGlowMat = new THREE.MeshBasicMaterial({
      color: 0x10b981, transparent: true, opacity: 0.05, side: THREE.BackSide,
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    group.add(innerGlow);

    // ===== FLOATING KNOWLEDGE PARTICLES (golden, gentle) =====
    const particleCount = 220;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const speeds: number[] = [];
    const baseY: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      // Distribute in a sphere around the cap
      const r = 2.5 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      baseY.push(positions[i * 3 + 1]);

      const isGold = Math.random() > 0.35;
      const c = new THREE.Color(isGold ? 0xf5b544 : 0x6ee7b7);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      speeds.push(0.2 + Math.random() * 0.4);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.06, vertexColors: true, transparent: true, opacity: 0.7,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ===== Floating accent orbs (few, elegant) =====
    const orbs: { mesh: THREE.Mesh; baseY: number; speed: number; phase: number }[] = [];
    const orbColors = [0xf5b544, 0x10b981, 0xfdf6e3];
    const orbPositions = [
      { x: -2.8, y: 1.2, z: -1 },
      { x: 2.6, y: -1.4, z: -0.5 },
      { x: -2.2, y: -1.6, z: 0.5 },
    ];
    orbPositions.forEach((p, i) => {
      const orbGeo = new THREE.SphereGeometry(0.12, 20, 20);
      const orbMat = new THREE.MeshStandardMaterial({
        color: orbColors[i], roughness: 0.2, metalness: 0.5,
        emissive: orbColors[i], emissiveIntensity: 0.3,
      });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(p.x, p.y, p.z);
      orbs.push({ mesh: orb, baseY: p.y, speed: 0.3 + i * 0.1, phase: i * 2 });
      group.add(orb);

      // halo
      const haloGeo = new THREE.SphereGeometry(0.3, 16, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: orbColors[i], transparent: true, opacity: 0.1,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      orb.add(halo);
    });

    // Mouse parallax
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouse.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouse.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove);

    let raf = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;

      // Cap — slow, elegant rotation + gentle float
      capGroup.rotation.y = t * 0.25;
      capGroup.position.y = Math.sin(t * 0.6) * 0.15;
      capGroup.rotation.z = Math.sin(t * 0.4) * 0.04;

      // Aura pulse
      const pulse = 1 + Math.sin(t * 0.8) * 0.05;
      aura.scale.setScalar(pulse);
      innerGlow.scale.setScalar(1 + Math.sin(t * 1.2) * 0.08);

      // Particles — gentle upward drift, wrapping around
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3 + 1;
        let y = posAttr.array[idx] as number;
        y += speeds[i] * 0.004;
        if (y > 4) y = -4;
        posAttr.array[idx] = y;
      }
      posAttr.needsUpdate = true;
      particles.rotation.y = t * 0.02;

      // Orbs — gentle float
      orbs.forEach((o, i) => {
        o.mesh.position.y = o.baseY + Math.sin(t * o.speed + o.phase) * 0.3;
        const op = 1 + Math.sin(t * 0.7 + i) * 0.1;
        o.mesh.scale.setScalar(op);
      });

      // Camera parallax
      group.rotation.y = mouse.x * 0.25;
      group.rotation.x = mouse.y * 0.15;
      camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.03;
      camera.position.y += (-mouse.y * 0.3 + 0.5 - camera.position.y) * 0.03;
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
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else (obj.material as THREE.Material)?.dispose();
        }
      });
      particleGeo.dispose();
      particleMat.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}
