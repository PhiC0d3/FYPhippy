import React, { useState, useEffect, useRef } from "react";
import Map, { GeolocateControl, Marker, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { RealtimeLayer } from "mobility-toolbox-js/mapbox";

import { SearchBox } from "@mapbox/search-js-react";
import "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css";

const apiKey = "5cc87b12d7c5370001c1d6553983bc2b94014146b168ea7b563e7b7f";

const App = () => {
  const [viewport, setViewport] = useState({
    longitude: -74.006,
    latitude: 40.7128,
    zoom: 12,
  });
  const mapRef = useRef(null); // Create a ref for the map
  const [searchbartext, setSearchbarText] = useState("");
  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState(null);
  const [instructions, setInstructions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const geoControlRef = useRef();
  const [simulateWalking, setSimulateWalking] = useState(false);
  const [stepCoordinates, setStepCoordinates] = useState([]);

  const [lastUpdatedStepIndex, setLastUpdatedStepIndex] = useState(-1); // Add this state to track the last updated step index

  const mapboxAccessToken =
    "pk.eyJ1Ijoia3lyaXR6YiIsImEiOiJjbHVoZDJpZTUyazFlMm1wNmtqeWFwbzIzIn0.dxpXiLCDsPtNDDbKx2ksLA"; // Replace with your Mapbox access token

  const updateUserLocation = () => {
    /*
    console.log("Getting position");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Got position:", position);
        setViewport({
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
          zoom: 12,
        });
      },
      (error) => console.error(error),
      { enableHighAccuracy: true }
    );
    */
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

  useEffect(() => {
    // Activate as soon as the control is loaded
    geoControlRef.current?.trigger();
  }, [geoControlRef.current]);

  const onMapLoad = () => {
    const map = mapRef.current.getMap(); // Get the map instance

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

    updateUserLocation();
  };

  async function pickedDestination(e) {
    const location = e.features[0].geometry.coordinates;
    setDestination(location);

    if (viewport.latitude && viewport.longitude && location) {
      const directionsService = new window.google.maps.DirectionsService();
      const directionsRenderer = new window.google.maps.DirectionsRenderer();

      const request = {
        origin: { lat: viewport.latitude, lng: viewport.longitude },
        destination: { lat: location[1], lng: location[0] },
        travelMode: window.google.maps.TravelMode.TRANSIT,
      };

      directionsService.route(request, (result, status) => {
        console.log(result);
        if (status === window.google.maps.DirectionsStatus.OK) {
          const route = result.routes[0].overview_path.map((point) => [
            point.lng(),
            point.lat(),
          ]);
          setRoute(route);

          const instructions = result.routes[0].legs[0].steps.map(
            (step) => step.instructions
          );

          console.log(instructions);
          setInstructions(instructions);

          const coordinates = result.routes[0].legs[0].steps.map(
            (step) => step.end_location
          );
          const stepCoords = coordinates.map((coord) => [
            coord.lng(),
            coord.lat(),
          ]);
          setStepCoordinates(stepCoords);
        } else {
          console.error("Error fetching directions:", status);
        }
      });
    }
  }

  const updateCurrentStep = () => {
    console.log("Updatee current step");
    if (stepCoordinates.length > 0) {
      const userLocation = [viewport.longitude, viewport.latitude];

      // Find the closest step to the user's location
      let closestStepIndex = 0;
      let closestDistance = Infinity;
      for (let i = 0; i < stepCoordinates.length; i++) {
        const distance = calculateDistance(userLocation, stepCoordinates[i]);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestStepIndex = i;
        }
      }

      // If the user is within a certain distance threshold of the closest step, and the closest step is beyond the last updated step, update the current step
      if (closestDistance < 0.03 && closestStepIndex > lastUpdatedStepIndex) {
        console.log(closestDistance);
        closestStepIndex = closestStepIndex + 1;
        setCurrentStep(closestStepIndex);
        setLastUpdatedStepIndex(closestStepIndex); // Update the last updated step index
      }

      if (destination) {
        const directionsService = new window.google.maps.DirectionsService();
        const directionsRenderer = new window.google.maps.DirectionsRenderer();

        const request = {
          origin: { lat: viewport.latitude, lng: viewport.longitude },
          destination: { lat: destination[1], lng: destination[0] },
          travelMode: window.google.maps.TravelMode.TRANSIT,
        };

        directionsService.route(request, (result, status) => {
          console.log(result);
          if (status === window.google.maps.DirectionsStatus.OK) {
            const route = result.routes[0].overview_path.map((point) => [
              point.lng(),
              point.lat(),
            ]);
            setRoute(route);
          } else {
            console.error("Error fetching directions:", status);
          }
        });
      }
    }
  };

  const calculateDistance = (coord1, coord2) => {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;

    const R = 6371; // Radius of the Earth in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  };

  useEffect(() => {
    updateCurrentStep();
  }, [viewport]);

  const simulateWalkingFunction = () => {
    if (route && route.length > 0) {
      let currentRouteIndex = 0;
      const intervalId = setInterval(() => {
        if (currentRouteIndex < route.length) {
          const [longitude, latitude] = route[currentRouteIndex];
          setViewport((prevViewport) => ({
            ...prevViewport,
            longitude,
            latitude,
          }));
          currentRouteIndex++;
        } else {
          clearInterval(intervalId);
          setSimulateWalking(false);
        }
      }, 1000);
    }
  };

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
      <div>
        {route ? (
          <div
            style={{
              position: "absolute",
              bottom: "0px",
              height: "200px",
              zIndex: "100",
              width: "100%",
              paddingTop: "10px",
              backgroundColor: "white",
            }}
          >
            <h3>Current Step:</h3>
            <p
              dangerouslySetInnerHTML={{ __html: instructions[currentStep] }}
            ></p>
            <button
              onClick={() => {
                setSimulateWalking(
                  (prevSimulateWalking) => !prevSimulateWalking
                );
                if (!simulateWalking) {
                  simulateWalkingFunction();
                }
              }}
            >
              {simulateWalking ? "Stop Simulation" : "Simulate Walking"}
            </button>
          </div>
        ) : (
          mapRef && (
            <div
              style={{
                position: "absolute",
                bottom: "0px",
                height: "75px",
                zIndex: "100",
                width: "100%",
                paddingTop: "10px",
              }}
            >
              <SearchBox
                accessToken={mapboxAccessToken}
                options={{
                  language: "en",
                }}
                popoverOptions={{
                  placement: "top-start",
                  flip: true,
                  offset: 5,
                }}
                placeholder="Search"
                value={searchbartext}
                onChange={(e) => {
                  console.log(e);
                  setSearchbarText(e);
                }}
                onRetrieve={pickedDestination}
                style={{ height: "75px" }}
                marker={true}
                map={mapRef.current && mapRef.current.getMap()}
              ></SearchBox>
            </div>
          )
        )}
      </div>
      <Map
        ref={mapRef}
        mapLib={import("mapbox-gl")}
        initialViewState={viewport}
        style={{ width: "100vw", height: "100vh" }}
        mapStyle="mapbox://styles/kyritzb/clv723iv1004b01pe7ucm03ld"
        mapboxAccessToken={mapboxAccessToken}
        onLoad={onMapLoad}
      >
        {/* GeolocateControl to track user's location 
        
        <GeolocateControl
          ref={geoControlRef}
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={true}
          auto
        />
        */}

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

        {destination && (
          <Marker
            longitude={destination[0]}
            latitude={destination[1]}
            anchor="bottom"
          ></Marker>
        )}

        {route && (
          <Source
            id="route"
            type="geojson"
            data={{
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: route,
              },
            }}
          >
            <Layer
              id="route-layer"
              type="line"
              source="route"
              layout={{
                "line-join": "round",
                "line-cap": "round",
              }}
              paint={{
                "line-color": "#007cbf",
                "line-width": 8,
              }}
            />
          </Source>
        )}

        {stepCoordinates.map((coord, index) => (
          <Marker
            key={index}
            longitude={coord[0]}
            latitude={coord[1]}
            anchor="center"
          >
            <div
              style={{
                backgroundColor: "rgba(0, 255, 0, 0.4)",
                borderRadius: "50%",
                width: "50px",
                height: "50px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  backgroundColor: "red",
                  borderRadius: "50%",
                  width: "10px",
                  height: "10px",
                }}
              ></div>
            </div>
          </Marker>
        ))}
      </Map>
    </>
  );
};

export default App;
