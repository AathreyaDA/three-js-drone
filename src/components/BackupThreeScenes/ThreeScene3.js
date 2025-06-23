import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { useEffect, useRef, useState } from 'react';
import { OrbitControls, RGBELoader } from 'three/examples/jsm/Addons.js';
import { rotationFactor, airDensity, kValue, rotorDiameter, scale, maxVelocity, stableMaxRPM, upMaxRPM, downMaxRPM, rpmIncreaseSpeed, maxRPMReduction, RPMReductionRate, resetReduction } from './services/UsedConstants';
import * as RPMCalculations from './services/RPMCalculations'
import * as Models from './services/Models';
import { calculateYawCameraOffset } from './services/VectorCalculations';
import updateMovement from './services/updateMovement';
const ThreeScene = ({ markObjectiveComplete, levelNumber, loading, setLoading }) => {
  const mountRef = useRef(null);  // The container for the Three.js scene
  const canvasRef = useRef(null); // A separate ref for the canvas itself
  const scene = useRef(new THREE.Scene());
  const camera = useRef(null);
  const renderer = useRef(null);
  const mixer = useRef(null);
  const initialized = useRef(false);
  const rotorsOn = useRef(false);

  const ringModel = useRef(null);
  // Level 4 new refs
  const windZones = useRef([]);
  const weatherCheckpoints = useRef([]);
  const weatherParticles = useRef(null);
  const stableFlightTracking = useRef({
    lastCheckTime: 0,
    stableSeconds: 0,
    isCurrentlyStable: true
  });

  const delta = useRef(0)

  // const [loading, setLoading] = useState(true);
  // Track objectives completed
  const objectivesCompleted = useRef({
    rotors_on: false,
    takeoff: false,
    landing: false,
    rotors_off: false,
    checkpoint_1: false,
    checkpoint_2: false,
    checkpoint_3: false,
    weather_checkpoint_1: false,
    weather_checkpoint_2: false,
    weather_checkpoint_3: false,
    weather_checkpoint_4: false
  });

  const levelState = useRef(1);
  
  const world = useRef(new CANNON.World({gravity: new CANNON.Vec3(0, -9.8 * scale, 0)}));
  const landscapeMesh = useRef(null);

  const droneMesh = useRef(null);
  const droneBody = useRef(null);
  const rpm = useRef(0);
  const checkpoints = useRef([]);
  const startTime = useRef(Date.now());
  const perfectRunRef = useRef(true); // Track if the user has made any mistakes

  let maxRPM = 2000;

  const targetRpm = useRef(0); // The RPM we want to reach

  const resetReduction = maxRPMReduction;
  const xMovementRPMReduction = useRef(maxRPMReduction);
  const yMovementRPMReduction = useRef(4);
  const zMovementRPMReduction = useRef(maxRPMReduction);
  // const torqueStrength = 0.1; 

  const resetCorrectionFlag = useRef(false);
  let poweringOn = true;

  let rotorRPMs = [
    [rpm.current, rpm.current],
    [rpm.current, rpm.current] 
  ];

  // const resetFlag = useRef(false);

  const resetRPMs = () => {
    xMovementRPMReduction.current = Math.min(xMovementRPMReduction.current + RPMReductionRate, maxRPMReduction);
    yMovementRPMReduction.current = Math.min(yMovementRPMReduction.current + RPMReductionRate, 4);
    zMovementRPMReduction.current = Math.min(zMovementRPMReduction.current + RPMReductionRate, maxRPMReduction);
    // if(rpm.current == stableMaxRPM){
    //   poweringOn = false;
    // }
    if(!resetCorrectionFlag.current){
      rotorRPMs = [
        [rpm.current, rpm.current],
        [rpm.current, rpm.current]
      ]}
    else if(true){
      const lerpRate = 0.2
      rotorRPMs = [
        [THREE.MathUtils.lerp(rotorRPMs[0][0], rpm.current, lerpRate), THREE.MathUtils.lerp(rotorRPMs[0][1], rpm.current, lerpRate)],
        [THREE.MathUtils.lerp(rotorRPMs[1][0], rpm.current, lerpRate), THREE.MathUtils.lerp(rotorRPMs[1][1], rpm.current, lerpRate)]
      ]
      
    }
    
  }

  useEffect(() => {
    if(initialized.current) 
      return;

    // Simple initialization without complex resetting
    console.log(`Initializing level ${levelNumber}`);
    initialized.current = true;
    
    // Reset objectives when level changes
    objectivesCompleted.current = {
      rotors_on: false,
      takeoff: false,
      landing: false,
      rotors_off: false,
      checkpoint_1: false,
      checkpoint_2: false,
      checkpoint_3: false,
      weather_checkpoint_1: false,
      weather_checkpoint_2: false,
      weather_checkpoint_3: false,
      weather_checkpoint_4: false
    };
    
    // Reset perfect run tracking
    perfectRunRef.current = true;
    
    // Reset start time for timing achievements
    startTime.current = Date.now();

    // Create a new camera with a perspective view
    camera.current = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
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
    rgbeLoader.load("/sunflowers_puresky_4k.hdr", 
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

    const groundSize = new CANNON.Vec3(8, 1.6, 8);
    //create ground
    const groundBody1 = new CANNON.Body({
      mass: 0, // Static object (no movement)
      shape: new CANNON.Box(groundSize),
      type: CANNON.Body.STATIC, 
      position: new CANNON.Vec3(0, -0.5, 0), // Lowered by half the height
    });
    // const groundMesh = new THREE.Box2(new THREE.Vector2(-2, -2), new THREE.Vector2(2, 2));
    const groundGeometry = new THREE.BoxGeometry(8, 1, 8);
    const groundMaterial = new THREE.MeshStandardMaterial({color:'green'});
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.position.copy(groundBody1.position);
    // groundMesh.color = "blue";

    scene.current.add(groundMesh);
    world.current.addBody(groundBody1);

    //drone model loader

    // Create checkpoints for level 3
    if (levelNumber === 3) {
      for (let i = 0; i < 3; i++) {
        const checkpointGeometry = new THREE.RingGeometry(5, 6, 32);
        const checkpointMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6
        });
        const checkpoint = new THREE.Mesh(checkpointGeometry, checkpointMaterial);
        
        checkpoint.position.set(
          0,
          12,           // Height
          -(i + 1) * 5  // Z position (10, 20, 30)
        );
        
        scene.current.add(checkpoint);
        checkpoints.current.push(checkpoint);
      }
    }
    
    // Create checkpoints and wind zones for level 4
    // Create checkpoints for level 4
    if (levelNumber === 4) {
      console.log("Creating Level 4 checkpoints");
      
      // Create 3 simple checkpoints
      for (let i = 0; i < 3; i++) {
        // Use TorusGeometry for rings
        // const checkpointGeometry = new THREE.TorusGeometry(5, 0.5, 16, 32);
        const checkpointGeometry = new THREE.SphereGeometry(5);
        const checkpointMaterial = new THREE.MeshBasicMaterial({
          color: 0xff00ff, // Bright magenta
          wireframe: false
        });
        
        const checkpoint = new THREE.Mesh(checkpointGeometry, checkpointMaterial);
        
        // Position checkpoints at different locations
        switch(i) {
          case 0:
            checkpoint.position.set(0, 10, -15);
            break;
          case 1:
            checkpoint.position.set(-10, 15, -35);
            break;
          case 2:
            checkpoint.position.set(10, 15, -55);
            break;
        }
        
        // Rotate to stand upright
        checkpoint.rotation.x = Math.PI / 2;
        
        scene.current.add(checkpoint);
        checkpoints.current.push(checkpoint);
        console.log(`Created Level 4 checkpoint ${i+1} at position:`, checkpoint.position);
      }
      
      console.log(`Level 4 checkpoints created: ${checkpoints.current.length}`);
    }

    
    const handleLevel = () => {


      if (!droneBody.current) return;
      
      // Check for takeoff objective (when drone reaches certain height)
      if (droneBody.current.position.y >= 10 && !objectivesCompleted.current.takeoff) {
        objectivesCompleted.current.takeoff = true;
        markObjectiveComplete("takeoff");

        levelState.current = 2;
      }
      
      // Check for landing objective (when drone comes back down to near ground level)
      if (droneBody.current.position.y <= 2 && 
          objectivesCompleted.current.takeoff && 
          !objectivesCompleted.current.landing &&
          levelState.current === 2 
        ) {
        objectivesCompleted.current.landing = true;
        markObjectiveComplete("landing");
      }
      
      // Check if level is complete based on required objectives for each level
      switch (levelNumber) {
        case 1:
          // Level 1 just requires takeoff
          if (objectivesCompleted.current.takeoff && 
              objectivesCompleted.current.rotors_on) {
            // Check for quick learner achievement
            const timeTaken = (Date.now() - startTime.current) / 1000;
            if (timeTaken < 30) {
              markObjectiveComplete("quick_learner");
            }
          }
          // objectivesCompleted.takeoff.current = false;
          levelState.current = 1;
          break;
          
        case 2:
          // Level 2 requires takeoff, landing, turning rotors on and off
          if (objectivesCompleted.current.takeoff && 
              objectivesCompleted.current.landing && 
              objectivesCompleted.current.rotors_on &&
              objectivesCompleted.current.rotors_off) {
            // Check for efficiency expert achievement
            const timeTaken = (Date.now() - startTime.current) / 1000;
            if (timeTaken < 60) {
              markObjectiveComplete("efficiency_expert");
            }
          }
          break;
          
        case 3:
          // Level 3 requires all checkpoints, takeoff, landing, and rotors handling
          if (objectivesCompleted.current.takeoff && 
              // objectivesCompleted.current.landing && 
              objectivesCompleted.current.rotors_on &&
              // objectivesCompleted.current.rotors_off &&
              objectivesCompleted.current.checkpoint_1 &&
              objectivesCompleted.current.checkpoint_2 &&
              objectivesCompleted.current.checkpoint_3) {
            // Check for speed demon achievement
            const timeTaken = (Date.now() - startTime.current) / 1000;
            if (timeTaken < 60) {
              markObjectiveComplete("speed_demon");
            }
            
            // Check for perfect run achievement
            if (perfectRunRef.current) {
              markObjectiveComplete("perfect_run");
            }
          }
          break;
          
        case 4:
          // Level 4 requires all weather checkpoints, takeoff, and rotors on
          if (objectivesCompleted.current.takeoff && 
              objectivesCompleted.current.rotors_on &&
              objectivesCompleted.current.weather_checkpoint_1 &&
              objectivesCompleted.current.weather_checkpoint_2 &&
              objectivesCompleted.current.weather_checkpoint_3) {
            
            // We only need three checkpoints for Level 4
            // Check for storm navigator achievement
            const timeTaken = (Date.now() - startTime.current) / 1000;
            if (timeTaken < 90) {
              markObjectiveComplete("storm_navigator");
            }
            
            // Auto-award wind master since we removed wind effects
            markObjectiveComplete("wind_master");
          }
          break;
      }
    }


    
    const handleLoadModels = (landscapeMesh_, droneMesh_, droneBody_, mixer_) => {
        landscapeMesh.current = landscapeMesh_;
        if(!landscapeMesh.current){
          console.log("Type: " + typeof landscapeMesh.current);
          return;
        }
        landscapeMesh.current.position.copy(new THREE.Vector3(0, -200, 0));
        scene.current.add(landscapeMesh.current);

        droneMesh.current = droneMesh_;
        scene.current.add(droneMesh.current);

        droneBody.current = droneBody_;
        world.current.addBody(droneBody.current);
        
        mixer.current = mixer_;

    }

    const loadModels = () => {
      Models.load(handleLoadModels, setLoading);
    }

    loadModels();

    const keyState = {};

    const handleKeyDown = (event) => {
      if(event.code === "KeyL"){
        console.log(droneBody.current.position);
      }
      if(event.code === "KeyF"){
        console.log(droneBody.current.position.y);
        rotorsOn.current = !rotorsOn.current;
        targetRpm.current = rotorsOn.current ? maxRPM : 0;
        
        // Mark rotors_on objective complete
        if (rotorsOn.current && !objectivesCompleted.current.rotors_on) {
          objectivesCompleted.current.rotors_on = true;
          markObjectiveComplete("rotors_on");
        }
        
        // Mark rotors_off objective complete (only after landing)
        if (!rotorsOn.current && 
            objectivesCompleted.current.landing && 
            !objectivesCompleted.current.rotors_off) {
          objectivesCompleted.current.rotors_off = true;
          markObjectiveComplete("rotors_off");
        }
        
        if(!rotorsOn){
          poweringOn = true;
        }
      }
      
      // If the player turns upside down or crashes, mark the perfect run as failed
      if (droneBody.current && droneBody.current.quaternion) {
        const euler = new THREE.Euler().setFromQuaternion(
          new THREE.Quaternion(
            droneBody.current.quaternion.x,
            droneBody.current.quaternion.y,
            droneBody.current.quaternion.z,
            droneBody.current.quaternion.w
          )
        );
        
        // Check if drone is tilted too much (more than 45 degrees in any direction)
        if (Math.abs(euler.x) > Math.PI/4 || Math.abs(euler.z) > Math.PI/4) {
          perfectRunRef.current = false;
        }
      }
      
      keyState[event.code] = true;
    }
    

    const handleKeyUp = (event) => {
      keyState[event.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const force = 0.25;

    // const updateMovement = () => {
      
    // }

    const updateCamera = () => {
      if (droneBody.current && camera.current) {
        const offset = calculateYawCameraOffset(new THREE.Vector3(0, 2, 5), droneBody.current); // Adjust this offset as needed
        const dronePosition = new THREE.Vector3().copy(droneBody.current.position);
        
        // Set the camera position relative to the drone
        camera.current.position.copy(dronePosition).add(offset);
    
        // Make the camera look at the drone
        camera.current.lookAt(dronePosition);
      }
    };
    // world.current.addBody(drone);
    const clock = new THREE.Clock();
    const meshBodyDifference = new THREE.Vector3(0, -1.1, 0);

    
    const animate = () => {
      
      requestAnimationFrame(animate);
      
      delta.current = clock.getDelta();

      if(droneBody.current){
      const props = {
        droneBody: droneBody.current,
        levelNumber: levelNumber,
        checkpoints: checkpoints.current,
        droneMesh: droneMesh.current,
        objectivesCompleted: objectivesCompleted.current,
        markObjectiveComplete: markObjectiveComplete,
        keyState: keyState,
        handleLevel: handleLevel,
        rpm: rpm.current,
        rotorRPMs: rotorRPMs,
        delta: delta.current,
        rotorsOn: rotorsOn.current,
        xMovementRPMReduction: xMovementRPMReduction,
        yMovementRPMReduction: yMovementRPMReduction,
        zMovementRPMReduction: zMovementRPMReduction,
        resetCorrectionFlag: resetCorrectionFlag,
        maxRPM: maxRPM,
        resetRPMs: resetRPMs,
        targetRpm: targetRpm
      }
    
      updateMovement(props);
    }
      
      if (rpm.current !== targetRpm.current) {
        const deltaRpm = rpmIncreaseSpeed * delta.current; // Change per frame
        if (rpm.current < targetRpm.current) {
          rpm.current = Math.min(rpm.current + deltaRpm, targetRpm.current);
        } else {
          rpm.current = Math.max(rpm.current - deltaRpm, targetRpm.current);
        }
      }

      world.current.step(1/60);
      
      if(droneMesh.current && droneBody.current){
        if(rotorsOn){
          droneMesh.current.position.copy(droneBody.current.position).add(meshBodyDifference);
        }
        else{
          droneMesh.current.position.copy(droneBody.current.position);
        }

        updateCamera();
        droneMesh.current.quaternion.copy(droneBody.current.quaternion);
      }

      if(mixer.current){
        mixer.current.timeScale = rpm.current * 2 / 3;
        mixer.current.update(delta.current);
      }
      
      // REMOVE particle animation code for now, focus on basic functionality
      
      renderer.current.render(scene.current, camera.current); // Render the scene
    };

    animate();

    // Clean up when the component is unmounted
    return () => {
      if (renderer.current) {
        renderer.current.dispose();
      }
      // No special cleanup needed for level 4 now, we're using the same objects as level 3
    };
  }, [levelNumber, markObjectiveComplete]); // Add dependencies

  return (
    <div ref={mountRef}>
      <canvas ref={canvasRef} style={{ position: 'absolute', display: 'block', width: '100%', height: '100%' }}></canvas>
    </div>
  );}

  
  export default ThreeScene;