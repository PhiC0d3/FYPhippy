const express = require("express");
const WebSocket = require("ws");
const http = require("http");
const cors = require("cors"); // Import cors
const axios = require("axios");

const app = express();
app.use(cors()); // Enable CORS for all routes
const server = http.createServer(app);
const port = 5001;

// Replace '<your_api_key>' with your actual geOps API key
const geOpsWebSocketURL =
  "wss://api.geops.io/tracker-ws/v1/?key=5cc87b12d7c5370001c1d6553983bc2b94014146b168ea7b563e7b7f";

app.get("/trajectories/:feed_name", async (req, res) => {
  const { feed_name } = req.params;
  const { bbox, gen_level, validate_output = false } = req.query;

  console.log("getting");
  try {
    const ws = new WebSocket(geOpsWebSocketURL);
    let responseSent = false; // Flag to track if the response has been sent

    ws.on("open", function open() {
      const bboxCommand = `BBOX ${bbox} [tenant=${feed_name}] [gen_level=${gen_level}]`;
      ws.send(bboxCommand);
    });

    ws.on("message", function incoming(data) {
      if (!responseSent) {
        try {
          const parsedData = JSON.parse(data);
          if (
            parsedData &&
            parsedData.content &&
            parsedData.source === "trajectory"
          ) {
            // Filter the data based on the feed_name
            const filteredData = parsedData.content.features.filter(
              (feature) => feature.properties.tenant === feed_name
            );
            const result = {
              ...parsedData.content,
              features: filteredData,
            };
            res.json(result); // Send the filtered data to the frontend
            responseSent = true; // Set the flag to true after sending the response
            ws.close();
          }
        } catch (error) {
          if (!responseSent) {
            console.error("Error parsing WebSocket message:", error);
            res.status(500).send("Error processing trajectory data");
            responseSent = true; // Ensure to set the flag here as well
            ws.close();
          }
        }
      }
    });

    ws.on("error", function error(err) {
      if (!responseSent) {
        console.error("WebSocket error:", err);
        res.status(500).send("WebSocket connection error");
        responseSent = true; // Set the flag to prevent further responses
      }
    });
  } catch (error) {
    console.error("Error setting up WebSocket connection:", error);
    res.status(500).send("Error setting up WebSocket connection");
  }
});

// New route to get feeds from geOps API
app.get("/getfeeds", async (req, res) => {
  try {
    // Replace '<your_api_key>' with your actual geOps API key
    const apiKey = "5cc87b12d7c5370001c1d6553983bc2b94014146b168ea7b563e7b7f";
    const response = await axios.get(
      `https://api.geops.io/tracker-http/v1/feeds/?key=${apiKey}`
    );
    res.json(response.data); // Send the data to the frontend
  } catch (error) {
    console.error("Error fetching feeds:", error);
    res.status(500).send("Error fetching feeds data");
  }
});

app.get("/getalltrains", (req, res) => {
  const ws = new WebSocket(geOpsWebSocketURL);
  let responseSent = false; // Flag to track if the response has been sent

  ws.on("open", function open() {
    const bboxCommand =
      "BBOX -20026376.39 -20048966.10 20026376.39 20048966.10 5";
    ws.send(bboxCommand);
  });

  ws.on("message", function incoming(data) {
    if (!responseSent) {
      // Check if the response has already been sent
      try {
        const parsedData = JSON.parse(data);
        if (
          parsedData &&
          parsedData.content &&
          parsedData.source === "trajectory"
        ) {
          res.json(parsedData.content); // Send the data to the frontend
          responseSent = true; // Set the flag to true after sending the response
          ws.close();
        }
      } catch (error) {
        if (!responseSent) {
          // Check again to prevent sending multiple error responses
          console.error("Error parsing WebSocket message:", error);
          res.status(500).send("Error processing train data");
          responseSent = true; // Ensure to set the flag here as well
          ws.close();
        }
      }
    }
  });

  ws.on("error", function error(err) {
    if (!responseSent) {
      // Ensure no response has been sent before sending an error response
      console.error("WebSocket error:", err);
      res.status(500).send("WebSocket connection error");
      responseSent = true; // Set the flag to prevent further responses
    }
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
