const express = require('express');
const router = express.Router();
const controllers = require('./controllers');
const { auth } = require('./middlewares');

router.post('/login', controllers.login);
router.get('/logout', auth([]), controllers.logout);
router.get('/user', auth(['Admin']), controllers.getUsers);

module.exports = router;