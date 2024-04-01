import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "./App.css";

mapboxgl.accessToken =
  "pk.eyJ1Ijoia3lyaXR6YiIsImEiOiJjbHVoZDJpZTUyazFlMm1wNmtqeWFwbzIzIn0.dxpXiLCDsPtNDDbKx2ksLA";

function App() {
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [coordinates, setCoordinates] = useState([
    [-73.9975, 40.730833], // Coordinate 1
    [-74.006, 40.7128], // Coordinate 2
    // Add more coordinates as needed
  ]);

  // Function to update coordinates, moving them north
  const getDots = (currentCoords) => {
    return currentCoords.map(([lng, lat]) => [lng, lat + 0.01]);
  };

  // Initialize map only once
  useEffect(() => {
    const newMap = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/navigation-day-v1",
      center: [-74.006, 40.7128],
      zoom: 9,
      pitch: 45,
      bearing: -17.6,
      projection: "mercator",
    });

    newMap.on("load", () => {
      // Points source and layer
      newMap.addSource("points-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: coordinates.map((coord) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: coord,
            },
          })),
        },
      });

      newMap.addLayer({
        id: "points-layer",
        type: "circle",
        source: "points-source",
        paint: {
          "circle-radius": 10,
          "circle-color": "#800080",
        },
      });

      // LineString source and layer
      const lineData = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [-8161292, 5694276],
            [-8163264, 5694580],
          ],
        },
        properties: {},
      };

      newMap.addSource("line-source", {
        type: "geojson",
        data: lineData,
      });

      newMap.addLayer({
        id: "line-layer",
        type: "line",
        source: "line-source",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#1f1f1f", // Use the color from the data
          "line-width": 5,
        },
      });
    });

    setMap(newMap);

    // Cleanup function to remove map on component unmount
    return () => {
      newMap.remove();
    };
  }, []); // Empty dependency array ensures this effect runs only once

  // Effect to update coordinates every 2 seconds
  useEffect(() => {
    if (!map) return; // Ensure map is initialized

    const intervalId = setInterval(() => {
      const newCoords = getDots(coordinates);
      setCoordinates(newCoords);

      // Update the map source with new coordinates
      map.getSource("points-source").setData({
        type: "FeatureCollection",
        features: newCoords.map((coord) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: coord,
          },
        })),
      });
    }, 2000);

    // Cleanup interval
    return () => clearInterval(intervalId);
  }, [map, coordinates]); // Depend on map and coordinates to trigger re-render

  return (
    <div
      ref={mapContainerRef}
      className="App"
      style={{ width: "100vw", height: "100vh" }}
    ></div>
  );
}

export default App;
