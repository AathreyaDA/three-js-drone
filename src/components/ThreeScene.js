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
  const rotorsOn = useRef(false);
  const rotationFactor = 10;

  const scale = 5;
  const meshScale = 0.02; //For college drone (drone.glb)
  // const meshScale = 0.25; //For blender drone (5drone.glb)
  // const meshScale = 5; //For animated drone (2drone.glb)

  const world = useRef(new CANNON.World({gravity: new CANNON.Vec3(0, -9.8 * scale, 0)}));
  const droneMesh = useRef(null);
  const droneBody = useRef(null);
  const droneMass = 1;
  const rpm = useRef(0);
  const maxRPM = 60;
  const targetRpm = useRef(0); // The RPM we want to reach
  const rpmIncreaseSpeed = 10; // RPM increase per second

  const box1 = useRef(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({color:"red"})));
  // const movement = () => {

  // }

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
    rgbeLoader.load("https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/4k/goegap_road_4k.hdr", 
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
    //scene.current.add(box1.current);
    // groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);
    world.current.addBody(groundBody);

    //drone model loader
    const droneLoader = new GLTFLoader();
    droneLoader.load(
      '/droneModel/source/9drone.glb', // Make sure this file is inside /public folder
      (gltf) => {
        
        const model = gltf.scene;
        // model.scale.set(0.5, 0.5, 0.5); // Adjust scale if necessary
        model.scale.set(meshScale, meshScale, meshScale); // Adjust scale if necessary
        droneMesh.current = model;
        scene.current.add(droneMesh.current);

        // model.traverse((child) => {
        //   if (child.isMesh) {
        //     model.remove(child);
        //   }
        // });

        
        // if(gltf.animations.length > 0 ){
        //   mixer.current = new THREE.AnimationMixer(model);
        //   mixer.current.clipAction(gltf.animations[10]).play()
        // }
        
        if (gltf.animations.length > 0) {
          mixer.current = new THREE.AnimationMixer(model);
        
          // Loop through all animations and play them
          gltf.animations.forEach((clip) => {
            const action = mixer.current.clipAction(clip);
            // action.timeScale = rpm.current * 2 / 3
            action.play();
          });
        }
        

        droneBody.current = new CANNON.Body({
          mass: droneMass, // Give it some weight
          shape: new CANNON.Box(new CANNON.Vec3(0.25, 0.41, 0.25)),
          position: new CANNON.Vec3(0, 5, 0), // Start position
        });

        droneBody.current.fixedRotation = true;
        droneBody.current.linearDamping = 0.5; // Adjust for stability
        droneBody.current.angularDamping = 0.8;
        droneBody.current.updateMassProperties();


        world.current.addBody(droneBody.current);

      },
      (xhr) => {
        console.log(`FBX Loading Progress: ${((xhr.loaded / xhr.total) * 100).toFixed(2)}%`);
      },
      (error) => {
        console.error("Error loading GLB:", error);
      }
    );

    const keyState = {};

    const handleKeyDown = (event) => {
      if(event.code === "KeyF"){
        rotorsOn.current = !rotorsOn.current;
        targetRpm.current = rotorsOn.current ? maxRPM : 0;
      }
      keyState[event.code] = true;
    }
    

    const handleKeyUp = (event) => {
      keyState[event.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const force = 0.25;

    const updateMovement = () => {
      if (!droneBody.current) return;
      
      let moveForce = new CANNON.Vec3(0, 0, 0);
      const speedScale = rpm.current/maxRPM;
      droneBody.current.applyForce(new CANNON.Vec3(0, 9.8 * speedScale * scale * droneMass, 0));
      
      if (keyState["KeyW"]) moveForce.z -= force * speedScale; // Move forward
      if (keyState["KeyS"]) moveForce.z += force * speedScale; // Move backward
      if (keyState["KeyA"]) moveForce.x -= force * speedScale; // Move left
      if (keyState["KeyD"]) moveForce.x += force * speedScale; // Move right
      if (keyState["KeyQ"]) moveForce.y += force * speedScale; // Move up
      if (keyState["KeyE"]) moveForce.y -= force * speedScale; // Move down
      
      if (droneBody.current) {
      
        // Compute tilt angles (in radians) based on velocity
        const tiltX = Math.atan2(droneBody.current.velocity.z, rotationFactor);
        const tiltZ = Math.atan2(droneBody.current.velocity.x, rotationFactor);
      
        // Create axis vectors
        const tiltAxis = new THREE.Vector3(tiltX, 0, -tiltZ).normalize(); // Adjust axis if needed
        const tiltAmount = Math.sqrt(tiltX ** 2 + tiltZ ** 2); // Total tilt angle
      
        // Apply rotation
        droneBody.current.quaternion.setFromAxisAngle(tiltAxis, tiltAmount);
      }
      
      
      droneBody.current.applyImpulse(moveForce, droneBody.current.position);
      // camera.current.position.copy(droneBody.current.position + new CANNON.Vec3(0, 5, 5))

    };
    // world.current.addBody(drone);
    const clock = new THREE.Clock();
    const meshBodyDifference = new THREE.Vector3(0, -1.1, 0);

    const rotorBodyDistance = 1;
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();

      updateMovement();
      
      if (rpm.current !== targetRpm.current) {
        const deltaRpm = rpmIncreaseSpeed * delta; // Change per frame
        if (rpm.current < targetRpm.current) {
          rpm.current = Math.min(rpm.current + deltaRpm, targetRpm.current);
        } else {
          rpm.current = Math.max(rpm.current - deltaRpm, targetRpm.current);
        }
      }
      // console.log(rotorsOn.current);
      world.current.step(1/60);
      
      if(droneMesh.current && droneBody.current){
        if(rotorsOn){
          droneMesh.current.position.copy(droneBody.current.position).add(meshBodyDifference);
        }
        else{
          droneMesh.current.position.copy(droneBody.current.position);
        }
        
        const rotorOffset = new THREE.Vector3(rotorBodyDistance, 0, rotorBodyDistance);
        rotorOffset.applyQuaternion(droneBody.current.quaternion); // Rotate the offset with the drone's rotation

        box1.current.position.copy(droneBody.current.position).add(rotorOffset);
        box1.current.quaternion.copy(droneBody.current.quaternion);

        droneMesh.current.quaternion.copy(droneBody.current.quaternion);
      }

      if(mixer.current){
        mixer.current.timeScale = rpm.current * 2 / 3;
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
