import React, { useState, useEffect, useRef } from "react";
import Map, { GeolocateControl, Marker, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { RealtimeLayer } from "mobility-toolbox-js/mapbox";
import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions";

import "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css";

const App = () => {
  const [viewport, setViewport] = useState({
    longitude: -74.006,
    latitude: 40.7128,
    zoom: 12,
  });
  const mapRef = useRef(null); // Create a ref for the map
  const [directions, setDirections] = useState(null);
  const mapboxAccessToken =
    "pk.eyJ1Ijoia3lyaXR6YiIsImEiOiJjbHVoZDJpZTUyazFlMm1wNmtqeWFwbzIzIn0.dxpXiLCDsPtNDDbKx2ksLA"; // Replace with your Mapbox access token

  const updateUserLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setViewport({
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
          zoom: 12,
        });
      },
      (error) => console.error(error),
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    updateUserLocation(); // Call on component mount
  }, []);

  const pulseAnimation = `
        @keyframes outline-pulse {
            0% {
                box-shadow: 0 0 0 0px rgba(0, 124, 191, 0.7);
            }
            70% {
                box-shadow: 0 0 0 10px rgba(0, 128, 0, 0);
            }
            100% {
                box-shadow: 0 0 0 0px rgba(0, 128, 0, 0);
            }
        }
    `;

  const onMapLoad = () => {
    const map = mapRef.current.getMap(); // Get the map instance
    const apiKey = "5cc87b12d7c5370001c1d6553983bc2b94014146b168ea7b563e7b7f"; // Replace with your API key

    const tracker = new RealtimeLayer({
      url: "wss://api.geops.io/tracker-ws/v1/",
      apiKey: apiKey,
    });
    tracker.attachToMap(map); // Attach the tracker to the map

    tracker.onClick(([feature]) => {
      if (feature) {
        // eslint-disable-next-line no-console
        console.log(feature.getProperties());
      }
    });

    const directionsControl = new MapboxDirections({
      accessToken: mapboxAccessToken,
      unit: "metric",
      profile: "mapbox/walking",
      interactive: false,
      alternatives: true,
    });
    map.addControl(directionsControl);
    setDirections(directionsControl);

    updateUserLocation();

    // Set the initial origin to the user's current location
    navigator.geolocation.getCurrentPosition((position) => {
      const { longitude, latitude } = position.coords;
      directionsControl.setOrigin([longitude, latitude]);
    });
  };

  useEffect(() => {
    if (directions) {
      directions.on("route", (event) => {
        const route = event.route;
        if (route && route.length > 0) {
          const origin = route[0].legs[0].steps[0].maneuver.location;
          const destination =
            route[0].legs[0].steps[route[0].legs[0].steps.length - 1].maneuver
              .location;
          directions.setOrigin(origin);
          directions.setDestination(destination);
        }
      });
    }
  }, [directions]);

  return (
    <>
      <style>
        {`

          .pulse-dot {
            background-color: #007cbf;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            position: relative;
            outline: 2px solid white
          }
        `}
      </style>
      <style>{pulseAnimation}</style>
      <Map
        ref={mapRef}
        mapLib={import("mapbox-gl")}
        initialViewState={viewport}
        style={{ width: "100vw", height: "100vh" }}
        mapStyle="mapbox://styles/kyritzb/clv723iv1004b01pe7ucm03ld"
        mapboxAccessToken={mapboxAccessToken}
        onLoad={onMapLoad}
      >
        {/* GeolocateControl to track user's location */}
        <GeolocateControl
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={true}
          auto
        />

        {/* Marker at the specified longitude and latitude */}
        <Marker
          longitude={viewport.longitude}
          latitude={viewport.latitude}
          anchor="bottom"
        >
          <div
            className="pulse-dot"
            style={{
              animation: "outline-pulse 1.5s infinite",
            }}
          ></div>
        </Marker>

        {/* NavigationControl for zoom and rotation */}
      </Map>
    </>
  );
};

export default App;
