// import * as THREE from 'three';
// import * as CANNON from 'cannon-es';
// import { useEffect, useRef, useState } from 'react';
// import { OrbitControls, RGBELoader, GLTFLoader, DRACOLoader } from 'three/examples/jsm/Addons.js';
// import { convertVector } from './helpers';
// import { rotationFactor, airDensity, kValue, rotorDiameter, scale, meshScale, relativeArrowScale, maxVelocity, stableMaxRPM, upMaxRPM, downMaxRPM, maxRPM, rpmIncreaseSpeed, maxRPMReduction, RPMReductionRate, resetReduction } from './services/UsedConstants';
// import * as RPMCalculations from './services/RPMCalculations'

// const ThreeScene = ({ markObjectiveComplete, levelNumber, loading, setLoading }) => {
//   const mountRef = useRef(null);  // The container for the Three.js scene
//   const canvasRef = useRef(null); // A separate ref for the canvas itself
//   const scene = useRef(new THREE.Scene());
//   const camera = useRef(null);
//   const renderer = useRef(null);
//   const mixer = useRef(null);
//   const initialized = useRef(false);
//   const rotorsOn = useRef(false);
//   const ringModel = useRef(null);
//   // Level 4 new refs
//   const windZones = useRef([]);
//   const weatherCheckpoints = useRef([]);
//   const weatherParticles = useRef(null);
//   const stableFlightTracking = useRef({
//     lastCheckTime: 0,
//     stableSeconds: 0,
//     isCurrentlyStable: true
//   });

//   const delta = useRef(0)
  
//   const calculateThrust = (RPM) => {
//     const angularVelocity = 2 * Math.PI / 60 * RPM;
//     return (Math.PI / 4 * (rotorDiameter**2) * airDensity * kValue * (angularVelocity**2));
//   }

//   // const [loading, setLoading] = useState(true);
//   // Track objectives completed
//   const objectivesCompleted = useRef({
//     rotors_on: false,
//     takeoff: false,
//     landing: false,
//     rotors_off: false,
//     checkpoint_1: false,
//     checkpoint_2: false,
//     checkpoint_3: false,
//     weather_checkpoint_1: false,
//     weather_checkpoint_2: false,
//     weather_checkpoint_3: false,
//     weather_checkpoint_4: false
//   });

//   const levelState = useRef(1);

//   const world = useRef(new CANNON.World({gravity: new CANNON.Vec3(0, -9.8 * scale, 0)}));
//   const landscapeMesh = useRef(null);

//   const droneMesh = useRef(null);
//   const droneBody = useRef(null);
//   const droneMass = 11.35;
//   const rpm = useRef(0);
//   const checkpoints = useRef([]);
//   const startTime = useRef(Date.now());
//   const perfectRunRef = useRef(true); // Track if the user has made any mistakes
//   const targetRpm = useRef(0); // The RPM we want to reach

//   let xMovementRPMReduction = maxRPMReduction;
//   let yMovementRPMReduction = 4;
//   let zMovementRPMReduction = maxRPMReduction;
//   // const torqueStrength = 0.1; 

//   const resetCorrectionFlag = useRef(false);
//   let poweringOn = true;
//   const arrows = useRef([null, null, null, null]);
//   // const movement = () => {

//   // }

//   let rotorRPMs = [
//     [rpm.current, rpm.current],
//     [rpm.current, rpm.current] 
//   ];

//   const handleResetRPMs = (rpms) => {
//     for(let i=0; i<2; i++){
//         for(let j=0; j<2; j++){
//         rotorRPMs[i][j] = rpms[i][j]
//         }
//     }
//     console.log("RRPM:" + rotorRPMs[0][0]);
//   }
//   // const resetFlag = useRef(false);
//   const resetRPMs = () => {
//         RPMCalculations.resetRPMs(handleResetRPMs, resetCorrectionFlag, xMovementRPMReduction, yMovementRPMReduction, zMovementRPMReduction, rpm);
//   }

//   const rotatedVector = (vector) => {
//     if (!droneBody.current) {
//         return vector;
//     }

//     const quaternion = droneBody.current.quaternion; // CANNON.Quat from the body

//     if (vector instanceof THREE.Vector3) {
//         // Convert CANNON.Quat to THREE.Quaternion
//         const threeQuat = new THREE.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);

//         // Rotate the vector using quaternion
//         return vector.applyQuaternion(threeQuat);
//     } 
//     else if (vector instanceof CANNON.Vec3) {
//         const rotated = new CANNON.Vec3();
//         quaternion.vmult(vector, rotated); // Rotate the CANNON.Vec3
//         return rotated;
//     }

//     throw new Error("Unsupported vector type");
//   };

//   const rotatedVectorY = (vector) => {
//     if (!droneBody.current) {
//         return vector;
//     }

//     const quaternion = droneBody.current.quaternion; // CANNON.Quaternion from the body

//     // Convert the full quaternion to a THREE.Euler to extract the yaw
//     const threeQuat = new THREE.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
//     const euler = new THREE.Euler();
//     euler.setFromQuaternion(threeQuat, "YXZ"); // Extract yaw (Y rotation)

//     // Create a new quaternion with only the Y rotation
//     const yawQuat = new THREE.Quaternion();
//     yawQuat.setFromEuler(new THREE.Euler(0, euler.y, 0)); // Only Yaw

//     if (vector instanceof THREE.Vector3) {
//         return vector.applyQuaternion(yawQuat);
//     } 
//     else if (vector instanceof CANNON.Vec3) {
//         const rotated = new CANNON.Vec3();
//         const cannonYawQuat = new CANNON.Quaternion(yawQuat.x, yawQuat.y, yawQuat.z, yawQuat.w);
//         cannonYawQuat.vmult(vector, rotated);
//         return rotated;
//     }

//     throw new Error("Unsupported vector type");
// };

// const maxRotation = 0.125;

// // const limitRotation = (quaternion) => {
// //   let x, y, z, w;
// // //   if (quaternion.x >= 0) {
// // //       x = Math.min(quaternion.x, maxRotation);
// // //   } else {
// // //       x = Math.max(quaternion.x, -maxRotation);
// // //   }

// // //   if (quaternion.y >= 0) {
// // //     y = Math.min(quaternion.y, maxRotation);
// // // } else {
// // //     y = Math.max(quaternion.y, -maxRotation);
// // // }

// // // if (quaternion.z >= 0) {
// // //   z = Math.min(quaternion.z, maxRotation);
// // // } else {
// // //   z = Math.max(quaternion.z, -maxRotation);
// // // }

// // x = quaternion.x;
// // y = quaternion.y;
// // z = quaternion.z;


// // if (quaternion.w >= 0) {
// //   w = Math.min(quaternion.w, maxRotation);
// // } else {
// //   w = Math.max(quaternion.w, -maxRotation);
// // }

// // return new CANNON.Quaternion(x, y, z, w);

// // }




  

//   useEffect(() => {
//     if(initialized.current) 
//       return;

//     // Simple initialization without complex resetting
//     console.log(`Initializing level ${levelNumber}`);
//     initialized.current = true;
//     console.log("Thing: " + calculateThrust(2000) * scale);
//     // Reset objectives when level changes
//     objectivesCompleted.current = {
//       rotors_on: false,
//       takeoff: false,
//       landing: false,
//       rotors_off: false,
//       checkpoint_1: false,
//       checkpoint_2: false,
//       checkpoint_3: false,
//       weather_checkpoint_1: false,
//       weather_checkpoint_2: false,
//       weather_checkpoint_3: false,
//       weather_checkpoint_4: false
//     };
    
//     // Reset perfect run tracking
//     perfectRunRef.current = true;
    
//     // Reset start time for timing achievements
//     startTime.current = Date.now();

//     // Create a new camera with a perspective view
//     camera.current = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
//     camera.current.position.z = 5;
//     camera.current.position.y = 5;
    
//     //lighting
//     const light = new THREE.AmbientLight(0xffffff, 0.5);
//     scene.current.add(light);
  
//     // Initialize renderer only once
//     if (!renderer.current) {
//       renderer.current = new THREE.WebGLRenderer({ canvas: canvasRef.current });  // Bind the canvas explicitly
//       renderer.current.setSize(window.innerWidth, window.innerHeight);
//       renderer.current.toneMapping = THREE.ACESFilmicToneMapping;
//       renderer.current.toneMappingExposure = 1.0;
//       renderer.current.outputEncoding = THREE.SRGBColorSpace;
//       mountRef.current.appendChild(renderer.current.domElement); // Only append the canvas once
//     }

//     //HDRI background
//     const rgbeLoader = new RGBELoader();
//     rgbeLoader.load("/sunflowers_puresky_4k.hdr", 
//       (texture) => {
//         texture.mapping = THREE.EquirectangularReflectionMapping;
//         scene.current.environment = texture;
//         scene.current.background = texture;
//         renderer.current.render(scene.current, camera.current);
//       },
//       undefined,
//       (error) => {
//         console.error('Error loading HDRI:', error);
//       }
//     );

//     //Orbit controls for camera
//     const controls = new OrbitControls(camera.current, renderer.current.domElement);
//     controls.enableDamping = true; // Smooth camera movement
//     controls.dampingFactor = 0.05;
//     controls.screenSpacePanning = false;

//     const groundSize = new CANNON.Vec3(8, 1.6, 8);
//     //create ground
//     const groundBody1 = new CANNON.Body({
//       mass: 0, // Static object (no movement)
//       shape: new CANNON.Box(groundSize),
//       type: CANNON.Body.STATIC, 
//       position: new CANNON.Vec3(0, -0.5, 0), // Lowered by half the height
//     });
//     // const groundMesh = new THREE.Box2(new THREE.Vector2(-2, -2), new THREE.Vector2(2, 2));
//     const groundGeometry = new THREE.BoxGeometry(8, 1, 8);
//     const groundMaterial = new THREE.MeshStandardMaterial({color:'green'});
//     const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
//     groundMesh.position.copy(groundBody1.position);
//     // groundMesh.color = "blue";

//     scene.current.add(groundMesh);
//     // scene.current.add(arrows.current[0]);

//     world.current.addBody(groundBody1);

//     //drone model loader
//     const droneLoader = new GLTFLoader();
//     const dracoLoader = new DRACOLoader();
//     dracoLoader.setDecoderPath('/draco/');
//     dracoLoader.preload(); 
//     droneLoader.setDRACOLoader(dracoLoader);
    

//     const landscapeLoader = new GLTFLoader();
//     // landscapeLoader.setDRACOLoader(dracoLoader);
//     // const ringLoader = new GLTFLoader();
    
//     // const loadRing = () => {
//     //   ringLoader.load(
//     //     '/Ring.glb', 
//     //     (gltf) => {
//     //       const model = gltf.scene;

//     //       model.traverse((child) => {
//     //         if (child.isMesh && !ringModel.current) {
//     //             ringModel.current = child;
//     //         }
//     //     });
//     //     }
//     //   )
//     // }

//     const weatherLoader = 0;

//     const arrowLoaders = Array.from({ length: 4 }, () => new GLTFLoader());

//     // Create checkpoints for level 3
//     if (levelNumber === 3) {
//       for (let i = 0; i < 3; i++) {
//         const checkpointGeometry = new THREE.RingGeometry(5, 6, 32);
//         const checkpointMaterial = new THREE.MeshBasicMaterial({
//           color: 0x00ff00,
//           side: THREE.DoubleSide,
//           transparent: true,
//           opacity: 0.6
//         });
//         const checkpoint = new THREE.Mesh(checkpointGeometry, checkpointMaterial);
        
//         // Position checkpoints at different locations
//         // checkpoint.position.set(
//         //   (i - 1) * 1, // X position (-10, 0, 10)
//         //   1,           // Height
//         //   (i + 1) * 1  // Z position (10, 20, 30)
//         // );

//         checkpoint.position.set(
//           0,
//           12,           // Height
//           -(i + 1) * 5  // Z position (10, 20, 30)
//         );
        
//         scene.current.add(checkpoint);
//         checkpoints.current.push(checkpoint);
//       }
//     }
    
//     // Create checkpoints and wind zones for level 4
//     // Create checkpoints for level 4
//     if (levelNumber === 4) {
//       console.log("Creating Level 4 checkpoints");
      
//       // Create 3 simple checkpoints
//       for (let i = 0; i < 3; i++) {
//         // Use TorusGeometry for rings
//         // const checkpointGeometry = new THREE.TorusGeometry(5, 0.5, 16, 32);
//         const checkpointGeometry = new THREE.SphereGeometry(5);
//         const checkpointMaterial = new THREE.MeshBasicMaterial({
//           color: 0xff00ff, // Bright magenta
//           wireframe: false
//         });
        
//         const checkpoint = new THREE.Mesh(checkpointGeometry, checkpointMaterial);
        
//         // Position checkpoints at different locations
//         switch(i) {
//           case 0:
//             checkpoint.position.set(0, 10, -15);
//             break;
//           case 1:
//             checkpoint.position.set(-10, 15, -35);
//             break;
//           case 2:
//             checkpoint.position.set(10, 15, -55);
//             break;
//         }
        
//         // Rotate to stand upright
//         checkpoint.rotation.x = Math.PI / 2;
        
//         scene.current.add(checkpoint);
//         checkpoints.current.push(checkpoint);
//         console.log(`Created Level 4 checkpoint ${i+1} at position:`, checkpoint.position);
//       }
      
//       console.log(`Level 4 checkpoints created: ${checkpoints.current.length}`);
//     }

    
//     const handleLevel = () => {


//       if (!droneBody.current) return;
      
//       // Check for takeoff objective (when drone reaches certain height)
//       if (droneBody.current.position.y >= 10 && !objectivesCompleted.current.takeoff) {
//         objectivesCompleted.current.takeoff = true;
//         markObjectiveComplete("takeoff");

//         levelState.current = 2;
//         // console.log('ls: ' + levelState.current, levelState.current === 2)
//       }
      
//       // Check for landing objective (when drone comes back down to near ground level)
//       if (droneBody.current.position.y <= 2 && 
//           objectivesCompleted.current.takeoff && 
//           !objectivesCompleted.current.landing &&
//           levelState.current === 2 
//         ) {
//         objectivesCompleted.current.landing = true;
//         // console.log('ls: ' + levelState.current);
//         markObjectiveComplete("landing");
//       }
      
//       // Check if level is complete based on required objectives for each level
//       switch (levelNumber) {
//         case 1:
//           // Level 1 just requires takeoff
//           if (objectivesCompleted.current.takeoff && 
//               objectivesCompleted.current.rotors_on) {
//             // Check for quick learner achievement
//             const timeTaken = (Date.now() - startTime.current) / 1000;
//             if (timeTaken < 30) {
//               markObjectiveComplete("quick_learner");
//             }
//           }
//           // objectivesCompleted.takeoff.current = false;
//           levelState.current = 1;
//           break;
          
//         case 2:
//           // Level 2 requires takeoff, landing, turning rotors on and off
//           if (objectivesCompleted.current.takeoff && 
//               objectivesCompleted.current.landing && 
//               objectivesCompleted.current.rotors_on &&
//               objectivesCompleted.current.rotors_off) {
//             // Check for efficiency expert achievement
//             const timeTaken = (Date.now() - startTime.current) / 1000;
//             if (timeTaken < 60) {
//               markObjectiveComplete("efficiency_expert");
//             }
//           }
//           break;
          
//         case 3:
//           // Level 3 requires all checkpoints, takeoff, landing, and rotors handling
//           if (objectivesCompleted.current.takeoff && 
//               // objectivesCompleted.current.landing && 
//               objectivesCompleted.current.rotors_on &&
//               // objectivesCompleted.current.rotors_off &&
//               objectivesCompleted.current.checkpoint_1 &&
//               objectivesCompleted.current.checkpoint_2 &&
//               objectivesCompleted.current.checkpoint_3) {
//             // Check for speed demon achievement
//             const timeTaken = (Date.now() - startTime.current) / 1000;
//             if (timeTaken < 60) {
//               markObjectiveComplete("speed_demon");
//             }
            
//             // Check for perfect run achievement
//             if (perfectRunRef.current) {
//               markObjectiveComplete("perfect_run");
//             }
//           }
//           break;
          
//         case 4:
//           // Level 4 requires all weather checkpoints, takeoff, and rotors on
//           if (objectivesCompleted.current.takeoff && 
//               objectivesCompleted.current.rotors_on &&
//               objectivesCompleted.current.weather_checkpoint_1 &&
//               objectivesCompleted.current.weather_checkpoint_2 &&
//               objectivesCompleted.current.weather_checkpoint_3) {
            
//             // We only need three checkpoints for Level 4
//             // Check for storm navigator achievement
//             const timeTaken = (Date.now() - startTime.current) / 1000;
//             if (timeTaken < 90) {
//               markObjectiveComplete("storm_navigator");
//             }
            
//             // Auto-award wind master since we removed wind effects
//             markObjectiveComplete("wind_master");
//           }
//           break;
//       }
//     }
//     // /landscapes/landscape1.glb
//     landscapeLoader.load(
//       '/landscapes/landscape1.glb', 
//       // '/landscape1_draco.glb', 
//       (gltf) => {
//         const model = gltf.scene;
//         const landscapeScale = 500;
//         model.scale.set(landscapeScale, landscapeScale, landscapeScale);
//         landscapeMesh.current = model;
//         landscapeMesh.current.position.copy(new THREE.Vector3(0, -200, 0));
//         scene.current.add(landscapeMesh.current);
//       }
//     );


//     droneLoader.load(
//       '/9drone_draco.glb',
//       // '/droneModel/source/9drone.glb', // Make sure this file is inside /public folder
//       (gltf) => {
        
//         const model = gltf.scene;
//         // model.scale.set(0.5, 0.5, 0.5); // Adjust scale if necessary
//         model.scale.set(meshScale, meshScale, meshScale); // Adjust scale if necessary
//         droneMesh.current = model;
//         scene.current.add(droneMesh.current);
        
//         if (gltf.animations.length > 0) {
//           mixer.current = new THREE.AnimationMixer(model);
        
//           // Loop through all animations and play them
//           gltf.animations.forEach((clip) => {
//             const action = mixer.current.clipAction(clip);
//             // action.timeScale = rpm.current * 2 / 3
//             action.play();
//           });
//         }        

//         droneBody.current = new CANNON.Body({
//           mass: droneMass, // Give it some weight
//           shape: new CANNON.Box(new CANNON.Vec3(0.25, 0.41, 0.25)),
//           position: new CANNON.Vec3(0, 2.5, 0), // Start position
//         });

//         // droneBody.current.fixedRotation = true;
//         droneBody.current.fixedRotation = false;
//         droneBody.current.linearDamping = 0.5; // Adjust for stability
//         droneBody.current.angularDamping = 0.8;
//         droneBody.current.updateMassProperties();


//         world.current.addBody(droneBody.current);
        
//       },
//       (xhr) => {
//         console.log(`FBX Loading Progress: ${((xhr.loaded / xhr.total) * 100).toFixed(2)}%`);
//         if(xhr.loaded >= xhr.total){
//           setTimeout(() => setLoading(false), 500);
//         }
//       },
//       (error) => {
//         console.error("Error loading GLB:", error);
//         setLoading(false);
//       }
//     );


//     for(let i = 0; i < 4; i++){
//       arrowLoaders[i].load('/Arrow.glb', 
//         (arrowGltf) => {
//           const model = arrowGltf.scene;
//           const arrowScale = meshScale * relativeArrowScale ;
//           model.scale.set(arrowScale, arrowScale, arrowScale);

//           arrows.current[i] = model;
//           // scene.current.add(arrows.current[i]);
//         }
//       )
//     }

    

//     const keyState = {};

//     const handleKeyDown = (event) => {
//       if(event.code === "KeyL"){
//         console.log(droneBody.current.position);
//       }
//       if(event.code === "KeyF"){
//         console.log(droneBody.current.position.y);
//         rotorsOn.current = !rotorsOn.current;
//         targetRpm.current = rotorsOn.current ? maxRPM : 0;
        
//         // Mark rotors_on objective complete
//         if (rotorsOn.current && !objectivesCompleted.current.rotors_on) {
//           objectivesCompleted.current.rotors_on = true;
//           markObjectiveComplete("rotors_on");
//         }
        
//         // Mark rotors_off objective complete (only after landing)
//         if (!rotorsOn.current && 
//             objectivesCompleted.current.landing && 
//             !objectivesCompleted.current.rotors_off) {
//           objectivesCompleted.current.rotors_off = true;
//           markObjectiveComplete("rotors_off");
//         }
        
//         if(!rotorsOn){
//           poweringOn = true;
//         }
//       }
      
//       // If the player turns upside down or crashes, mark the perfect run as failed
//       if (droneBody.current && droneBody.current.quaternion) {
//         const euler = new THREE.Euler().setFromQuaternion(
//           new THREE.Quaternion(
//             droneBody.current.quaternion.x,
//             droneBody.current.quaternion.y,
//             droneBody.current.quaternion.z,
//             droneBody.current.quaternion.w
//           )
//         );
        
//         // Check if drone is tilted too much (more than 45 degrees in any direction)
//         if (Math.abs(euler.x) > Math.PI/4 || Math.abs(euler.z) > Math.PI/4) {
//           perfectRunRef.current = false;
//         }
//       }
      
//       keyState[event.code] = true;
//     }
    

//     const handleKeyUp = (event) => {
//       keyState[event.code] = false;
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     window.addEventListener("keyup", handleKeyUp);

//     const force = 0.25;

//     const updateMovement = () => {
//       if (!droneBody.current) return;
      
//       handleLevel();
      
//       // Check for checkpoint collision in level 3
//       if (levelNumber === 3 && droneMesh.current) {
//         // const groundBody2 = new CANNON.Body({
//         //   mass: 0, // Static object (no movement)
//         //   shape: new CANNON.Box(groundSize),
//         //   type: CANNON.Body.STATIC, 
//         //   position: new CANNON.Vec3(0, 10-0.5, -25), // Lowered by half the height
//         // });

//         // const groundGeometry = new THREE.BoxGeometry(6, 1, 6);
//         // const groundMaterial = new THREE.MeshStandardMaterial({color:'green'});
//         // const groundMesh2 = new THREE.Mesh(groundGeometry, groundMaterial);

//         // world.current.addBody(groundBody2);
        
//         // groundMesh2.position.copy(groundBody2.position);
//         // scene.current.add(groundMesh2);

//         checkpoints.current.forEach((checkpoint, index) => {
//           if (!objectivesCompleted.current[`checkpoint_${index+1}`]) {
//             // Check if drone is close to checkpoint
//             const distance = new THREE.Vector3()
//               .copy(droneMesh.current.position)
//               .distanceTo(checkpoint.position);
              
//             if (distance < 5) {
//               objectivesCompleted.current[`checkpoint_${index+1}`] = true;
//               markObjectiveComplete(`checkpoint_${index+1}`);
//               // Change checkpoint color to indicate completion
//               checkpoint.material.color.set(0xff0000);
//             }
//           }
//         });
//       }
      
//             // Re-use the checkpoint code for level 4 with explicit distance check
//             // ======= COPY THIS EXACT CODE FOR LEVEL 4 CHECKPOINTS =======
//       // This goes inside your useEffect hook where other level checkpoints are created

//       // if (levelNumber === 4) {
//       //   console.log("CREATING LEVEL 4 CHECKPOINTS - UPRIGHT POSITION");
        
//       //   // CLEAR EXISTING CHECKPOINTS FIRST
//       //   checkpoints.current = [];
        
//       //   // CREATE 3 NEW UPRIGHT CHECKPOINTS WITH BRIGHT COLORS
//       //   for (let i = 0; i < 3; i++) {
//       //     const ringGeometry = new THREE.TorusGeometry(6, 0.5, 16, 32);
//       //     const ringMaterial = new THREE.MeshBasicMaterial({
//       //       color: 0xFF00FF, // BRIGHT MAGENTA COLOR
//       //       side: THREE.DoubleSide,
//       //       transparent: true,
//       //       opacity: 1.0 // FULLY OPAQUE
//       //     });
          
//       //     const checkpoint = new THREE.Mesh(ringGeometry, ringMaterial);
          
//       //     // POSITION UPRIGHT RINGS IN DIFFERENT LOCATIONS
//       //     switch(i) {
//       //       case 0:
//       //         checkpoint.position.set(0, 10, -15);
//       //         break;
//       //       case 1:
//       //         checkpoint.position.set(-15, 15, -30);
//       //         break;
//       //       case 2:
//       //         checkpoint.position.set(15, 20, -45);
//       //         break;
//       //     }
          
//       //     // ROTATE TO UPRIGHT POSITION
//       //     checkpoint.rotation.x = Math.PI / 2;
          
//       //     // MAKE THEM BIGGER FOR VISIBILITY
//       //     checkpoint.scale.set(1.5, 1.5, 1.5);
          
//       //     scene.current.add(checkpoint);
//       //     checkpoints.current.push(checkpoint);
//       //     console.log(`Created Level 4 checkpoint ${i+1} at position:`, checkpoint.position);
//       //   }
        
//       //   console.log("FINISHED CREATING LEVEL 4 CHECKPOINTS: ", checkpoints.current.length);
//       // }


//       // Check for weather checkpoint collision in level 4
//       if (levelNumber === 4 && droneMesh.current) {
//         checkpoints.current.forEach((checkpoint, index) => {
//           const objectiveKey = `weather_checkpoint_${index+1}`;
          
//           if (!objectivesCompleted.current[objectiveKey]) {
//             try {
//               // Check if drone is close to checkpoint
//               const distance = droneMesh.current.position.distanceTo(checkpoint.position);
              
//               // Very generous detection radius
//               if (distance < 10) {
//                 console.log(`Level 4: Checkpoint ${index+1} completed! Distance: ${distance}`);
//                 objectivesCompleted.current[objectiveKey] = true;
//                 markObjectiveComplete(objectiveKey);
                
//                 // Change checkpoint color to indicate completion
//                 checkpoint.material.color.set(0xff0000);
//               }
//             } catch (error) {
//               console.error(`Error checking checkpoint ${index+1}:`, error);
//             }
//           }
//         });
//       }
      
//       // droneBody.current.applyForce(new CANNON.Vec3(0, 9.8 * speedScale * scale * droneMass, 0));
//       if(rpm.current){
//         for(let i = 0; i<2; i++){
//           for(let j =0; j<2; j++){
//             const speedScale = rotorRPMs[i][j] / maxRPM;
//             const xSign = (j === 1) ? 1 : -1
//             const zSign = (i === 0) ? 1 : -1;
    
//             const rotorOffset = new THREE.Vector3( xSign * rotorBodyDistance, 0.7, zSign * rotorBodyDistance);
//             rotorOffset.applyQuaternion(droneMesh.current.quaternion); 
    
//             // const forceVector = new THREE.Vector3(0, 9.8 * speedScale * scale * droneMass / 4, 0);
//             const forceVector = new THREE.Vector3(0, calculateThrust(rotorRPMs[i][j]) * scale, 0);
//             // console.log("cc: " + calculateThrust(rotorRPMs[i][i]));
//             forceVector.applyQuaternion(droneMesh.current.quaternion);
            

//             const normalizeVelocity = (velocity) =>{
//               let x, y, z;
//               if(velocity.x >= 0){
//                 x = Math.min(velocity.x, maxVelocity);
//               }else {
//                 x = Math.max(velocity.x, -maxVelocity);
//               }

//               // if(velocity.y >= 0){
//               //   y = Math.min(velocity.y, maxVelocity);
//               // }else {
//               //   y = Math.max(velocity.y, -maxVelocity);
//               // }

//               y = velocity.y;

//               if(velocity.z >= 0){
//                 z = Math.min(velocity.z, maxVelocity);
//               }else {
//                 z = Math.max(velocity.z, -maxVelocity);
//               }

//               return new CANNON.Vec3(x, y, z);
//             }


//             droneBody.current.applyForce(new CANNON.Vec3(forceVector.x, forceVector.y, forceVector.z), rotorOffset);

//             const impulseFactor = delta.current;
//             // droneBody.current.applyImpulse((new CANNON.Vec3(forceVector.x, forceVector.y, forceVector.z)).scale(impulseFactor), rotorOffset);
//             // droneBody.current.applyImpulse((new CANNON.Vec3(forceVector.x * 2, forceVector.y, forceVector.z * 2)).scale(impulseFactor), rotorOffset);
//             droneBody.current.velocity.copy(normalizeVelocity(droneBody.current.velocity));
            
            
//           } 
//         }
//       }


      
//       if(rotorsOn.current){
//         if (keyState["KeyW"]) {
//             // rotorRPMs[0] = [maxRPM-zMovementRPMReduction, maxRPM-zMovementRPMReduction];
//             rotorRPMs[0][0] -= zMovementRPMReduction;
//             rotorRPMs[0][1] -= zMovementRPMReduction;
//             rotorRPMs[1][0] += zMovementRPMReduction;
//             rotorRPMs[1][1] += zMovementRPMReduction;
//             zMovementRPMReduction = Math.max(zMovementRPMReduction - RPMReductionRate, 0);

//         }
//         if (keyState["KeyS"]) {
//           // rotorRPMs[1] = [maxRPM-zMovementRPMReduction, maxRPM-zMovementRPMReduction];
//           rotorRPMs[1][0] -= zMovementRPMReduction;
//           rotorRPMs[1][1] -= zMovementRPMReduction;
//           rotorRPMs[0][0] += zMovementRPMReduction;
//           rotorRPMs[0][1] += zMovementRPMReduction;
//           zMovementRPMReduction = Math.max(zMovementRPMReduction - RPMReductionRate, 0);
//         }
//         if (keyState["KeyA"]) {
//           rotorRPMs[0][0] -= xMovementRPMReduction;
//           rotorRPMs[1][0] -= xMovementRPMReduction;
//           rotorRPMs[0][1] += xMovementRPMReduction;
//           rotorRPMs[1][1] += xMovementRPMReduction;
//           xMovementRPMReduction = Math.max(xMovementRPMReduction - RPMReductionRate, 0);
//         }
//         if (keyState["KeyD"]) {
//           rotorRPMs[0][1] -= xMovementRPMReduction;
//           rotorRPMs[1][1] -= xMovementRPMReduction;
//           rotorRPMs[0][0] += xMovementRPMReduction;
//           rotorRPMs[1][0] += xMovementRPMReduction;
//           xMovementRPMReduction = Math.max(xMovementRPMReduction - RPMReductionRate, 0);
//         }

//         const yawTorque = 0.2;
//         if (keyState["KeyZ"]){
//           droneBody.current.applyTorque(new CANNON.Vec3(0,yawTorque,0));
//         }
//         if (keyState["KeyX"]){
//           droneBody.current.applyTorque(new CANNON.Vec3(0,-yawTorque,0));
//         }

        
        

//         if (!keyState["KeyW"] && !keyState["KeyS"] && !keyState["KeyA"] && !keyState["KeyD"]) {
//           if(rpm.current != rotorRPMs[0][0])
//             resetCorrectionFlag.current = true;
//           resetRPMs();
//         }
//         else{
//           resetCorrectionFlag.current = false;
//         }

//         if (keyState["KeyQ"]){
//           targetRpm.current = Math.min(targetRpm.current + yMovementRPMReduction, upMaxRPM);
//           yMovementRPMReduction = Math.max(yMovementRPMReduction - RPMReductionRate, 0);
//         }
//         else if (keyState["KeyE"]){
//           targetRpm.current = Math.max(targetRpm.current - yMovementRPMReduction, downMaxRPM);
//           yMovementRPMReduction = Math.max(yMovementRPMReduction - RPMReductionRate, 0);
//         }
//         else{
//           targetRpm.current = stableMaxRPM;
//         }
        
//         if (droneBody.current) {
              
//                 // Compute tilt angles (in radians) based on velocity
//                 const frontAverage = (rotorRPMs[0][0] + rotorRPMs[0][1]) / 2;
//                 const backAverage = (rotorRPMs[1][0] + rotorRPMs[1][1]) / 2;
//                 const leftAverage = (rotorRPMs[0][0] + rotorRPMs[1][0]) / 2;
//                 const rightAverage = (rotorRPMs[0][1] + rotorRPMs[1][1]) / 2

//                 const xRotationSign = frontAverage < backAverage ? -1 : +1; 
//                 const zRotationSign = leftAverage < rightAverage ? -1: +1;
//                 // const tiltX = Math.atan2((frontAverage - backAverage)*2 / maxRPM, rotationFactor);
//                 // const tiltZ = Math.atan2((leftAverage - rightAverage)*2 / maxRPM, rotationFactor);

//                 const tiltX = Math.atan2(xRotationSign * (Math.max(frontAverage, backAverage) - rpm.current) * 0.05, rotationFactor);
//                 const tiltZ = Math.atan2(zRotationSign * (Math.max(leftAverage,rightAverage) - rpm.current) * 0.05, rotationFactor);
//                 // Create axis vectors
//                 // console.log(Math.max(frontAverage, backAverage) - rpm.current)
//                 const tiltAxis = rotatedVector(new THREE.Vector3(tiltX, 0, -tiltZ).normalize()); // Adjust axis if needed
//                 const tiltAmount = Math.sqrt(tiltX ** 2 + tiltZ ** 2); // Total tilt angle
              
//                 // Apply rotation
//                 // droneBody.current.quaternion.setFromAxisAngle(tiltAxis, tiltAmount);
//                 droneBody.current.applyTorque(convertVector(tiltAxis.multiplyScalar(tiltAmount * 0.4)));
//                 // droneBody.current.quaternion = limitRotation(droneBody.current.quaternion);
//               }

//               if(keyState["KeyO"]){
//                 droneBody.current.velocity.copy(new CANNON.Vec3(0,0,0));
//                 droneBody.current.angularVelocity.copy(new CANNON.Vec3(0,0,0));
//                 droneBody.current.quaternion.copy(new CANNON.Quaternion(0,0,0,0));

//                 keyState["KeyO"] = false;
//               }

        
//         // camera.current.position.copy(droneBody.current.position + new CANNON.Vec3(0, 5, 5))

//       }
//       else{
//         resetRPMs();
//       };
//     }

//     const updateCamera = () => {
//       if (droneBody.current && camera.current) {
//         const offset = rotatedVectorY(new THREE.Vector3(0, 2, 5)); // Adjust this offset as needed
//         const dronePosition = new THREE.Vector3().copy(droneBody.current.position);
        
//         // Set the camera position relative to the drone
//         camera.current.position.copy(dronePosition).add(offset);
    
//         // Make the camera look at the drone
//         camera.current.lookAt(dronePosition);
//       }
//     };
//     // world.current.addBody(drone);
//     const clock = new THREE.Clock();
//     const meshBodyDifference = new THREE.Vector3(0, -1.1, 0);

//     const rotorBodyDistance = 0.78;
//     const animate = () => {
      
//       requestAnimationFrame(animate);
      
//       delta.current = clock.getDelta();
//       // console.log("rpm: " + rpm)
//       updateMovement();
      
      
//       if (rpm.current !== targetRpm.current) {
//         const deltaRpm = rpmIncreaseSpeed * delta.current; // Change per frame
//         if (rpm.current < targetRpm.current) {
//           rpm.current = Math.min(rpm.current + deltaRpm, targetRpm.current);
//         } else {
//           rpm.current = Math.max(rpm.current - deltaRpm, targetRpm.current);
//         }
//       }

//       world.current.step(1/60);
      
//       if(droneMesh.current && droneBody.current){
//         if(rotorsOn){
//           droneMesh.current.position.copy(droneBody.current.position).add(meshBodyDifference);
//         }
//         else{
//           droneMesh.current.position.copy(droneBody.current.position);
//         }

//         updateCamera();
        
//         for(let i = 0; i<2; i++){
//           for(let j =0; j<2; j++){
//             const speedScale = rotorRPMs[i][j] / maxRPM;
//             const xSign = (j === 1) ? 1 : -1
//             const zSign = (i === 0) ? 1 : -1;
//             const rotorOffset = new THREE.Vector3( xSign * rotorBodyDistance, 0.7, zSign * rotorBodyDistance);
//             rotorOffset.applyQuaternion(droneMesh.current.quaternion); 

//             arrows.current[2*(1-i) + j].position.copy(droneMesh.current.position).add(rotorOffset);
//             arrows.current[2*(1-i) + j].quaternion.copy(droneMesh.current.quaternion);

//             const speedScaledArrowScale = meshScale * relativeArrowScale * speedScale;
//             arrows.current[2*i + j].scale.set(speedScaledArrowScale, speedScaledArrowScale, speedScaledArrowScale);
//           }
//         }

//         droneMesh.current.quaternion.copy(droneBody.current.quaternion);
//       }

//       if(mixer.current){
//         mixer.current.timeScale = rpm.current * 2 / 3;
//         mixer.current.update(delta.current);
//       }
      
//       // REMOVE particle animation code for now, focus on basic functionality
      
//       renderer.current.render(scene.current, camera.current); // Render the scene
//     };

//     animate();

//     // Clean up when the component is unmounted
//     return () => {
//       // window.removeEventListener("keydown", handleKeyDown);
//       // window.removeEventListener("keyup", handleKeyUp);
//       if (renderer.current) {
//         renderer.current.dispose();
//       }
//       // No special cleanup needed for level 4 now, we're using the same objects as level 3
//     };
//   }, [levelNumber, markObjectiveComplete]); // Add dependencies

//   return (
//     <div ref={mountRef}>
//       <canvas ref={canvasRef} style={{ position: 'absolute', display: 'block', width: '100%', height: '100%' }}></canvas>
//     </div>
//   );}

  
// export default ThreeScene;