import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { useEffect, useRef } from 'react';
import { OrbitControls, RGBELoader, GLTFLoader } from 'three/examples/jsm/Addons.js';
import ThreeScene from './ThreeScene';

const World = () => {
    const mountRef = useRef(null);  // The container for the Three.js scene
    const canvasRef = useRef(null); // A separate ref for the canvas itself
    const scene = useRef(new THREE.Scene());
    const camera = useRef(null);
    const renderer = useRef(null);


    const scale = 5;
    const meshScale = 0.02; 
    const world = useRef(new CANNON.World({gravity: new CANNON.Vec3(0, -9.8 * scale, 0)}));

    function addToWorld(object){
        world.add(object)
    }

    function addToScene(object){
        scene.add(object);
    }

    


    useEffect(() => {
        if(initialized.current) 
          return;
    
        initialized.current = true;
    
        // Create a new camera with a perspective view
        camera.current = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.current.position.z = 5;
        camera.current.position.y = 5;
        
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
    
        const groundSize = new CANNON.Vec3(2, 1.6, 2);
        //create ground
        const groundBody = new CANNON.Body({
          mass: 0, // Static object (no movement)
          shape: new CANNON.Box(groundSize),
          type: CANNON.Body.STATIC, 
          position: new CANNON.Vec3(0, -0.5, 0), // Lowered by half the height
        });
        // const groundMesh = new THREE.Box2(new THREE.Vector2(-2, -2), new THREE.Vector2(2, 2));
        const groundGeometry = new THREE.BoxGeometry(4, 1, 4);
        const groundMaterial = new THREE.MeshStandardMaterial({color:'blue'});
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.position.copy(groundBody.position);
        // groundMesh.color = "blue";
    
        scene.current.add(groundMesh);
        // scene.current.add(arrows.current[0]);
        // groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);
        world.current.addBody(groundBody);
    
    })
    return (
        <div ref={mountRef}>
            <canvas ref={canvasRef} style={{ position: 'absolute', display: 'block', width: '100%', height: '100%' }}>
              {/* <ThreeScene props={}></ThreeScene> */}
            </canvas>
        </div>
    )
}

export default World;