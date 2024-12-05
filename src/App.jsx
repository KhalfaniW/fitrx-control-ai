import React, { useState, useEffect } from "react";

const API_BASE_URL = "/api";

const App = () => {
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageMimeType, setImageMimeType] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [goalMessage, setGoalMessage] = useState("");
  const [newGoal, setNewGoal] = useState("");

  // Set message helper
  const handleSetMessage = (msg) => {
    setMessage(msg);
    // Optionally clear the message after 3 seconds
    // setTimeout(() => setMessage(''), 3000);
  };

  useEffect(() => {
    const setupInitial = async () => {
      try {
        const goalResponse = await fetch(`${API_BASE_URL}/goal`);
        const goalText = await goalResponse.text();
        setGoalMessage(goalText);
      } catch (error) {
        setStatusMessage(`Error fetching goal: ${error.message}`);
      }
    };
    setupInitial();
  }, []);

  const pollStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/status`);
      const status = await response.json(); // Parse JSON response
      setStatusMessage(`Level: ${status.level}, Mode: ${status.mode}`);
    } catch (error) {
      setStatusMessage(`Error fetching status: ${error.message}`);
    }
  };

  // useEffect(() => {
  //   const intervalId = setInterval(pollStatus, 500);
  //   return () => clearInterval(intervalId);
  // }, []);

  const callEndpoint = async (endpoint) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
      });
      const data = await response.text();
      handleSetMessage(data);
    } catch (error) {
      handleSetMessage(`Error: ${error.message}`);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        setImagePreview(imageData);
      };
      reader.readAsDataURL(file);
      setImageMimeType(file.type);
    }
  };

  const uploadImage = async () => {
    if (!imagePreview) {
      handleSetMessage("Please select an image first");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/upload-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imagePreview.split(",")[1], // Get base64 encoded image
          mimeType: imageMimeType,
        }),
      });
      const data = await response.text();
      handleSetMessage(data);
    } catch (error) {
      handleSetMessage(`Error uploading image: ${error.message}`);
    }
  };

  const updateGoal = async (newGoal) => {
    try {
      const response = await fetch(`${API_BASE_URL}/set-goal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: newGoal }),
      });
      const data = await response.text();
      setGoalMessage(newGoal);
      handleSetMessage(data);
    } catch (error) {
      handleSetMessage(`Error updating goal: ${error.message}`);
    }
  };
  const updateLevel = async (newLevel) => {
    try {
      const response = await fetch(`${API_BASE_URL}/set-level`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: newLevel }),
      });
      const data = await response.text();
    } catch (error) {
      handleSetMessage(`Error updating goal: ${error.message}`);
    }
  };

  const updateMode = async (newMode) => {
    try {
      const response = await fetch(`${API_BASE_URL}/set-mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      });
      const data = await response.text();
      handleSetMessage(data);
    } catch (error) {
      handleSetMessage(`Error updating mode: ${error.message}`);
    }
  };

  const captureScreenFromServer = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      handleSetMessage(`Capture Result: ${data.explanation}`);
    } catch (error) {
      handleSetMessage(`Error capturing screen: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center text-gray-800">
        FitRx Controls
      </h1>

      <div className="space-x-4 flex justify-center">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => callEndpoint("/setup")}
        >
          Setup
        </button>
        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => callEndpoint("/increase")}
        >
          Increase
        </button>
        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => updateLevel(4)}
        >
          prioritize
        </button>
        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => callEndpoint("/decrease")}
        >
          Decrease
        </button>
        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => callEndpoint("/end")}
        >
          end
        </button>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => updateMode(1)} // You can adjust mode number as needed
        >
          Change Mode
        </button>
        <button
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          onClick={captureScreenFromServer}
        >
          Capture Screen
        </button>
      </div>

      <div className="space-y-4">
        <input
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
          type="file"
          accept="image/*"
          capture="camera"
          onChange={handleFileUpload}
        />
        <button
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          onClick={uploadImage}
        >
          Upload Image
        </button>
        <input
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg"
          type="text"
          placeholder="Enter new goal"
          value={newGoal}
          onChange={(e) => setNewGoal(e.target.value)}
        />
        <button
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => updateGoal(newGoal)}
        >
          Update Goal
        </button>
      </div>

      <div>
        <div>Goal:</div>
        <div>{goalMessage}</div>
      </div>

      <div className="flex justify-center">
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Preview"
            width={200}
            className="border border-gray-300 rounded-lg shadow-md"
          />
        )}
      </div>

      <div className="text-gray-700 text-center">
        <p className="font-bold">Status:</p>
        <code>{statusMessage}</code>
      </div>

      <div className="text-center  mt-4">
        <code>{message}</code>
      </div>
    </div>
  );
};

export default App;
