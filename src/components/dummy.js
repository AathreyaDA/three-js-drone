import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { useEffect, useRef, useState } from 'react';
import { OrbitControls, RGBELoader, GLTFLoader } from 'three/examples/jsm/Addons.js';
import { convertVector } from './helpers';
const ThreeScene = ({ markObjectiveComplete, levelNumber }) => {
  const mountRef = useRef(null);  // The container for the Three.js scene
  const canvasRef = useRef(null); // A separate ref for the canvas itself
  const scene = useRef(new THREE.Scene());
  const camera = useRef(null);
  const renderer = useRef(null);
  const mixer = useRef(null);
  const initialized = useRef(false);
  const rotorsOn = useRef(false);
  const rotationFactor = 10;

  // Track objectives completed
  const objectivesCompleted = useRef({
    rotors_on: false,
    takeoff: false,
    landing: false,
    rotors_off: false,
    checkpoint_1: false,
    checkpoint_2: false,
    checkpoint_3: false
  });

  const [levelState, setLevelState] = useState(1);

  const scale = 5;
  const meshScale = 0.02; //For college drone (drone.glb)
  // const meshScale = 0.25; //For blender drone (5drone.glb)
  // const meshScale = 5; //For animated drone (2drone.glb)
  const relativeArrowScale = 10;

  const world = useRef(new CANNON.World({gravity: new CANNON.Vec3(0, -9.8 * scale, 0)}));
  // const landscapeMesh = useRef(null);

  const droneMesh = useRef(null);
  const droneBody = useRef(null);
  const droneMass = 1;
  const rpm = useRef(0);
  const checkpoints = useRef([]);
  const startTime = useRef(Date.now());
  const perfectRunRef = useRef(true); // Track if the user has made any mistakes

  const stableMaxRPM = 60;
  const upMaxRPM = 66;
  const downMaxRPM = 54;
  let maxRPM = 60;

  const targetRpm = useRef(0); // The RPM we want to reach
  const rpmIncreaseSpeed = 15; // RPM increase per second

  const maxRPMReduction = 8;
  const RPMReductionRate = 1;
  const resetReduction = maxRPMReduction;
  let xMovementRPMReduction = maxRPMReduction;
  let yMovementRPMReduction = 4;
  let zMovementRPMReduction = maxRPMReduction;
  // const torqueStrength = 0.1; 

  const resetCorrectionFLag = useRef(false);
  let poweringOn = true;
  const arrows = useRef([null, null, null, null]);
  // const movement = () => {

  // }

  let rotorRPMs = [
    [rpm.current, rpm.current],
    [rpm.current, rpm.current] 
  ];

  // const resetFlag = useRef(false);
  const resetRPMs = () => {
    xMovementRPMReduction = Math.min(xMovementRPMReduction + RPMReductionRate, maxRPMReduction);
    yMovementRPMReduction = Math.min(yMovementRPMReduction + RPMReductionRate, 4);
    zMovementRPMReduction = Math.min(zMovementRPMReduction + RPMReductionRate, maxRPMReduction);
    // if(rpm.current == stableMaxRPM){
    //   poweringOn = false;
    // }
    if(!resetCorrectionFLag.current){
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
      // console.log("Quat: " + droneBody.current.quaternion);
    }
    
  }

  useEffect(() => {
    if(initialized.current) 
      return;

    initialized.current = true;

    // Reset objectives when level changes
    objectivesCompleted.current = {
      rotors_on: false,
      takeoff: false,
      landing: false,
      rotors_off: false,
      checkpoint_1: false,
      checkpoint_2: false,
      checkpoint_3: false
    };
    
    // Reset perfect run tracking
    perfectRunRef.current = true;
    
    // Reset start time for timing achievements
    startTime.current = Date.now();

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

    //drone model loader
    const droneLoader = new GLTFLoader();
    // const landscapeLoader = new GLTFLoader();
    const arrowLoaders = Array.from({ length: 4 }, () => new GLTFLoader());

    // Create checkpoints for level 3
    if (levelNumber === 3) {
      for (let i = 0; i < 3; i++) {
        const checkpointGeometry = new THREE.RingGeometry(2, 2.2, 32);
        const checkpointMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6
        });
        const checkpoint = new THREE.Mesh(checkpointGeometry, checkpointMaterial);
        
        // Position checkpoints at different locations
        checkpoint.position.set(
          (i - 1) * 10, // X position (-10, 0, 10)
          10,           // Height
          (i + 1) * 10  // Z position (10, 20, 30)
        );
        
        // Rotate ring to be horizontal
        checkpoint.rotation.x = Math.PI / 2;
        
        scene.current.add(checkpoint);
        checkpoints.current.push(checkpoint);
      }
    }
    
    const handleLevel = () => {
      if (!droneBody.current) return;
      
      // Check for takeoff objective (when drone reaches certain height)
      if (droneBody.current.position.y >= 10 && !objectivesCompleted.current.takeoff) {
        objectivesCompleted.current.takeoff = true;
        markObjectiveComplete("takeoff");
      }
      
      // Check for landing objective (when drone comes back down to near ground level)
      if (droneBody.current.position.y <= 0.5 && 
          objectivesCompleted.current.takeoff && 
          !objectivesCompleted.current.landing) {
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
              objectivesCompleted.current.landing && 
              objectivesCompleted.current.rotors_on &&
              objectivesCompleted.current.rotors_off &&
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
      }
    }

    droneLoader.load(
      '/droneModel/source/9drone.glb', // Make sure this file is inside /public folder
      (gltf) => {
        
        const model = gltf.scene;
        // model.scale.set(0.5, 0.5, 0.5); // Adjust scale if necessary
        model.scale.set(meshScale, meshScale, meshScale); // Adjust scale if necessary
        droneMesh.current = model;
        scene.current.add(droneMesh.current);
        
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

        // droneBody.current.fixedRotation = true;
        droneBody.current.fixedRotation = false;
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


    for(let i = 0; i < 4; i++){
      arrowLoaders[i].load('/Arrow.glb', 
        (arrowGltf) => {
          const model = arrowGltf.scene;
          const arrowScale = meshScale * relativeArrowScale ;
          model.scale.set(arrowScale, arrowScale, arrowScale);

          arrows.current[i] = model;
          scene.current.add(arrows.current[i]);
        }
      )
    }

    const keyState = {};

    const handleKeyDown = (event) => {
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

    const updateMovement = () => {
      if (!droneBody.current) return;

      handleLevel();
      
      // Check for checkpoint collision in level 3
      if (levelNumber === 3 && droneMesh.current) {
        checkpoints.current.forEach((checkpoint, index) => {
          if (!objectivesCompleted.current[`checkpoint_${index+1}`]) {
            // Check if drone is close to checkpoint
            const distance = new THREE.Vector3()
              .copy(droneMesh.current.position)
              .distanceTo(checkpoint.position);
              
            if (distance < 2) {
              objectivesCompleted.current[`checkpoint_${index+1}`] = true;
              markObjectiveComplete(`checkpoint_${index+1}`);
              // Change checkpoint color to indicate completion
              checkpoint.material.color.set(0xff0000);
            }
          }
        });
      }
      
      // droneBody.current.applyForce(new CANNON.Vec3(0, 9.8 * speedScale * scale * droneMass, 0));
      if(rpm.current){
        for(let i = 0; i<2; i++){
          for(let j =0; j<2; j++){
            const speedScale = rotorRPMs[i][j] / maxRPM;
            const xSign = (j === 1) ? 1 : -1
            const zSign = (i === 0) ? 1 : -1;
    
            const rotorOffset = new THREE.Vector3( xSign * rotorBodyDistance, 0.7, zSign * rotorBodyDistance);
            rotorOffset.applyQuaternion(droneMesh.current.quaternion); 
    
            const forceVector = new THREE.Vector3(0, 9.8 * speedScale * scale * droneMass / 4, 0);
            forceVector.applyQuaternion(droneMesh.current.quaternion);
    
            droneBody.current.applyForce(new CANNON.Vec3(forceVector.x, forceVector.y, forceVector.z), rotorOffset);
            
          } 
        }
      }


      
      if(rotorsOn.current){
        if (keyState["KeyW"]) {
            // rotorRPMs[0] = [maxRPM-zMovementRPMReduction, maxRPM-zMovementRPMReduction];
            rotorRPMs[0][0] -= zMovementRPMReduction;
            rotorRPMs[0][1] -= zMovementRPMReduction;
            rotorRPMs[1][0] += zMovementRPMReduction;
            rotorRPMs[1][1] += zMovementRPMReduction;
            zMovementRPMReduction = Math.max(zMovementRPMReduction - RPMReductionRate, 0);

        }
        if (keyState["KeyS"]) {
          // rotorRPMs[1] = [maxRPM-zMovementRPMReduction, maxRPM-zMovementRPMReduction];
          rotorRPMs[1][0] -= zMovementRPMReduction;
          rotorRPMs[1][1] -= zMovementRPMReduction;
          rotorRPMs[0][0] += zMovementRPMReduction;
          rotorRPMs[0][1] += zMovementRPMReduction;
          zMovementRPMReduction = Math.max(zMovementRPMReduction - RPMReductionRate, 0);
        }
        if (keyState["KeyA"]) {
          rotorRPMs[0][0] -= xMovementRPMReduction;
          rotorRPMs[1][0] -= xMovementRPMReduction;
          rotorRPMs[0][1] += xMovementRPMReduction;
          rotorRPMs[1][1] += xMovementRPMReduction;
          xMovementRPMReduction = Math.max(xMovementRPMReduction - RPMReductionRate, 0);
        }
        if (keyState["KeyD"]) {
          rotorRPMs[0][1] -= xMovementRPMReduction;
          rotorRPMs[1][1] -= xMovementRPMReduction;
          rotorRPMs[0][0] += xMovementRPMReduction;
          rotorRPMs[1][0] += xMovementRPMReduction;
          xMovementRPMReduction = Math.max(xMovementRPMReduction - RPMReductionRate, 0);
        }

        if (!keyState["KeyW"] && !keyState["KeyS"] && !keyState["KeyA"] && !keyState["KeyD"]) {
          if(rpm.current != rotorRPMs[0][0])
            resetCorrectionFLag.current = true;
          resetRPMs();
        }
        else{
          resetCorrectionFLag.current = false;
        }
        // const verticalScale = (keyState["KeyW"] || keyState["KeyS"] || keyState["KeyA"] || keyState["KeyD"]) ? 0.66 : 1;
        // if (keyState["KeyQ"]) moveForce.y += force * (rpm.current/maxRPM) * verticalScale; // Move up
        // if (keyState["KeyE"]) moveForce.y -= force * (rpm.current/maxRPM) * verticalScale; // Move down

        if (keyState["KeyQ"]){
          // maxRPM = upMaxRPM;
          // maxRPM = Math.min(maxRPM + yMovementRPMReduction, upMaxRPM);
          targetRpm.current = Math.min(targetRpm.current + yMovementRPMReduction, upMaxRPM);
          yMovementRPMReduction = Math.max(yMovementRPMReduction - RPMReductionRate, 0);
        }
        else if (keyState["KeyE"]){
          // maxRPM = downMaxRPM;
          // maxRPM = Math.max(maxRPM-yMovementRPMReduction, downMaxRPM);
          targetRpm.current = Math.max(targetRpm.current - yMovementRPMReduction, downMaxRPM);
          yMovementRPMReduction = Math.max(yMovementRPMReduction - RPMReductionRate, 0);
        }
        else{
          // maxRPM = stableMaxRPM;
          targetRpm.current = stableMaxRPM;
        }
        
        if (droneBody.current) {
              
                // Compute tilt angles (in radians) based on velocity
                const frontAverage = (rotorRPMs[0][0] + rotorRPMs[0][1]) / 2;
                const backAverage = (rotorRPMs[1][0] + rotorRPMs[1][1]) / 2;
                const leftAverage = (rotorRPMs[0][0] + rotorRPMs[1][0]) / 2;
                const rightAverage = (rotorRPMs[0][1] + rotorRPMs[1][1]) / 2

                const xRotationSign = frontAverage < backAverage ? -1 : +1; 
                const zRotationSign = leftAverage < rightAverage ? -1: +1;
                // const tiltX = Math.atan2((frontAverage - backAverage)*2 / maxRPM, rotationFactor);
                // const tiltZ = Math.atan2((leftAverage - rightAverage)*2 / maxRPM, rotationFactor);

                const tiltX = Math.atan2(xRotationSign * (Math.max(frontAverage, backAverage) - rpm.current) * 0.05, rotationFactor);
                const tiltZ = Math.atan2(zRotationSign * (Math.max(leftAverage,rightAverage) - rpm.current) * 0.05, rotationFactor);
                // Create axis vectors
                // console.log(Math.max(frontAverage, backAverage) - rpm.current)
                const tiltAxis = new THREE.Vector3(tiltX, 0, -tiltZ).normalize(); // Adjust axis if needed
                const tiltAmount = Math.sqrt(tiltX ** 2 + tiltZ ** 2); // Total tilt angle
              
                // Apply rotation
                // droneBody.current.quaternion.setFromAxisAngle(tiltAxis, tiltAmount);
                droneBody.current.applyTorque(convertVector(tiltAxis.multiplyScalar(tiltAmount * 0.2)));
              }
        
        // camera.current.position.copy(droneBody.current.position + new CANNON.Vec3(0, 5, 5))

      }
      else{
        resetRPMs();
      };
    }

    const updateCamera = () => {
      if (droneBody.current && camera.current) {
        const offset = new THREE.Vector3(0, 2, 5); // Adjust this offset as needed
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

    const rotorBodyDistance = 0.78;
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      // console.log("rpm: " + rpm)
      updateMovement();
      
      if (rpm.current !== targetRpm.current) {
        const deltaRpm = rpmIncreaseSpeed * delta; // Change per frame
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
        
        for(let i = 0; i<2; i++){
          for(let j =0; j<2; j++){
            const speedScale = rotorRPMs[i][j] / maxRPM;
            const xSign = (j === 1) ? 1 : -1
            const zSign = (i === 0) ? 1 : -1;
            const rotorOffset = new THREE.Vector3( xSign * rotorBodyDistance, 0.7, zSign * rotorBodyDistance);
            rotorOffset.applyQuaternion(droneMesh.current.quaternion); 

            arrows.current[2*(1-i) + j].position.copy(droneMesh.current.position).add(rotorOffset);
            arrows.current[2*(1-i) + j].quaternion.copy(droneMesh.current.quaternion);

            const speedScaledArrowScale = meshScale * relativeArrowScale * speedScale;
            arrows.current[2*i + j].scale.set(speedScaledArrowScale, speedScaledArrowScale, speedScaledArrowScale);
          }
        }

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
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (renderer.current) {
        renderer.current.dispose();
      }
    };
  }, [levelNumber, markObjectiveComplete]); // Add dependencies

  return (
    <div ref={mountRef}>
      <canvas ref={canvasRef} style={{ position: 'absolute', display: 'block', width: '100%', height: '100%' }}></canvas>
    </div>
  );}

  