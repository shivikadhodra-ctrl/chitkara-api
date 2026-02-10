const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(require("cors")());

const EMAIL = process.env.EMAIL;

// ------------------ FUNCTIONS ------------------

function fibonacci(n) {
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
  function lcm(a, b) {
    return (a * b) / gcd(a, b);
  }

  return arr.reduce((a, b) => lcm(a, b));
}

// ------------------ HEALTH API ------------------

app.get("/health", (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: EMAIL,
  });
});

// ------------------ MAIN API ------------------

app.post("/bfhl", async (req, res) => {
  try {
    const body = req.body;

    // Validation
    if (!body || Object.keys(body).length !== 1) {
      return res.status(400).json({
        is_success: false,
        message: "Invalid Request Format",
      });
    }

    const key = Object.keys(body)[0];
    const value = body[key];

    let output;

    switch (key) {
      case "fibonacci":

        if (!Number.isInteger(value) || value <= 0)
          throw "Invalid Fibonacci Input";

        output = fibonacci(value);
        break;

      case "prime":

        if (!Array.isArray(value))
          throw "Invalid Prime Input";

        output = value.filter(isPrime);
        break;

      case "lcm":

        if (!Array.isArray(value))
          throw "Invalid LCM Input";

        output = findLCM(value);
        break;

      case "hcf":

        if (!Array.isArray(value))
          throw "Invalid HCF Input";

        output = findHCF(value);
        break;

      case "AI":

        if (typeof value !== "string")
          throw "Invalid AI Input";

        const aiResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            contents: [
              {
                parts: [{ text: value }],
              },
            ],
          }
        );

        output =
          aiResponse.data.candidates[0].content.parts[0].text
            .split(" ")[0];

        break;

      default:
        throw "Invalid Key";
    }

    // Success Response
    res.status(200).json({
      is_success: true,
      official_email: EMAIL,
      data: output,
    });

  } catch (err) {

    // Error Response
    res.status(400).json({
      is_success: false,
      error: err.toString(),
    });

  }
});

// ------------------ SERVER ------------------

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server Running on Port", PORT);
});
