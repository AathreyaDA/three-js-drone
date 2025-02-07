import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { useEffect, useRef } from 'react';
import { OrbitControls, RGBELoader, GLTFLoader } from 'three/examples/jsm/Addons.js';

const ThreeScene = () => {
  const mountRef = useRef(null);  // The container for the Three.js scene
  const canvasRef = useRef(null); // A separate ref for the canvas itself
  const scene = useRef(new THREE.Scene());
  const camera = useRef(null);
  const renderer = useRef(null);
  const mixer = useRef(null);
  const initialized = useRef(false);
  const world = useRef(new CANNON.World());
  const drone = useRef(null);
  useEffect(() => {
    if(initialized.current) 
      return;

    initialized.current = true;
    // Create a new camera with a perspective view
    camera.current = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.current.position.z = 5;
    
    //lighting
    const light = new THREE.AmbientLight(0xffffff, 0.5);
    scene.current.add(light);
  
    // Initialize renderer only once
    if (!renderer.current) {
      renderer.current = new THREE.WebGLRenderer({ canvas: canvasRef.current });  // Bind the canvas explicitly
      renderer.current.setSize(window.innerWidth, window.innerHeight);
      renderer.current.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.current.toneMappingExposure = 1.0;
      renderer.current.outputEncoding = THREE.SRGBColorSpace;
      mountRef.current.appendChild(renderer.current.domElement); // Only append the canvas once
    }

    //HDRI background
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load("/g4k.hdr", 
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.current.environment = texture;
        scene.current.background = texture;
        renderer.current.render(scene.current, camera.current);
      },
      undefined,
      (error) => {
        console.error('Error loading HDRI:', error);
      }
    );

    //Orbit controls for camera
    const controls = new OrbitControls(camera.current, renderer.current.domElement);
    controls.enableDamping = true; // Smooth camera movement
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;

    //drone model loader
    drone.current = new GLTFLoader();
    drone.current.load(
      '/droneModel/source/drone.glb', // Make sure this file is inside /public folder
      (gltf) => {
        
        const model = gltf.scene;
        model.scale.set(10, 10, 10); // Adjust scale if necessary
        scene.current.add(model);

        model.traverse((child) => {
          if (child.isMesh) {
            model.remove(child);
          }
        });

        console.log('scene: ', gltf.scene)
        if(gltf.animations.length > 0){
          mixer.current = new THREE.AnimationMixer(model);
          mixer.current.clipAction(gltf.animations[1]).play()
        }

      },
      (xhr) => {
        console.log(`FBX Loading Progress: ${((xhr.loaded / xhr.total) * 100).toFixed(2)}%`);
      },
      (error) => {
        console.error("Error loading GLB:", error);
      }
    );

    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if(mixer.current){
        mixer.current.update(delta);
      }
      renderer.current.render(scene.current, camera.current); // Render the scene
    };

    animate();

    // Clean up when the component is unmounted
    return () => {
      renderer.current.dispose();
    };
  }, []); // Only run once after the initial render

  return (
    <div ref={mountRef}>
      <canvas ref={canvasRef} style={{ position: 'absolute', display: 'block', width: '100%', height: '100%' }}></canvas>
    </div>
  );
};

export default ThreeScene;
