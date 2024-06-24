"use strict";

const http = require("http");
const express = require("express");
const bodyparser = require("body-parser");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const { v1 } = require("./api/v1.api");
const path = require("path");
const swaggerUI = require("swagger-ui-express");
const YAML = require("yaml");
const fs = require("fs");
const file = fs.readFileSync(`${__dirname}/api-docs.yaml`, "utf-8");
const cors = require("cors");
const compression = require('compression');
const {limiterfast, initialize} = require('./db/redis')

require("dotenv").config();
require("./utils/instrument");
const Sentry = require("@sentry/node");
Sentry.init({ dsn: process.env.SENTRY_DSN });
// const WebSocket = require("ws");

const swaggerDocument = YAML.parse(file);

var corsOptions = {
  origin: [
    "https://ourair.tech",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3001",
    "http://localhost:3000",
    "https://ourair.my.id",
    "https://accounts.google.com/o/oauth2/v2",
    "https://bw2nj1xt-3001.asse.devtunnels.ms",
    "bw2nj1xt-3001.asse.devtunnels.ms",
  ],
  optionsSuccessStatus: 200,
  credentials: true,
};

require("dotenv").config();
const app = express()
  .set("trust proxy", 1)
  .use(cors(corsOptions))
  // .use(limiter)
  .use(cookieParser())
  .use(compression())
  .set("views", path.join(__dirname, "./views"))
  .use("/custom.css", express.static(path.join(__dirname, "./style.css")))
  .use(
    "/v1/api-docs",
    swaggerUI.serve,
    swaggerUI.setup(swaggerDocument, {
      customCssUrl: "/custom.css",
    })
  )
  .use(logger("dev"))
  .set("view engine", "ejs")
  .use(express.json())
  .use(bodyparser.json())
  .use(express.urlencoded({ extended: true }))
  .use(bodyparser.urlencoded({ extended: true }))
  .use("/api/v1", v1)
  .get("/apasih", (req, res) => {
    res.render("websocket");
  })
  .get("/email", (req, res) => {
    const data = { otp: "247824", name: "Our Air wow" };
    res.render("email", data);
  })
  .get("/", limiterfast, (req, res) => {
    return res.status(200).json({
      status: true,
      message: "hello world",
    });
  })

  //Taro sentry disini, cek repository mas tatang

  // Optional fallthrough error handler
  .use(function onError(err, req, res, next) {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    res.statusCode = 500;
    res.end(res.sentry + "\n");
  })
  //500
  .use((err, req, res, next) => {
    res.status(500).json({
      status: false,
      message: err.message,
      data: null,
    });
  })

  //404
  .use((req, res, next) => {
    res.status(404).json({
      status: false,
      message: `are you lost? ${req.method} ${req.url} is not registered!`,
      data: null,
    });
  });

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Replace with your frontend domain
    methods: ["GET", "POST"],
    allowedHeaders: ["token"],
    credentials: true,
  },
});
// The error handler must be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

const PORT = 3001;
// const PORT_WS = 8085;

//kerjaan huzi websocket
// const server_huzi = http.createServer(app);

// server_huzi.on('upgrade', (request, socket, head) => {
//   webSocketServer.handleUpgrade(request, socket, head, (ws) => {
//       webSocketServer.emit('connection', ws, request);
//   });
// });

app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});


app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});

app.listen(PORT, async () => {
  console.log(`listening on port ${PORT}`);
});

// CRON Section
const seedFlight = require("./seeds/cron-flight");
const cron = require('node-cron');

cron.schedule('0 0 * * *', () => {
  seedFlight()
});

//tesss

// //kerjaan samuel websocket
// // const server_samuel = app.listen(PORT_WS, () => {
// //   console.log(`Express server listening on port ${PORT_WS}`);
// // });

// const wss = new WebSocket.Server({ server_huzi });
// app.locals.wss = wss;

// wss.on("connection", function connection(ws) {
//   console.log("New WebSocket connection");

// ws.on("message", function incoming(message) {
//     console.log(`Received: ${message}`);
//     ws.send(`Echo: ${message}`);
//   });
// });
