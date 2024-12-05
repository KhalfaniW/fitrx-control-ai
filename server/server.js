import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { answerImageQuestionWithJSON } from "gemini-ai";
import {
  queryFitRxStatus,
  setFitRxLevel,
  setFitRxMode,
  setupBluetoothServer,
} from "./util/bluetooth.js";
import fs from "fs";
import path from "path";
import { captureScreen } from "./util/capture.js";
dotenv.config();

const { server: bluetoothServer, cleanup } = await setupBluetoothServer();

const queryStatus = async () => await queryFitRxStatus(bluetoothServer);

console.log("initalStatus", await queryStatus());

const setLevel = async (level) => await setFitRxLevel(bluetoothServer, level);
const setMode = async (mode) => await setFitRxMode(bluetoothServer, mode);
const app = express();

app.use(cors());
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));

async function increaseFitRx() {
  const currentLevel = (await queryStatus()).level;
  if (currentLevel < 9) {
    await setLevel(currentLevel + 1);
  }
}

async function decreaseFitRx() {
  const currentLevel = (await queryStatus()).level;
  if (currentLevel > 0) {
    await setLevel(currentLevel - 1);
  }
}

async function endFitRx() {
  await setLevel(0);
}

export function createFitRxApp() {
  const stateFilePath = path.join(import.meta.dirname, "state.json");
  let goal;

  // Load state from JSON file
  function loadState() {
    try {
      const fileDoesNotExist = !fs.existsSync(stateFilePath);
      if (fileDoesNotExist) {
        const initialState = {
          goal: process.env.INITIAL_GOAL,
        };
        fs.writeFileSync(stateFilePath, JSON.stringify(initialState), "utf-8");
      }
      const data = fs.readFileSync(stateFilePath, "utf-8");
      const state = JSON.parse(data);
      goal = state.goal;
      return state;
    } catch (error) {
      console.error("Could not load state:", error);
      goal = process.env.INITIAL_GOAL || "Default goal";
      return { goal };
    }
  }

  function updateStoredState(stateChange) {
    const state = loadState();
    fs.writeFileSync(
      stateFilePath,
      JSON.stringify({ ...state, ...stateChange }),
      "utf-8",
    );
  }

  loadState();

  app.get("/", (req, res) => {
    res.send("hello");
  });

  app.get("/goal", (req, res) => {
    res.send(goal);
  });

  app.post("/set-goal", (req, res) => {
    try {
      goal = req.body.goal;
      updateStoredState({ goal });
      console.log("new state", loadState());
      res.send("Goal updated successfully");
    } catch (error) {
      res.status(500).send("Error updating goal");
    }
  });

  app.post("/set-level", async (req, res) => {
    try {
      const { level } = req.body;
      await setLevel(level);
      res.send(await queryStatus());
    } catch (error) {
      console.error(error);
      res.status(500).send("Error updating FitRx level");
    }
  });

  app.post("/set-mode", async (req, res) => {
    try {
      const { mode } = req.body;
      await setMode(mode);
      res.send(await queryStatus());
    } catch (error) {
      console.error(error);
      res.status(500).send("Error updating FitRx mode");
    }
  });

  app.post("/set-fitrx", async (req, res) => {
    try {
      const { mode, level } = req.body;
      await setLevel(level);
      await setMode(mode);
      res.send(await queryStatus());
    } catch (error) {
      res.status(500).send("Error updating FitRx level");
    }
  });

  let isStatusProcessing = false;

  app.get("/status", async (req, res, next) => {
    if (isStatusProcessing) {
      return res.status(429).send("Too Many Requests");
    }
    isStatusProcessing = true;
    try {
      const status = await queryStatus();
      res.send(status);
    } catch (error) {
      next(error);
    } finally {
      isStatusProcessing = false;
    }
  });

  app.post("/increase", async (req, res, next) => {
    try {
      console.log("increase received");
      await increaseFitRx();
      res.send(await queryStatus());
    } catch (error) {
      next(error);
    }
  });

  app.post("/decrease", async (req, res, next) => {
    try {
      console.log("decrease received");
      await decreaseFitRx();
      res.send(await queryStatus());
    } catch (error) {
      next(error);
    }
  });

  app.post("/end", async (req, res, next) => {
    try {
      console.log("end FitRx");
      await endFitRx();
      res.send(await queryStatus());
    } catch (error) {
      next(error);
    }
  });

  app.post("/upload-image", async (req, res, next) => {
    try {
      const { image, mimeType } = req.body;
      if (image) {
        await endFitRx();
      }

      const { isMatch, explanation } = await handleImageSubmission({
        goal,
        image,
        mimeType,
      });
      const isFailed = !isMatch;
      if (isFailed) {
        await increaseFitRx();
      }
      res.send({ isMatch, explanation });
    } catch (error) {
      next(error);
    }
  });

  app.post("/capture", async (req, res, next) => {
    try {
      const { image, mimeType } = await captureScreen();
      const { isMatch, explanation } = await handleImageSubmission({
        goal,
        image,
        mimeType,
      });
      if (image) {
        await endFitRx();
      }
      if (!isMatch) {
        await increaseFitRx();
      }
      res.send({ isMatch, explanation });
    } catch (error) {
      next(error);
    }
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
  });

  const PORT = process.env.API_PORT || 3500;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  return app;
}

export async function handleImageSubmission({ goal, image, mimeType }) {
  console.log("checking image");
  const prompt = `if this is an image contains ${goal} (be strict about matching) then respond
    {match: true, explanation: why it match}
    else respond with {match:false, explanation } and give a explain why it doesn't match

    Be strict with the matching`;

  const functionResponse = await answerImageQuestionWithJSON({
    prompt,
    base64Image: image,
    mimeType,
    schema: {
      type: "object",
      properties: {
        explanation: {
          type: "string",
        },
        match: {
          type: "boolean",
        },
        isMatch: {
          type: "boolean",
        },
      },
      required: ["match", "isMatch", "explanation"],
    },
  });
  console.log("image response", functionResponse);
  const response = JSON.parse(functionResponse);
  const { match: isMatch, explanation } = response;
  return { isMatch, explanation };
}

// Start the server
createFitRxApp();
