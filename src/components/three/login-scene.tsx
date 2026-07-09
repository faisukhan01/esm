'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Premium educational login background — elegant, minimal, academic.
 * Deep navy backdrop with a single refined open book, a graduation cap,
 * and soft floating light orbs. No blocky cheap books.
 */
export function LoginScene({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Elegant warm lighting
    scene.add(new THREE.AmbientLight(0xc8d4ff, 0.45));
    const keyLight = new THREE.DirectionalLight(0xffd97a, 0.9);
    keyLight.position.set(4, 5, 7);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x8fa9ff, 0.5);
    rimLight.position.set(-4, -1, 3);
    scene.add(rimLight);
    const warmGlow = new THREE.PointLight(0xf5b544, 1.2, 25);
    warmGlow.position.set(0, 1, 4);
    scene.add(warmGlow);

    const group = new THREE.Group();
    scene.add(group);

    // ===== ELEGANT OPEN BOOK (central piece) =====
    const bookGroup = new THREE.Group();

    // Left page (slightly curved using a plane with vertex displacement)
    const pageGeo = new THREE.PlaneGeometry(1.6, 2.0, 8, 12);
    const leftPos = pageGeo.attributes.position;
    for (let i = 0; i < leftPos.count; i++) {
      const x = leftPos.getX(i);
      // curve the page downward toward the outer edge
      const curve = Math.pow((x + 0.8) / 1.6, 2) * 0.15;
      leftPos.setZ(i, -curve);
    }
    pageGeo.computeVertexNormals();
    const pageMat = new THREE.MeshStandardMaterial({
      color: 0xfdf6e3, roughness: 0.85, metalness: 0.0, side: THREE.DoubleSide,
    });
    const leftPage = new THREE.Mesh(pageGeo, pageMat);
    leftPage.position.x = -0.78;
    leftPage.rotation.y = 0.12;
    bookGroup.add(leftPage);

    // Right page (mirrored curve)
    const rightPageGeo = new THREE.PlaneGeometry(1.6, 2.0, 8, 12);
    const rightPos = rightPageGeo.attributes.position;
    for (let i = 0; i < rightPos.count; i++) {
      const x = rightPos.getX(i);
      const curve = Math.pow((0.8 - x) / 1.6, 2) * 0.15;
      rightPos.setZ(i, -curve);
    }
    rightPageGeo.computeVertexNormals();
    const rightPage = new THREE.Mesh(rightPageGeo, pageMat);
    rightPage.position.x = 0.78;
    rightPage.rotation.y = -0.12;
    bookGroup.add(rightPage);

    // Book spine (thin rounded cylinder in center)
    const spineGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.0, 8);
    const spineMat = new THREE.MeshStandardMaterial({ color: 0x1a2a4a, roughness: 0.4, metalness: 0.3 });
    const spine = new THREE.Mesh(spineGeo, spineMat);
    spine.rotation.z = Math.PI / 2;
    spine.position.y = 0;
    bookGroup.add(spine);

    // Subtle gold text-line accents on pages (thin boxes)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xd4a843, transparent: true, opacity: 0.35 });
    for (let i = 0; i < 5; i++) {
      const lineGeo = new THREE.BoxGeometry(1.1, 0.015, 0.01);
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.position.set(-0.75, 0.6 - i * 0.3, 0.02);
      line.rotation.y = 0.12;
      bookGroup.add(line);
      const line2 = new THREE.Mesh(lineGeo, lineMat);
      line2.position.set(0.75, 0.6 - i * 0.3, 0.02);
      line2.rotation.y = -0.12;
      bookGroup.add(line2);
    }

    bookGroup.position.set(-2.8, 0.5, 0);
    bookGroup.rotation.set(-0.15, 0.35, 0.05);
    bookGroup.scale.setScalar(0.85);
    group.add(bookGroup);

    // ===== GRADUATION CAP (refined) =====
    const capGroup = new THREE.Group();
    // Mortarboard (flat square — thin, beveled look)
    const boardGeo = new THREE.BoxGeometry(1.8, 0.06, 1.8);
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x0a1530, roughness: 0.35, metalness: 0.25 });
    const board = new THREE.Mesh(boardGeo, boardMat);
    capGroup.add(board);
    // Cap base
    const capBaseGeo = new THREE.CylinderGeometry(0.4, 0.55, 0.4, 20);
    const capBase = new THREE.Mesh(capBaseGeo, boardMat);
    capBase.position.y = -0.23;
    capGroup.add(capBase);
    // Gold button
    const buttonGeo = new THREE.SphereGeometry(0.07, 16, 16);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf5b544, roughness: 0.15, metalness: 0.85, emissive: 0xf5b544, emissiveIntensity: 0.15 });
    const button = new THREE.Mesh(buttonGeo, goldMat);
    button.position.y = 0.05;
    capGroup.add(button);
    // Tassel cord
    const tasselCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.85, 0.02, 0),
      new THREE.Vector3(0.92, -0.2, 0.02),
      new THREE.Vector3(0.88, -0.45, 0),
      new THREE.Vector3(0.82, -0.6, -0.01),
    ]);
    const tasselTubeGeo = new THREE.TubeGeometry(tasselCurve, 20, 0.012, 8, false);
    const tassel = new THREE.Mesh(tasselTubeGeo, goldMat);
    capGroup.add(tassel);
    // Tassel knot
    const knotGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const knot = new THREE.Mesh(knotGeo, goldMat);
    knot.position.set(0.82, -0.62, -0.01);
    capGroup.add(knot);

    capGroup.position.set(2.5, -0.3, 0);
    capGroup.rotation.set(0.1, -0.4, 0.08);
    capGroup.scale.setScalar(0.8);
    group.add(capGroup);

    // ===== FLOATING LIGHT ORBS (soft, elegant — not particles) =====
    const orbs: { mesh: THREE.Mesh; baseY: number; speed: number; phase: number; radius: number }[] = [];
    const orbColors = [0xf5b544, 0x8fa9ff, 0xfdf6e3, 0xf5b544, 0x6ee7b7, 0xffd97a];
    for (let i = 0; i < 6; i++) {
      const orbGeo = new THREE.SphereGeometry(0.08 + (i % 3) * 0.04, 16, 16);
      const orbMat = new THREE.MeshBasicMaterial({
        color: orbColors[i % orbColors.length],
        transparent: true,
        opacity: 0.75,
      });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      const angle = (i / 6) * Math.PI * 2;
      const r = 3.5 + (i % 2) * 1.5;
      const y = ((i % 4) - 1.5) * 1.6;
      orb.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r - 1);
      orbs.push({ mesh: orb, baseY: y, speed: 0.2 + (i % 3) * 0.1, phase: angle, radius: r });
      group.add(orb);

      // Soft glow halo around each orb
      const haloGeo = new THREE.SphereGeometry(0.25 + (i % 3) * 0.08, 12, 12);
      const haloMat = new THREE.MeshBasicMaterial({
        color: orbColors[i % orbColors.length],
        transparent: true,
        opacity: 0.08,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      orb.add(halo);
    }

    // ===== Subtle floating particles (very fine, like dust) =====
    const dustCount = 150;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 22;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 14 - 2;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.04, color: 0xffd97a, transparent: true, opacity: 0.4,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // Mouse parallax (very gentle)
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
      mouse.x += (mouse.tx - mouse.x) * 0.025;
      mouse.y += (mouse.ty - mouse.y) * 0.025;

      // Book — gentle, slow float + subtle rotation
      bookGroup.position.y = 0.5 + Math.sin(t * 0.4) * 0.2;
      bookGroup.rotation.y = 0.35 + Math.sin(t * 0.25) * 0.08;
      bookGroup.rotation.z = 0.05 + Math.sin(t * 0.3) * 0.03;

      // Cap — gentle counter-rotation + float
      capGroup.position.y = -0.3 + Math.sin(t * 0.35 + 1) * 0.18;
      capGroup.rotation.y = -0.4 + Math.sin(t * 0.2 + 0.5) * 0.1;
      capGroup.rotation.z = 0.08 + Math.cos(t * 0.28) * 0.03;

      // Orbs — slow vertical drift + subtle pulse
      orbs.forEach((o, i) => {
        o.mesh.position.y = o.baseY + Math.sin(t * o.speed + o.phase) * 0.5;
        const pulse = 1 + Math.sin(t * 0.8 + i) * 0.15;
        o.mesh.scale.setScalar(pulse);
      });

      // Dust — slow drift
      dust.rotation.y = t * 0.008;

      // Gentle camera parallax
      camera.position.x += (mouse.x * 0.6 - camera.position.x) * 0.02;
      camera.position.y += (-mouse.y * 0.4 - camera.position.y) * 0.02;
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
      dustGeo.dispose();
      dustMat.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}
