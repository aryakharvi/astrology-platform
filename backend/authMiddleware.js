const jwt = require("jsonwebtoken");

const JWT_SECRET =
    "astrology_platform_secret_key_2026";


function authenticateToken(
    req,
    res,
    next
) {

    const authHeader =
        req.headers["authorization"];


    // No Authorization header
    if (!authHeader) {

        return res.status(401).json({

            message:
                "Access denied. No token provided."

        });

    }


    const parts =
        authHeader.split(" ");


    // Wrong format
    if (
        parts.length !== 2 ||
        parts[0] !== "Bearer"
    ) {

        return res.status(401).json({

            message:
                "Invalid authorization format."

        });

    }


    const token =
        parts[1];


    try {

        const decoded =
            jwt.verify(
                token,
                JWT_SECRET
            );


        // Store decoded user
        // information in request
        req.user = decoded;


        next();

    } catch (error) {

        console.error(
            "JWT verification error:",
            error.message
        );


        return res.status(401).json({

            message:
                "Invalid or expired token."

        });

    }

}


module.exports =
    authenticateToken;