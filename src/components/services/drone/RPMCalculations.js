import { MathUtils } from "three";
import { maxRPMReduction, RPMReductionRate } from './UsedConstants'

export const resetRPMs = (
    handleResetRPMs,
    resetCorrectionFlag,
    xMovementRPMReduction,
    yMovementRPMReduction,
    zMovementRPMReduction,
    rpm
) => {
    xMovementRPMReduction.current = Math.min(xMovementRPMReduction.current + RPMReductionRate, maxRPMReduction);
    yMovementRPMReduction.current = Math.min(yMovementRPMReduction.current + RPMReductionRate, 4);
    zMovementRPMReduction.current = Math.min(zMovementRPMReduction.current + RPMReductionRate, maxRPMReduction);

    //temp variable to return via handler
    let rotorRPMs = [
        [rpm, rpm],
        [rpm, rpm] 
    ];
    if (!resetCorrectionFlag) {
    rotorRPMs = [
        [rpm, rpm],
        [rpm, rpm]
    ];
    } else {
    const lerpRate = 0.2;
    rotorRPMs = [
        [ MathUtils.lerp(rotorRPMs[0][0], rpm, lerpRate), MathUtils.lerp(rotorRPMs[0][1], rpm, lerpRate)],
        [MathUtils.lerp(rotorRPMs[1][0], rpm, lerpRate),MathUtils.lerp(rotorRPMs[1][1], rpm, lerpRate)]
    ];
    }
    handleResetRPMs(rotorRPMs)
};


// export const callThing = (handleCallThing, varThing) => {
//     handleCallThing(varThing + 1);
// }