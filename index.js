const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(require("cors")());

const EMAIL = process.env.EMAIL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ------------------ FUNCTIONS ------------------

function fibonacci(n) {
  if (n === 1) return [0];
  let res = [0, 1];
  for (let i = 2; i < n; i++) {
    res.push(res[i - 1] + res[i - 2]);
  }
  return res.slice(0, n);
}

function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

function gcd(a, b) {
  while (b) {
    let t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function findHCF(arr) {
  return arr.reduce((a, b) => gcd(a, b));
}

function findLCM(arr) {
  const lcm = (a, b) => (a * b) / gcd(a, b);
  return arr.reduce((a, b) => lcm(a, b));
}

// ------------------ HEALTH API ------------------

app.get("/health", (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: EMAIL,
  });
});

// ------------------ GET /bfhl (optional but common requirement) ------------------

app.get("/bfhl", (req, res) => {
  res.status(200).json({
    is_success: true,
    message: "BFHL API is running. Use POST /bfhl with a JSON body.",
  });
});

// ------------------ MAIN API ------------------

app.post("/bfhl", async (req, res) => {
  try {
    const body = req.body;

    // Validation - must have exactly one key
    if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
      return res.status(400).json({
        is_success: false,
        message: "Request body must be a non-empty JSON object",
      });
    }

    const key = Object.keys(body)[0];
    const value = body[key];

    let output;

    switch (key) {

      case "fibonacci":
        if (!Number.isInteger(value) || value <= 0) {
          throw new Error("Invalid Fibonacci Input: must be a positive integer");
        }
        output = fibonacci(value);
        break;

      case "prime":
        if (!Array.isArray(value)) {
          throw new Error("Invalid Prime Input: must be an array of numbers");
        }
        output = value.filter(isPrime);
        break;

      case "lcm":
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error("Invalid LCM Input: must be a non-empty array");
        }
        output = findLCM(value);
        break;

      case "hcf":
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error("Invalid HCF Input: must be a non-empty array");
        }
        output = findHCF(value);
        break;

case "AI":
case "ai":
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("Invalid AI Input: must be a non-empty string");
  }

  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  try {
    const aiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: value }],
          },
        ],
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 15000,
      }
    );

    output =
      aiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from AI";

  } catch (aiError) {
    const geminiMsg =
      aiError.response?.data?.error?.message ||
      aiError.response?.status ||
      aiError.message ||
      "Unknown Gemini API error";

    console.error("Gemini API Error:", geminiMsg);
    throw new Error(`Gemini API failed: ${geminiMsg}`);
  }
  break;

      default:
        throw new Error(
          `Invalid key: "${key}". Allowed keys: fibonacci, prime, lcm, hcf, AI`
        );
    }

    // ✅ Success Response
    res.status(200).json({
      is_success: true,
      official_email: EMAIL,
      data: output,
    });

  } catch (err) {
    console.error("Request Error:", err.message);

    // ✅ Always return meaningful error message
    res.status(400).json({
      is_success: false,
      error: err.message || err.toString(),
    });
  }
});

// ------------------ SERVER ------------------

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server Running on Port ${PORT}`);
  console.log(`EMAIL: ${EMAIL}`);
  console.log(`GEMINI_API_KEY set: ${!!GEMINI_API_KEY}`); // ✅ logs true/false on startup
});