import * as THREE from 'three';

export const levelLogic = ({droneBody, objectivesCompleted, markObjectiveComplete, levelState, levelNumber, startTime, perfectRunRef}) => {
    if (!droneBody) return;
    
    // Check for takeoff objective (when drone reaches certain height)
    if (droneBody.position.y >= 10 && !objectivesCompleted.takeoff) {
    objectivesCompleted.takeoff = true;
    markObjectiveComplete("takeoff");

    levelState.current = 2;
    }
    
    // Check for landing objective (when drone comes back down to near ground level)
    if (droneBody.position.y <= 2 && 
        objectivesCompleted.takeoff && 
        !objectivesCompleted.landing &&
        levelState.current === 2 
    ) {
    objectivesCompleted.landing = true;
    markObjectiveComplete("landing");
    }
    
    // Check if level is complete based on required objectives for each level
    switch (levelNumber) {
    case 1:
        // Level 1 just requires takeoff
        if (objectivesCompleted.takeoff && 
            objectivesCompleted.rotors_on) {
        // Check for quick learner achievement
        const timeTaken = (Date.now() - startTime) / 1000;
        if (timeTaken < 30) {
            markObjectiveComplete("quick_learner");
        }
        }
        // objectivesCompleted.current = false;
        levelState.current = 1;
        break;
        
    case 2:
        // Level 2 requires takeoff, landing, turning rotors on and off
        if (objectivesCompleted.takeoff && 
            objectivesCompleted.landing && 
            objectivesCompleted.rotors_on &&
            objectivesCompleted.rotors_off) {
        // Check for efficiency expert achievement
        const timeTaken = (Date.now() - startTime) / 1000;
        if (timeTaken < 60) {
            markObjectiveComplete("efficiency_expert");
        }
        }
        break;
        
    case 3:
        // Level 3 requires all checkpoints, takeoff, landing, and rotors handling
        if (objectivesCompleted.takeoff && 
            // objectivesCompleted.landing && 
            objectivesCompleted.rotors_on &&
            // objectivesCompleted.rotors_off &&
            objectivesCompleted.checkpoint_1 &&
            objectivesCompleted.checkpoint_2 &&
            objectivesCompleted.checkpoint_3) {
        // Check for speed demon achievement
        const timeTaken = (Date.now() - startTime) / 1000;
        if (timeTaken < 60) {
            markObjectiveComplete("speed_demon");
        }
        
        // Check for perfect run achievement
        if (perfectRunRef) {
            markObjectiveComplete("perfect_run");
        }
        }
        break;
        
    case 4:
        // Level 4 requires all weather checkpoints, takeoff, and rotors on
        if (objectivesCompleted.takeoff && 
            objectivesCompleted.rotors_on &&
            objectivesCompleted.weather_checkpoint_1 &&
            objectivesCompleted.weather_checkpoint_2 &&
            objectivesCompleted.weather_checkpoint_3) {
        
        // We only need three checkpoints for Level 4
        // Check for storm navigator achievement
        const timeTaken = (Date.now() - startTime) / 1000;
        if (timeTaken < 90) {
            markObjectiveComplete("storm_navigator");
        }
        
        // Auto-award wind master since we removed wind effects
        markObjectiveComplete("wind_master");
        }
        break;
    }
}

export const createLevels = ({levelNumber, scene, checkpoints}) => {
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
              
              scene.add(checkpoint);
              checkpoints.push(checkpoint);
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
            
            scene.add(checkpoint);
            checkpoints.push(checkpoint);
            console.log(`Created Level 4 checkpoint ${i+1} at position:`, checkpoint.position);
        }
        
        console.log(`Level 4 checkpoints created: ${checkpoints.length}`);
    }
}