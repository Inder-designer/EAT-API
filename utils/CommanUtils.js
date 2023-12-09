const jwt = require("jsonwebtoken");

const resetToken = async (id, extras = {}, expiresIn = "10m") => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { id, ...extras },
      process.env.SECRET_KEY,
      {
        expiresIn,
      },
      (err, encoded) => {
        if (err) {
          reject(err.message);
        } else {
          resolve(encoded);
        }
      }
    );
  });
};

const decodedToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    console.log("Decoded User:", decoded);
    return decoded;
  } catch (err) {
    console.error("Error verifying token:", err);

    if (err.name === "TokenExpiredError") {
      console.log("Token has expired");
    } else {
      console.log("Token is not valid");
    }

    // Throw an exception to signal an error
    throw new Error("Token verification failed");
  }
};

module.exports = {
  resetToken,
  decodedToken,
};
