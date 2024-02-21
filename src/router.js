const express = require('express');
const router = express.Router();
const controllers = require('./controllers');
const { auth } = require('./middlewares');
const multer = require('multer');
const upload = multer({ dest: 'photos/' });

router.get('/order/taken', auth(['Cook']), controllers.getOrdersCurrentWorkShift);

router.post('/login', controllers.login);
router.get('/logout', auth(['all']), controllers.logout);
router.get('/user', upload.none(), auth(['Admin']), controllers.getUsers);
router.post('/user', upload.single('photo_file'), auth(['Admin']), controllers.createUser);
router.post('/work-shift', auth(['Admin']), controllers.createWorkShift);
router.get('/work-shift/:id/open', auth(['Admin']), controllers.openWorkShift);
router.get('/work-shift/:id/close', auth(['Admin']), controllers.closeWorkShift);
router.post('/work-shift/:id/user', auth(['Admin']), controllers.addUserToOnWorkShift);

router.get('/work-shift/:id/orders', auth(['Admin', 'Waiter']), controllers.getOrdersWorkShift);

router.post('/order', auth(['Waiter']), controllers.createOrder);
router.get('/order/:id', auth(['Waiter']), controllers.getDetailsOrder);
router.patch('/order/:id/change-status', auth(['Waiter']), controllers.updateOrderStatus);

module.exports = router;