const cors = require("cors");

const corsMiddleware = cors({
  origin: true,
  credentials: true,
});
