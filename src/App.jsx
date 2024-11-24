import React, { useState, useEffect } from "react";

const API_BASE_URL = "/api";

const App = () => {
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageMimeType, setImageMimeType] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [goalMessage, setGoalMessage] = useState("");

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
      const statusText = await response.text();
      setStatusMessage(statusText);
    } catch (error) {
      setStatusMessage(`Error fetching status: ${error.message}`);
    }
  };

  useEffect(() => {
    // const intervalId = setInterval(pollStatus, 500);
    // return () => clearInterval(intervalId);
  }, []);

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
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => callEndpoint("/decrease")}
        >
          Decrease
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

      <div className="text-center text-red-500 mt-4">
        <code>{message}</code>
      </div>
    </div>
  );
};

export default App;
