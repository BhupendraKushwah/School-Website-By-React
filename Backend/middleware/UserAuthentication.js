const jwt = require('jsonwebtoken');
require('dotenv').config();

const FetchAdmin = (req, res, next) => {
    const token = req.header('Auth_Token');
    if (!token) {
        return res.status(401).json({ error: "Unauthorized access. Invalid or expired token." });
    }
    try {
        const data = jwt.verify(token, process.env.JWT_SECRET_KEY)
        req.user = data
        console.log(data)
        next();
    }
    catch (e) {
        res.json(e.message)
    }
}
module.exports = FetchAdmin;