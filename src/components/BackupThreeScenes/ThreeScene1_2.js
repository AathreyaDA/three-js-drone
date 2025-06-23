import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { useEffect, useRef, useState } from 'react';
import { OrbitControls, RGBELoader } from 'three/examples/jsm/Addons.js';
import { convertVector } from './helpers';
import { rotationFactor, airDensity, kValue, rotorDiameter, scale, maxVelocity, stableMaxRPM, upMaxRPM, downMaxRPM, rpmIncreaseSpeed, maxRPMReduction, RPMReductionRate, resetReduction } from './services/UsedConstants';
import * as RPMCalculations from './services/RPMCalculations'
import * as Models from './services/Models';
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
  
  const calculateThrust = (RPM) => {
    const angularVelocity = 2 * Math.PI / 60 * RPM;
    return (Math.PI / 4 * (rotorDiameter**2) * airDensity * kValue * (angularVelocity**2));
  }

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
  let xMovementRPMReduction = maxRPMReduction;
  let yMovementRPMReduction = 4;
  let zMovementRPMReduction = maxRPMReduction;
  // const torqueStrength = 0.1; 

  const resetCorrectionFLag = useRef(false);
  let poweringOn = true;

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
      
    }
    
  }

  const rotatedVector = (vector) => {
    if (!droneBody.current) {
        return vector;
    }

    const quaternion = droneBody.current.quaternion; // CANNON.Quat from the body

    if (vector instanceof THREE.Vector3) {
        // Convert CANNON.Quat to THREE.Quaternion
        const threeQuat = new THREE.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);

        // Rotate the vector using quaternion
        return vector.applyQuaternion(threeQuat);
    } 
    else if (vector instanceof CANNON.Vec3) {
        const rotated = new CANNON.Vec3();
        quaternion.vmult(vector, rotated); // Rotate the CANNON.Vec3
        return rotated;
    }

    throw new Error("Unsupported vector type");
  };

  const rotatedVectorY = (vector) => {
    if (!droneBody.current) {
        return vector;
    }

    const quaternion = droneBody.current.quaternion; // CANNON.Quaternion from the body

    // Convert the full quaternion to a THREE.Euler to extract the yaw
    const threeQuat = new THREE.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
    const euler = new THREE.Euler();
    euler.setFromQuaternion(threeQuat, "YXZ"); // Extract yaw (Y rotation)

    // Create a new quaternion with only the Y rotation
    const yawQuat = new THREE.Quaternion();
    yawQuat.setFromEuler(new THREE.Euler(0, euler.y, 0)); // Only Yaw

    if (vector instanceof THREE.Vector3) {
        return vector.applyQuaternion(yawQuat);
    } 
    else if (vector instanceof CANNON.Vec3) {
        const rotated = new CANNON.Vec3();
        const cannonYawQuat = new CANNON.Quaternion(yawQuat.x, yawQuat.y, yawQuat.z, yawQuat.w);
        cannonYawQuat.vmult(vector, rotated);
        return rotated;
    }

    throw new Error("Unsupported vector type");
};

const maxRotation = 0.125;

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
              
            if (distance < 5) {
              objectivesCompleted.current[`checkpoint_${index+1}`] = true;
              markObjectiveComplete(`checkpoint_${index+1}`);
              // Change checkpoint color to indicate completion
              checkpoint.material.color.set(0xff0000);
            }
          }
        });
      }

      // Check for weather checkpoint collision in level 4
      if (levelNumber === 4 && droneMesh.current) {
        checkpoints.current.forEach((checkpoint, index) => {
          const objectiveKey = `weather_checkpoint_${index+1}`;
          
          if (!objectivesCompleted.current[objectiveKey]) {
            try {
              // Check if drone is close to checkpoint
              const distance = droneMesh.current.position.distanceTo(checkpoint.position);
              
              // Very generous detection radius
              if (distance < 10) {
                console.log(`Level 4: Checkpoint ${index+1} completed! Distance: ${distance}`);
                objectivesCompleted.current[objectiveKey] = true;
                markObjectiveComplete(objectiveKey);
                
                // Change checkpoint color to indicate completion
                checkpoint.material.color.set(0xff0000);
              }
            } catch (error) {
              console.error(`Error checking checkpoint ${index+1}:`, error);
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
    
            // const forceVector = new THREE.Vector3(0, 9.8 * speedScale * scale * droneMass / 4, 0);
            const forceVector = new THREE.Vector3(0, calculateThrust(rotorRPMs[i][j]) * scale, 0);
            
            forceVector.applyQuaternion(droneMesh.current.quaternion);
            

            const normalizeVelocity = (velocity) =>{
              let x, y, z;
              if(velocity.x >= 0){
                x = Math.min(velocity.x, maxVelocity);
              }else {
                x = Math.max(velocity.x, -maxVelocity);
              }

              y = velocity.y;

              if(velocity.z >= 0){
                z = Math.min(velocity.z, maxVelocity);
              }else {
                z = Math.max(velocity.z, -maxVelocity);
              }

              return new CANNON.Vec3(x, y, z);
            }


            droneBody.current.applyForce(new CANNON.Vec3(forceVector.x, forceVector.y, forceVector.z), rotorOffset);

            const impulseFactor = delta.current;
            // droneBody.current.applyImpulse((new CANNON.Vec3(forceVector.x, forceVector.y, forceVector.z)).scale(impulseFactor), rotorOffset);
            // droneBody.current.applyImpulse((new CANNON.Vec3(forceVector.x * 2, forceVector.y, forceVector.z * 2)).scale(impulseFactor), rotorOffset);
            droneBody.current.velocity.copy(normalizeVelocity(droneBody.current.velocity));            
            
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

        const yawTorque = 0.2;
        if (keyState["KeyZ"]){
          droneBody.current.applyTorque(new CANNON.Vec3(0,yawTorque,0));
        }
        if (keyState["KeyX"]){
          droneBody.current.applyTorque(new CANNON.Vec3(0,-yawTorque,0));
        }

        if (!keyState["KeyW"] && !keyState["KeyS"] && !keyState["KeyA"] && !keyState["KeyD"]) {
          if(rpm.current !== rotorRPMs[0][0])
            resetCorrectionFLag.current = true;
          resetRPMs();
        }
        else{
          resetCorrectionFLag.current = false;
        }

        if (keyState["KeyQ"]){
          targetRpm.current = Math.min(targetRpm.current + yMovementRPMReduction, upMaxRPM);
          yMovementRPMReduction = Math.max(yMovementRPMReduction - RPMReductionRate, 0);
        }
        else if (keyState["KeyE"]){
          targetRpm.current = Math.max(targetRpm.current - yMovementRPMReduction, downMaxRPM);
          yMovementRPMReduction = Math.max(yMovementRPMReduction - RPMReductionRate, 0);
        }
        else{
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
                
                const tiltAxis = rotatedVector(new THREE.Vector3(tiltX, 0, -tiltZ).normalize()); // Adjust axis if needed
                const tiltAmount = Math.sqrt(tiltX ** 2 + tiltZ ** 2); // Total tilt angle
              
                // Apply rotation
                // droneBody.current.quaternion.setFromAxisAngle(tiltAxis, tiltAmount);
                droneBody.current.applyTorque(convertVector(tiltAxis.multiplyScalar(tiltAmount * 0.4)));
                // droneBody.current.quaternion = limitRotation(droneBody.current.quaternion);
              }

              if(keyState["KeyO"]){
                droneBody.current.velocity.copy(new CANNON.Vec3(0,0,0));
                droneBody.current.angularVelocity.copy(new CANNON.Vec3(0,0,0));
                droneBody.current.quaternion.copy(new CANNON.Quaternion(0,0,0,0));

                keyState["KeyO"] = false;
              }

        
        // camera.current.position.copy(droneBody.current.position + new CANNON.Vec3(0, 5, 5))

      }
      else{
        resetRPMs();

      };
    }

    const updateCamera = () => {
      if (droneBody.current && camera.current) {
        const offset = rotatedVectorY(new THREE.Vector3(0, 2, 5)); // Adjust this offset as needed
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
      
      delta.current = clock.getDelta();
      updateMovement();
      
      
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