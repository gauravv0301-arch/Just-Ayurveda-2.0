import { useEffect, useRef, useState } from 'react';

export default function Hero3DScene() {
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile || !containerRef.current) return;

    let mounted = true;
    let animationId;
    let renderer;
    let removeListeners = () => {};
    const mouse = { x: 0, y: 0 };

    import('three').then((THREE) => {
      if (!mounted || !containerRef.current) return;

      const container = containerRef.current;
      const w = container.clientWidth;
      const h = container.clientHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
      camera.position.set(0, 0, 7);

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);

      // Lighting
      scene.add(new THREE.AmbientLight('#cfecd6', 0.7));
      const dir1 = new THREE.DirectionalLight('#3bb44b', 0.9);
      dir1.position.set(4, 5, 5);
      scene.add(dir1);
      const dir2 = new THREE.DirectionalLight('#edfbf0', 0.35);
      dir2.position.set(-4, -2, 3);
      scene.add(dir2);

      // Materials
      const glassMat = (color, opacity) => new THREE.MeshPhysicalMaterial({
        color, roughness: 0.15, metalness: 0.05, transparent: true, opacity,
        clearcoat: 0.8, clearcoatRoughness: 0.2,
      });

      const softMat = (color, opacity) => new THREE.MeshStandardMaterial({
        color, roughness: 0.5, metalness: 0, transparent: true, opacity,
      });

      // Capsule shapes (herbal capsules)
      const capGeo = new THREE.CapsuleGeometry(0.18, 0.55, 12, 24);

      const cap1 = new THREE.Mesh(capGeo, glassMat('#3bb44b', 0.55));
      cap1.position.set(2.0, 0.6, -0.3);
      cap1.rotation.set(0.4, 0.6, 0.3);
      scene.add(cap1);

      const cap2 = new THREE.Mesh(capGeo, glassMat('#61a06c', 0.45));
      cap2.position.set(-1.5, -0.4, -0.8);
      cap2.rotation.set(0.9, 0.2, 0.7);
      cap2.scale.setScalar(0.8);
      scene.add(cap2);

      const cap3 = new THREE.Mesh(capGeo, glassMat('#8dac96', 0.38));
      cap3.position.set(0.4, -1.2, 0.3);
      cap3.rotation.set(1.4, 0.9, 0.4);
      cap3.scale.setScalar(0.55);
      scene.add(cap3);

      const cap4 = new THREE.Mesh(capGeo, glassMat('#3bb44b', 0.3));
      cap4.position.set(-0.6, 1.5, -1.2);
      cap4.rotation.set(0.2, 1.1, 0.6);
      cap4.scale.setScalar(0.45);
      scene.add(cap4);

      // Organic spheres
      const sph1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 32, 32),
        softMat('#cfecd6', 0.4)
      );
      sph1.position.set(2.8, -0.6, -1);
      scene.add(sph1);

      const sph2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 32, 32),
        softMat('#8dac96', 0.35)
      );
      sph2.position.set(-2.0, 1.0, 0.2);
      scene.add(sph2);

      // Torus ring (abstract element)
      const torusMat = glassMat('#61a06c', 0.2);
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(0.6, 0.06, 16, 48),
        torusMat
      );
      torus.position.set(1.0, -0.8, -1.5);
      torus.rotation.set(0.8, 0.3, 0);
      scene.add(torus);

      // Particles
      const pCount = 35;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount * 3; i++) pPos[i] = (Math.random() - 0.5) * 9;
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
        size: 0.035, color: '#3bb44b', transparent: true, opacity: 0.35,
      }));
      scene.add(particles);

      const objects = [
        { mesh: cap1, baseY: 0.6, speed: 0.7, rotSpeed: { x: 0.002, y: 0.003, z: 0.001 }, amp: 0.18 },
        { mesh: cap2, baseY: -0.4, speed: 1.1, rotSpeed: { x: 0.001, y: 0.002, z: 0.003 }, amp: 0.14 },
        { mesh: cap3, baseY: -1.2, speed: 0.5, rotSpeed: { x: 0.003, y: 0.001, z: 0.002 }, amp: 0.1 },
        { mesh: cap4, baseY: 1.5, speed: 0.9, rotSpeed: { x: 0.001, y: 0.003, z: 0.001 }, amp: 0.08 },
        { mesh: sph1, baseY: -0.6, speed: 0.4, rotSpeed: { x: 0, y: 0.002, z: 0 }, amp: 0.12 },
        { mesh: sph2, baseY: 1.0, speed: 0.6, rotSpeed: { x: 0, y: 0.001, z: 0 }, amp: 0.1 },
        { mesh: torus, baseY: -0.8, speed: 0.3, rotSpeed: { x: 0.001, y: 0.002, z: 0.001 }, amp: 0.06 },
      ];

      // Events
      const onMouseMove = (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      };
      const onResize = () => {
        const nw = container.clientWidth;
        const nh = container.clientHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('resize', onResize);
      removeListeners = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('resize', onResize);
      };

      const clock = new THREE.Clock();

      const animate = () => {
        if (!mounted) return;
        animationId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        objects.forEach((o, i) => {
          o.mesh.position.y = o.baseY + Math.sin(t * o.speed + i * 0.7) * o.amp;
          o.mesh.rotation.x += o.rotSpeed.x;
          o.mesh.rotation.y += o.rotSpeed.y;
          o.mesh.rotation.z += o.rotSpeed.z;
        });

        particles.rotation.y += 0.0005;
        particles.rotation.x = Math.sin(t * 0.1) * 0.03;

        // Mouse parallax on entire scene
        const targetRY = mouse.x * 0.12;
        const targetRX = mouse.y * 0.08;
        scene.rotation.y += (targetRY - scene.rotation.y) * 0.025;
        scene.rotation.x += (targetRX - scene.rotation.x) * 0.025;

        renderer.render(scene, camera);
      };
      animate();
    });

    return () => {
      mounted = false;
      if (animationId) cancelAnimationFrame(animationId);
      removeListeners();
      if (renderer) {
        renderer.dispose();
        const el = renderer.domElement;
        if (el?.parentNode) el.parentNode.removeChild(el);
      }
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    />
  );
}
