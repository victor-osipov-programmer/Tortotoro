const express = require('express');
const app = express();
const router = require('./router');
const cors = require('cors');
const middlewares = require('./middlewares');

const port = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());
app.use('/api-tort', router);
app.use(middlewares.handleErrors);

app.listen(port, () => {
    console.log(`Server started http://localhost:${port}`);
});