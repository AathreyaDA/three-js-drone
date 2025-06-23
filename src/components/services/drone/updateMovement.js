import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { calculateTiltAxis, convertVector } from './VectorCalculations';

import {scale, rotationFactor, upMaxRPM, downMaxRPM, stableMaxRPM, maxVelocity, rotorBodyDistance, rotorDiameter, airDensity, kValue, RPMReductionRate} from './UsedConstants'

const updateMovement = ({droneBody, levelNumber, checkpoints, droneMesh, objectivesCompleted, markObjectiveComplete, keyState, handleLevelLogic, rpm, rotorRPMs, targetRpm, delta, rotorsOn, xMovementRPMReduction, yMovementRPMReduction, zMovementRPMReduction, resetCorrectionFlag, maxRPM, resetRPMs}) => {
    const calculateThrust = (RPM) => {
        const angularVelocity = 2 * Math.PI / 60 * RPM;
        return (Math.PI / 4 * (rotorDiameter**2) * airDensity * kValue * (angularVelocity**2));
    }
    if (!droneBody) return;
      handleLevelLogic();
    
      // Check for checkpoint collision in level 3
      if (levelNumber === 3 && droneMesh) {
        checkpoints.forEach((checkpoint, index) => {
          if (!objectivesCompleted[`checkpoint_${index+1}`]) {
            // Check if drone is close to checkpoint
            const distance = new THREE.Vector3()
              .copy(droneMesh.position)
              .distanceTo(checkpoint.position);
              
            if (distance < 5) {
              objectivesCompleted[`checkpoint_${index+1}`] = true;
              markObjectiveComplete(`checkpoint_${index+1}`);
              // Change checkpoint color to indicate completion
              checkpoint.material.color.set(0xff0000);
            }
          }
        });
      }
    ;

      // Check for weather checkpoint collision in level 4
      if (levelNumber === 4 && droneMesh) {
        checkpoints.forEach((checkpoint, index) => {
          const objectiveKey = `weather_checkpoint_${index+1}`;
          
          if (!objectivesCompleted[objectiveKey]) {
            try {
              // Check if drone is close to checkpoint
              const distance = droneMesh.position.distanceTo(checkpoint.position);
              
              // Very generous detection radius
              if (distance < 10) {
                console.log(`Level 4: Checkpoint ${index+1} completed! Distance: ${distance}`);
                objectivesCompleted[objectiveKey] = true;
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
    ;
      
      // droneBody.applyForce(new CANNON.Vec3(0, 9.8 * speedScale * scale * droneMass, 0));
      if(rpm){
        for(let i = 0; i<2; i++){
          for(let j =0; j<2; j++){
            const speedScale = rotorRPMs[i][j] / maxRPM;
            const xSign = (j === 1) ? 1 : -1
            const zSign = (i === 0) ? 1 : -1;

        ;
    
            const rotorOffset = new THREE.Vector3( xSign * rotorBodyDistance, 0.7, zSign * rotorBodyDistance);
            rotorOffset.applyQuaternion(droneMesh.quaternion); 
    
            // const forceVector = new THREE.Vector3(0, 9.8 * speedScale * scale * droneMass / 4, 0);
            const forceVector = new THREE.Vector3(0, calculateThrust(rotorRPMs[i][j]) * scale, 0);
            
            forceVector.applyQuaternion(droneMesh.quaternion);
            
        ;
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
        ;
            droneBody.applyForce(new CANNON.Vec3(forceVector.x, forceVector.y, forceVector.z), rotorOffset);
        ;
            const impulseFactor = delta;
            // droneBody.applyImpulse((new CANNON.Vec3(forceVector.x, forceVector.y, forceVector.z)).scale(impulseFactor), rotorOffset);
            // droneBody.applyImpulse((new CANNON.Vec3(forceVector.x * 2, forceVector.y, forceVector.z * 2)).scale(impulseFactor), rotorOffset);
            droneBody.velocity.copy(normalizeVelocity(droneBody.velocity));   
        ;         
            
          } 
        }
      }
     
      if(rotorsOn){
        if (keyState["KeyW"]) {
            // rotorRPMs[0] = [maxRPM-zMovementRPMReduction.current, maxRPM-zMovementRPMReduction.current];
            rotorRPMs[0][0] -= zMovementRPMReduction.current;
            rotorRPMs[0][1] -= zMovementRPMReduction.current;
            rotorRPMs[1][0] += zMovementRPMReduction.current;
            rotorRPMs[1][1] += zMovementRPMReduction.current;
            zMovementRPMReduction.current = Math.max(zMovementRPMReduction.current - RPMReductionRate, 0);

        }
        if (keyState["KeyS"]) {
          // rotorRPMs[1] = [maxRPM-zMovementRPMReduction.current, maxRPM-zMovementRPMReduction.current];
          rotorRPMs[1][0] -= zMovementRPMReduction.current;
          rotorRPMs[1][1] -= zMovementRPMReduction.current;
          rotorRPMs[0][0] += zMovementRPMReduction.current;
          rotorRPMs[0][1] += zMovementRPMReduction.current;
          zMovementRPMReduction.current = Math.max(zMovementRPMReduction.current - RPMReductionRate, 0);
        }
        if (keyState["KeyA"]) {
          rotorRPMs[0][0] -= xMovementRPMReduction.current;
          rotorRPMs[1][0] -= xMovementRPMReduction.current;
          rotorRPMs[0][1] += xMovementRPMReduction.current;
          rotorRPMs[1][1] += xMovementRPMReduction.current;
          xMovementRPMReduction.current = Math.max(xMovementRPMReduction.current - RPMReductionRate, 0);
        }
        if (keyState["KeyD"]) {
          rotorRPMs[0][1] -= xMovementRPMReduction.current;
          rotorRPMs[1][1] -= xMovementRPMReduction.current;
          rotorRPMs[0][0] += xMovementRPMReduction.current;
          rotorRPMs[1][0] += xMovementRPMReduction.current;
          xMovementRPMReduction.current = Math.max(xMovementRPMReduction.current - RPMReductionRate, 0);
        }

    ;
        const yawTorque = 0.2;
        if (keyState["KeyZ"]){
          droneBody.applyTorque(new CANNON.Vec3(0,yawTorque,0));
        }
        if (keyState["KeyX"]){
          droneBody.applyTorque(new CANNON.Vec3(0,-yawTorque,0));
        }

        if (!keyState["KeyW"] && !keyState["KeyS"] && !keyState["KeyA"] && !keyState["KeyD"]) {
          if(rpm !== rotorRPMs[0][0])
            resetCorrectionFlag.current = true;
          resetRPMs();
        }
        else{
          resetCorrectionFlag.current = false;
        }

        if (keyState["KeyQ"]){
          targetRpm.current = Math.min(targetRpm.current + yMovementRPMReduction.current, upMaxRPM);
          yMovementRPMReduction.current = Math.max(yMovementRPMReduction.current - RPMReductionRate, 0);
        }
        else if (keyState["KeyE"]){
          targetRpm.current = Math.max(targetRpm.current - yMovementRPMReduction.current, downMaxRPM);
          yMovementRPMReduction.current = Math.max(yMovementRPMReduction.current - RPMReductionRate, 0);
        }
        else{
          targetRpm.current = stableMaxRPM;
        }
        
    ;
        if (droneBody) {
              
                // Compute tilt angles (in radians) based on velocity
                const frontAverage = (rotorRPMs[0][0] + rotorRPMs[0][1]) / 2;
                const backAverage = (rotorRPMs[1][0] + rotorRPMs[1][1]) / 2;
                const leftAverage = (rotorRPMs[0][0] + rotorRPMs[1][0]) / 2;
                const rightAverage = (rotorRPMs[0][1] + rotorRPMs[1][1]) / 2

                const xRotationSign = frontAverage < backAverage ? -1 : +1; 
                const zRotationSign = leftAverage < rightAverage ? -1: +1;
                // const tiltX = Math.atan2((frontAverage - backAverage)*2 / maxRPM, rotationFactor);
                // const tiltZ = Math.atan2((leftAverage - rightAverage)*2 / maxRPM, rotationFactor);

                const tiltX = Math.atan2(xRotationSign * (Math.max(frontAverage, backAverage) - rpm) * 0.05, rotationFactor);
                const tiltZ = Math.atan2(zRotationSign * (Math.max(leftAverage,rightAverage) - rpm) * 0.05, rotationFactor);
                // Create axis vectors
                
                const tiltAxis = calculateTiltAxis(new THREE.Vector3(tiltX, 0, -tiltZ).normalize(), droneBody); // Adjust axis if needed
                const tiltAmount = Math.sqrt(tiltX ** 2 + tiltZ ** 2); // Total tilt angle
              
                // Apply rotation
                // droneBody.quaternion.setFromAxisAngle(tiltAxis, tiltAmount);
                droneBody.applyTorque(convertVector(tiltAxis.multiplyScalar(tiltAmount * 0.4)));
                // droneBody.quaternion = limitRotation(droneBody.quaternion);
              }
            ;
              if(keyState["KeyO"]){
                droneBody.velocity.copy(new CANNON.Vec3(0,0,0));
                droneBody.angularVelocity.copy(new CANNON.Vec3(0,0,0));
                droneBody.quaternion.copy(new CANNON.Quaternion(0,0,0,0));

                keyState["KeyO"] = false;
              }

            ;
        // camera.current.position.copy(droneBody.position + new CANNON.Vec3(0, 5, 5))

      }
      else{
        resetRPMs();
    ;
      };
    ;
}

export default updateMovement;