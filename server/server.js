import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { answerImageQuestionWithJSON } from "gemini-ai";
import setFitRxLevel from "./util/set-bluetooth-level.js";
import fs from "fs";
import path from "path";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));

// Tasker command functions
function setupFitRx() {}

function increaseFitRx() {
  setFitRxLevel(4);
}

function decreaseFitRx() {
  setFitRxLevel(0);
}

async function endFitRx() {
  setFitRxLevel(0);
}

async function makeRequest(cmd) {
  cmd();
}

export function createFitRxApp() {
  const stateFilePath = path.join(import.meta.dirname, "state.json");
  let goal;

  // Load state from JSON file
  function loadState() {
    try {
      if (!fs.existsSync(stateFilePath)) {
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

  // Save state to JSON file
  function updateStoredState(stateChange) {
    const state = loadState();
    fs.writeFileSync(
      stateFilePath,
      JSON.stringify({ state, ...stateChange }),
      "utf-8"
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
      res.send("Goal updated successfully");
    } catch (error) {
      res.status(500).send("Error updating goal");
    }
  });

  app.post("/setup", async (req, res, next) => {
    try {
      await makeRequest(setupFitRx);
      res.send("FitRx setup completed");
    } catch (error) {
      next(error);
    }
  });

  app.post("/setup1", async (req, res, next) => {
    try {
      console.log("setup clicked");
      await makeRequest('performTask("Setup FitRx",99999);');
      res.send("FitRx setup completed");
    } catch (error) {
      next(error);
    }
  });

  app.post("/increase", async (req, res, next) => {
    try {
      console.log("increase received");
      await makeRequest(increaseFitRx);
      res.send("FitRx increased");
    } catch (error) {
      next(error);
    }
  });

  app.post("/decrease", async (req, res, next) => {
    try {
      console.log("decrease received");
      await makeRequest(decreaseFitRx);
      res.send("FitRx decreased");
    } catch (error) {
      next(error);
    }
  });

  app.post("/end", async (req, res, next) => {
    try {
      console.log("end FitRx");
      await makeRequest(endFitRx);
      res.send("FitRx ended");
    } catch (error) {
      next(error);
    }
  });

  app.post("/upload-image", async (req, res, next) => {
    try {
      const { image, mimeType } = req.body;
      if (image) {
        await makeRequest(endFitRx);
      }

      const { isMatch, explanation } = await handleImageSubmission({
        goal,
        image,
        mimeType,
      });
      const isFailed = !isMatch;
      if (isFailed) {
        await makeRequest(increaseFitRx);
      }
      res.send({ isMatch, explanation });
    } catch (error) {
      next(error);
    }
  });

  app.post("/custom", async (req, res, next) => {
    try {
      const { code } = req.body;
      await makeRequest(code);
      res.send("Custom code executed");
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
