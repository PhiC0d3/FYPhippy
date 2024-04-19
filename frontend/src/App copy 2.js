import React, { useEffect, useRef, useState } from "react";
import { Map, Marker } from "maplibre-gl";
import "./App.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { SearchBox } from "@mapbox/search-js-react";
import { RealtimeLayer } from "mobility-toolbox-js/mapbox";
import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions";
import "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css";

import mapStyle from "./style/style.json";

const RealtimeMap = ({
  apiKey = "5cc87b12d7c5370001c1d6553983bc2b94014146b168ea7b563e7b7f",
  mapboxAccessToken = "pk.eyJ1Ijoia3lyaXR6YiIsImEiOiJjbHVoZDJpZTUyazFlMm1wNmtqeWFwbzIzIn0.dxpXiLCDsPtNDDbKx2ksLA",
}) => {
  const mapContainerRef = useRef(null);
  const [myLocation, setMyLocation] = useState({ lng: -74.006, lat: 40.7128 });
  const [destination, setDestination] = useState(null);
  const [map, setMap] = useState(null);
  const [directions, setDirections] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setMyLocation({
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        });
      });
    }
  }, []);

  useEffect(() => {
    const initMap = new Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [myLocation.lng, myLocation.lat],
      zoom: 12,
      pitch: 45,
      bearing: 0,
      terrain: { source: "mapbox-dem", exaggeration: 1.5 },
    });

    const directionsControl = new MapboxDirections({
      accessToken: mapboxAccessToken,
      unit: "metric",
      profile: "mapbox/walking",
      interactive: true,
    });
    initMap.addControl(directionsControl);
    setDirections(directionsControl);

    initMap.on("load", () => {
      initMap.addSource("circle", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [myLocation.lng, myLocation.lat],
          },
        },
      });

      initMap.addLayer({
        id: "circle",
        type: "circle",
        source: "circle",
        paint: {
          "circle-radius": 10,
          "circle-color": "blue",
          "circle-opacity": 0.3,
          "circle-stroke-color": "blue",
          "circle-stroke-width": 2,
        },
      });
    });

    setMap(initMap);
    return () => initMap.remove();
  }, [apiKey, myLocation, mapboxAccessToken]);

  useEffect(() => {
    if (map && destination && directions) {
      new Marker().setLngLat([destination[0], destination[1]]).addTo(map);
      //directions.setOrigin([myLocation.lng, myLocation.lat]);
      //directions.setDestination([destination[0], destination[1]]);
    }
  }, [destination, map, myLocation, directions]);

  return (
    <div>
      <div ref={mapContainerRef} style={{ height: "100vh", width: "100%" }} />
    </div>
  );
};

export default RealtimeMap;
