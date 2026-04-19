require("dotenv").config();
const app = require("./app");

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Weather API Server listening on http://localhost:${port}`);
});