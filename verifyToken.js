const jwt = require("jsonwebtoken");

function verify(req, res, next) {
  const authHeader = req.headers.authorization;

  console.log(authHeader, "token");

  if (!authHeader) {
    return res
      .status(401)
      .json({ status: false, message: "Authorization header is missing" });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ status: false, message: "Invalid token format" });
  }

  const token = authHeader.slice(7);

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) {
      console.log(err);
      if (err.name === "TokenExpiredError") {
        return res
          .status(403)
          .json({ status: false, message: "Token has expired" });
      } else {
        return res
          .status(403)
          .json({ status: false, message: "Token is not valid" });
      }
    }

    console.log("Decoded User:", user);
    req.user = user;
    next();
  });
}

module.exports = verify;
