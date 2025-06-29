import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { useEffect, useRef, useState } from 'react';
import { OrbitControls, RGBELoader } from 'three/examples/jsm/Addons.js';
import { rotationFactor, airDensity, kValue, rotorDiameter, scale, maxVelocity, stableMaxRPM, upMaxRPM, downMaxRPM, rpmIncreaseSpeed, maxRPMReduction, RPMReductionRate, resetReduction } from './services/drone/UsedConstants';
import * as RPMCalculations from './services/drone/RPMCalculations'
import * as Models from './services/drone/Models';
import { calculateYawCameraOffset } from './services/drone/VectorCalculations';
import updateMovement from './services/drone/updateMovement';
import { levelLogic, createLevels } from './services/drone/LevelServices';
import Weather from './services/environment/Weather';

const ThreeScene = ({ markObjectiveComplete, levelNumber, loading, setLoading }) => {
  const mountRef = useRef(null);  // The container for the Three.js scene
  const canvasRef = useRef(null); // A separate ref for the canvas itself
  const scene = useRef(new THREE.Scene());
  const camera = useRef(null);
  const renderer = useRef(null);
  const mixer = useRef(null);
  const initialized = useRef(false);
  const rotorsOn = useRef(false); //Flag to indicate if the rotors are on or off

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

  const delta = useRef(0) //Time between frames

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

  const levelState = useRef(1); //Tack objectives within levels
  
  const world = useRef(new CANNON.World({gravity: new CANNON.Vec3(0, -9.8 * scale, 0)})); //CANNON JS physics world
  const landscapeMesh = useRef(null);
  const droneMesh = useRef(null);
  const droneBody = useRef(null); //Physics body of the drone
  const rpm = useRef(0); //Uniform RPM level across rotors
  const checkpoints = useRef([]); //Level checkpoints
  const startTime = useRef(Date.now()); //Start time for levels
  const perfectRunRef = useRef(true); // Track if the user has made any mistakes


  let maxRPM = 2000; //Max RPM of rotors at a moment. Is changed when ascending, descending, etc..,

  const targetRpm = useRef(0); // The RPM we want to reach

  // const resetReduction = maxRPMReduction;

  //Variables used to smoothly transition RMPs while moving
  const xMovementRPMReduction = useRef(maxRPMReduction);
  const yMovementRPMReduction = useRef(4);
  const zMovementRPMReduction = useRef(maxRPMReduction);
  // const torqueStrength = 0.1; 

  const resetCorrectionFlag = useRef(false);
  // let poweringOn = true; 
  
  //Individual rotor RPMs
  let rotorRPMs = [
    [rpm.current, rpm.current],
    [rpm.current, rpm.current] 
  ];

  //Message passing tool between imported resetRPMs method and global state variables
  const handleResetRPMs = (rotorRPMs_) => {
    rotorRPMs = rotorRPMs_
  }
  //Local re-use of the name to simplify calling logic, as the arguments are static.
  const resetRPMs = () => {
    RPMCalculations.resetRPMs(handleResetRPMs, resetCorrectionFlag.current, xMovementRPMReduction, yMovementRPMReduction, zMovementRPMReduction, rpm.current);
  }

  useEffect(() => {
    if(initialized.current) 
      return;

    const lat = 12.9352;
    const lon = 77.5351;
    const weather = new Weather(lat, lon);

    console.log("WD:", weather.data);
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

    //Orbit controls for camera, disabled now due to locking in with the drone. Could be unlocked with a button toggle in the future
    const controls = new OrbitControls(camera.current, renderer.current.domElement);
    controls.enableDamping = true; // Smooth camera movement
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;

    const groundSize = new CANNON.Vec3(8, 1.6, 8); //Dimensions of the ground platform
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
    groundMesh.position.copy(groundBody1.position); //Sync the positions of ground mesh and physics body
    scene.current.add(groundMesh);
    world.current.addBody(groundBody1);

    //Create level specific objects
    createLevels({
      levelNumber: levelNumber,
      scene: scene.current,
      checkpoints: checkpoints.current
    });
    
    const handleLevelLogic = () => {
      const levelLogicProps = {
        droneBody: droneBody.current,
        objectivesCompleted: objectivesCompleted.current,
        markObjectiveComplete: markObjectiveComplete,
        levelState: levelState,
        levelNumber: levelNumber,
        startTime: startTime,
        perfectRunRef: perfectRunRef
      };

      levelLogic(levelLogicProps);
    }
    
    //Load landscape and drone meshes, add a physics body to the drone, create and run an animation mixer.
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

    Models.load(handleLoadModels, setLoading);

    const keyState = {};

    const handleKeyDown = (event) => {
      //Debug code
      if(event.code === "KeyL"){
        console.log(droneBody.current.position);
      }
      //Toggle rotors
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

    // const force = 0.25;
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
        const updateProps = {
          droneBody: droneBody.current,
          levelNumber: levelNumber,
          checkpoints: checkpoints.current,
          droneMesh: droneMesh.current,
          objectivesCompleted: objectivesCompleted.current,
          markObjectiveComplete: markObjectiveComplete,
          keyState: keyState,
          handleLevelLogic: handleLevelLogic,
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
      
        updateMovement(updateProps);
    }
      //Change rpm slowly to target RPM.
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
        //Continuously update camera mesh's position to match its body
        if(rotorsOn){
          droneMesh.current.position.copy(droneBody.current.position).add(meshBodyDifference);
        }
        else{
          droneMesh.current.position.copy(droneBody.current.position);
        }

        updateCamera();
        droneMesh.current.quaternion.copy(droneBody.current.quaternion);
      }

      //Rotor blade animation mixer
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