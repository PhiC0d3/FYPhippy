import React, { useEffect, useRef, useState } from "react";
import { Map } from "maplibre-gl";
import { RealtimeLayer } from "mobility-toolbox-js/mapbox";

import "./App.css";

const RealtimeMap = ({
  apiKey = "5cc87b12d7c5370001c1d6553983bc2b94014146b168ea7b563e7b7f",
}) => {
  const mapContainerRef = useRef(null);

  useEffect(() => {
    if (mapContainerRef.current) {
      // Initialize the map
      const map = new Map({
        container: mapContainerRef.current,
        style:
          "https://maps.geops.io/styles/travic_v2/style.json?key=" + apiKey,
        center: [-74.0060, 40.7128],
        zoom: 12,
      });

      // Add the RealtimeLayer for rendering real-time vehicle positions
      const tracker = new RealtimeLayer({
        url: "wss://api.geops.io/tracker-ws/v1/",
        apiKey: apiKey,
      });

      tracker.attachToMap(map);

      // Cleanup function to remove the map on component unmount
      return () => map.remove();
    }
  }, [apiKey]); // Re-run effect if apiKey changes

  return (
    <div ref={mapContainerRef} style={{ height: "100vh", width: "100%" }} />
  );
};

export default RealtimeMap;
