'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * eSM Hero Scene — an animated academic-themed 3D composition.
 * Features: central glowing icosahedron (knowledge core), orbiting wireframe
 * polyhedra, a particle starfield, and a floating ring system. Emerald + gold.
 */
export function HeroScene({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a1a14, 0.04);

    const camera = new THREE.PerspectiveCamera(
      55,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0x88ffd8, 0.4);
    scene.add(ambient);
    const keyLight = new THREE.PointLight(0x10b981, 2.2, 30);
    keyLight.position.set(5, 4, 6);
    scene.add(keyLight);
    const goldLight = new THREE.PointLight(0xf5b544, 1.8, 25);
    goldLight.position.set(-5, -3, 4);
    scene.add(goldLight);
    const rim = new THREE.DirectionalLight(0xffffff, 0.5);
    rim.position.set(-3, 5, -4);
    scene.add(rim);

    const group = new THREE.Group();
    scene.add(group);

    // Central knowledge core — faceted icosahedron with glow shell
    const coreGeo = new THREE.IcosahedronGeometry(1.7, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0f766e,
      emissive: 0x10b981,
      emissiveIntensity: 0.35,
      metalness: 0.6,
      roughness: 0.25,
      flatShading: true,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Wireframe shell around core
    const shellGeo = new THREE.IcosahedronGeometry(2.15, 1);
    const shellMat = new THREE.MeshBasicMaterial({
      color: 0xf5b544,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    group.add(shell);

    // Outer faint sphere
    const auraGeo = new THREE.SphereGeometry(2.9, 32, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
    });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    group.add(aura);

    // Orbiting polyhedra
    const orbiters: { mesh: THREE.Mesh; radius: number; speed: number; tilt: number; phase: number; yOffset: number }[] = [];
    const orbitColors = [0xf5b544, 0x34d399, 0x10b981, 0xfbbf24, 0x6ee7b7];
    const shapes = [
      new THREE.OctahedronGeometry(0.32, 0),
      new THREE.TetrahedronGeometry(0.38, 0),
      new THREE.DodecahedronGeometry(0.3, 0),
      new THREE.TorusGeometry(0.28, 0.09, 12, 28),
      new THREE.ConeGeometry(0.26, 0.5, 6),
    ];
    for (let i = 0; i < 9; i++) {
      const geo = shapes[i % shapes.length];
      const mat = new THREE.MeshStandardMaterial({
        color: orbitColors[i % orbitColors.length],
        emissive: orbitColors[i % orbitColors.length],
        emissiveIntensity: 0.4,
        metalness: 0.7,
        roughness: 0.3,
        flatShading: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      orbiters.push({
        mesh,
        radius: 3.6 + (i % 3) * 0.8,
        speed: 0.18 + (i % 4) * 0.07,
        tilt: (i / 9) * Math.PI,
        phase: (i / 9) * Math.PI * 2,
        yOffset: ((i % 5) - 2) * 0.5,
      });
      group.add(mesh);
    }

    // Ring system (like an academic halo)
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(3.4, 0.025, 16, 120),
      new THREE.MeshBasicMaterial({ color: 0xf5b544, transparent: true, opacity: 0.5 })
    );
    ring1.rotation.x = Math.PI / 2.3;
    group.add(ring1);
    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(4.1, 0.018, 16, 120),
      new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.4 })
    );
    ring2.rotation.x = Math.PI / 1.8;
    ring2.rotation.y = Math.PI / 5;
    group.add(ring2);

    // Particle starfield
    const starCount = 900;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 8 + Math.random() * 14;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);
      const emerald = Math.random() > 0.45;
      const c = new THREE.Color(emerald ? 0x34d399 : 0xf5b544);
      starColors[i * 3] = c.r;
      starColors[i * 3 + 1] = c.g;
      starColors[i * 3 + 2] = c.b;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

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
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      core.rotation.x = t * 0.25;
      core.rotation.y = t * 0.35;
      shell.rotation.x = -t * 0.15;
      shell.rotation.y = -t * 0.22;
      shell.rotation.z = t * 0.1;

      ring1.rotation.z = t * 0.12;
      ring2.rotation.z = -t * 0.09;

      orbiters.forEach((o, i) => {
        const a = t * o.speed + o.phase;
        o.mesh.position.x = Math.cos(a) * o.radius;
        o.mesh.position.z = Math.sin(a) * o.radius * Math.cos(o.tilt);
        o.mesh.position.y = Math.sin(a) * o.radius * Math.sin(o.tilt) + o.yOffset;
        o.mesh.rotation.x = t * (0.6 + i * 0.1);
        o.mesh.rotation.y = t * (0.8 + i * 0.05);
      });

      stars.rotation.y = t * 0.02;
      stars.rotation.x = t * 0.01;

      group.rotation.y = mouse.x * 0.35;
      group.rotation.x = mouse.y * 0.2;
      camera.position.x += (mouse.x * 0.8 - camera.position.x) * 0.04;
      camera.position.y += (-mouse.y * 0.5 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      const pulse = 1 + Math.sin(t * 1.5) * 0.03;
      core.scale.setScalar(pulse);
      aura.scale.setScalar(1 + Math.sin(t * 0.8) * 0.04);

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
      shellGeo.dispose(); shellMat.dispose();
      auraGeo.dispose(); auraMat.dispose();
      shapes.forEach(s => s.dispose());
      starGeo.dispose(); starMat.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}
