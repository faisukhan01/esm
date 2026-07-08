'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Educational login background — floating books, a graduation cap, and soft
 * golden knowledge particles. Warm, academic, elegant. No techy wireframes.
 */
export function LoginScene({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Warm academic lighting
    scene.add(new THREE.AmbientLight(0xfff4e0, 0.7));
    const keyLight = new THREE.DirectionalLight(0xf5b544, 1.1);
    keyLight.position.set(5, 6, 8);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x10b981, 0.6);
    fillLight.position.set(-5, -2, 4);
    scene.add(fillLight);
    const softGlow = new THREE.PointLight(0xffd97a, 0.8, 30);
    softGlow.position.set(0, 2, 5);
    scene.add(softGlow);

    const group = new THREE.Group();
    scene.add(group);

    // --- Floating books ---
    type Book = { mesh: THREE.Group; floatSpeed: number; floatPhase: number; rotSpeed: THREE.Vector3 };
    const books: Book[] = [];
    const bookColors = [
      { cover: 0x0f766e, spine: 0xf5b544 }, // emerald + gold
      { cover: 0xf5b544, spine: 0x0f766e }, // gold + emerald
      { cover: 0x92400e, spine: 0xfef3c7 }, // brown + cream
      { cover: 0x065f46, spine: 0xfbbf24 }, // dark green + amber
      { cover: 0xb45309, spine: 0xd1fae5 }, // amber + mint
      { cover: 0x047857, spine: 0xfde68a }, // teal + soft gold
    ];

    for (let i = 0; i < 7; i++) {
      const bookGroup = new THREE.Group();
      const colors = bookColors[i % bookColors.length];

      // Book cover (thin box)
      const coverGeo = new THREE.BoxGeometry(1.4, 0.12, 1.0);
      const coverMat = new THREE.MeshStandardMaterial({
        color: colors.cover, roughness: 0.6, metalness: 0.15, flatShading: false,
      });
      const cover = new THREE.Mesh(coverGeo, coverMat);
      bookGroup.add(cover);

      // Pages (slightly smaller, cream colored)
      const pagesGeo = new THREE.BoxGeometry(1.32, 0.09, 0.92);
      const pagesMat = new THREE.MeshStandardMaterial({ color: 0xfef9e7, roughness: 0.9 });
      const pages = new THREE.Mesh(pagesGeo, pagesMat);
      pages.position.y = 0.005;
      bookGroup.add(pages);

      // Spine accent (thin strip on the side)
      const spineGeo = new THREE.BoxGeometry(0.06, 0.13, 1.0);
      const spineMat = new THREE.MeshStandardMaterial({
        color: colors.spine, roughness: 0.5, metalness: 0.3, emissive: colors.spine, emissiveIntensity: 0.1,
      });
      const spine = new THREE.Mesh(spineGeo, spineMat);
      spine.position.x = -0.7;
      bookGroup.add(spine);

      // Position around the scene
      const angle = (i / 7) * Math.PI * 2;
      const radius = 4 + (i % 3) * 0.8;
      bookGroup.position.set(
        Math.cos(angle) * radius,
        ((i % 5) - 2) * 1.4,
        Math.sin(angle) * radius - 1
      );
      bookGroup.rotation.set(
        Math.random() * 0.6 - 0.3,
        Math.random() * Math.PI,
        Math.random() * 0.4 - 0.2
      );
      bookGroup.scale.setScalar(0.7 + (i % 3) * 0.15);

      group.add(bookGroup);
      books.push({
        mesh: bookGroup,
        floatSpeed: 0.3 + (i % 4) * 0.12,
        floatPhase: (i / 7) * Math.PI * 2,
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.15,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.1
        ),
      });
    }

    // --- Central graduation cap (mortarboard) ---
    const capGroup = new THREE.Group();
    // Mortarboard (flat square top)
    const boardGeo = new THREE.BoxGeometry(2.0, 0.08, 2.0);
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x0a1a14, roughness: 0.5, metalness: 0.2 });
    const board = new THREE.Mesh(boardGeo, boardMat);
    capGroup.add(board);
    // Cap base (truncated cone shape under the board)
    const capBaseGeo = new THREE.CylinderGeometry(0.45, 0.6, 0.45, 16);
    const capBaseMat = new THREE.MeshStandardMaterial({ color: 0x0a1a14, roughness: 0.5 });
    const capBase = new THREE.Mesh(capBaseGeo, capBaseMat);
    capBase.position.y = -0.26;
    capGroup.add(capBase);
    // Gold button on top center
    const buttonGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const buttonMat = new THREE.MeshStandardMaterial({ color: 0xf5b544, roughness: 0.2, metalness: 0.8, emissive: 0xf5b544, emissiveIntensity: 0.2 });
    const button = new THREE.Mesh(buttonGeo, buttonMat);
    button.position.y = 0.06;
    capGroup.add(button);
    // Tassel (thin cylinder hanging)
    const tasselGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.7, 8);
    const tasselMat = new THREE.MeshStandardMaterial({ color: 0xf5b544, roughness: 0.3, metalness: 0.6 });
    const tassel = new THREE.Mesh(tasselGeo, tasselMat);
    tassel.position.set(0.95, -0.32, 0);
    tassel.rotation.z = 0.15;
    capGroup.add(tassel);
    // Tassel knot at bottom
    const knotGeo = new THREE.SphereGeometry(0.05, 12, 12);
    const knot = new THREE.Mesh(knotGeo, tasselMat);
    knot.position.set(1.0, -0.68, 0);
    capGroup.add(knot);

    capGroup.position.set(0, 0.5, 0);
    capGroup.scale.setScalar(0.85);
    group.add(capGroup);

    // --- Soft golden knowledge particles (dust motes in sunlight) ---
    const particleCount = 350;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (Math.random() - 0.5) * 24;
      particlePos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 16 - 2;
      const isGold = Math.random() > 0.35;
      const c = new THREE.Color(isGold ? 0xf5b544 : 0x6ee7b7);
      particleColors[i * 3] = c.r;
      particleColors[i * 3 + 1] = c.g;
      particleColors[i * 3 + 2] = c.b;
      particleSizes[i] = 0.03 + Math.random() * 0.06;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.08, vertexColors: true, transparent: true, opacity: 0.6,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // --- Central soft glow sphere (light source feel) ---
    const glowGeo = new THREE.SphereGeometry(2.5, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xf5b544, transparent: true, opacity: 0.04, side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glow);

    // Mouse parallax (gentle)
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
      mouse.x += (mouse.tx - mouse.x) * 0.03;
      mouse.y += (mouse.ty - mouse.y) * 0.03;

      // Floating books — gentle bob + slow rotation
      books.forEach((b, i) => {
        b.mesh.position.y += Math.sin(t * b.floatSpeed + b.floatPhase) * 0.003;
        b.mesh.rotation.x += b.rotSpeed.x * 0.01;
        b.mesh.rotation.y += b.rotSpeed.y * 0.01;
        b.mesh.rotation.z += b.rotSpeed.z * 0.01;
      });

      // Graduation cap — slow gentle rotation + slight bob
      capGroup.rotation.y = t * 0.2;
      capGroup.position.y = 0.5 + Math.sin(t * 0.8) * 0.15;
      capGroup.rotation.z = Math.sin(t * 0.5) * 0.05;

      // Particles — slow drift
      particles.rotation.y = t * 0.01;
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3 + 1;
        posAttr.array[idx] = (posAttr.array[idx] as number) + Math.sin(t * 0.5 + i) * 0.002;
      }
      posAttr.needsUpdate = true;

      // Glow pulse
      glow.scale.setScalar(1 + Math.sin(t * 0.6) * 0.08);

      // Gentle camera parallax
      camera.position.x += (mouse.x * 0.8 - camera.position.x) * 0.03;
      camera.position.y += (-mouse.y * 0.5 - camera.position.y) * 0.03;
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
      // Dispose geometries/materials
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material?.dispose();
        }
      });
      particleGeo.dispose();
      particleMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}
