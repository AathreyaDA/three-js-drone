import { Vec3 } from "cannon-es";
import { useEffect, useRef, useState } from "react";

const TelemetryData = (droneBody) => {
  const socketRef = useRef(null);
//   const [true, setShouldLogNext] = useState(false);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    socket.binaryType = 'arraybuffer'; // Optional, only if it's binary data
    socketRef.current = socket;

    socket.onmessage = (event) => {
        function fixTelemetryFormat(str) {
            // Add quotes around all keys
            const fixed = str.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');
            return fixed;
          }
      if (true) {
        const raw = event.data;
        // const mode = "GPS_RAW_INT"
        const mode = "GLOBAL_POSITION_INT "
        if(raw.startsWith(mode)){
            const rawData = raw.slice(mode.length);
            const fixed = fixTelemetryFormat(rawData);
            // const rawJson = JSON.parse(fixed)
            console.log("Raw message:", fixed);
            // if(droneBody)
              // setVelocity(new Vec3(rawJson.vx, rawJson.vz, rawJson.vy));
        // Try extracting Lat/Lon/Alt from readable text format

        }
        

        // setShouldLogNext(false);
      }
    };

    return () => socket.close();
  }, []);

  const setVelocity = (velocity) => {
    if(droneBody.velocity)
      droneBody.velocity.copy(velocity);
  }
  const logData = () => {
    // setShouldLogNext(true);
  };

  return (
    <div style={{ zIndex: 400, position: "absolute", top: "35px", right: "5px" }}>
      <button onClick={logData}>Log Telemetry</button>
    </div>
  );
};

export default TelemetryData;
