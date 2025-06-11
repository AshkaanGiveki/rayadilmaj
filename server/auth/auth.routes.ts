// // auth.routes.ts
// import express from 'express';
// import { login, refresh, register, logout, me } from './auth.controller.js';

// const router = express.Router();

// router.post('/login', login);
// router.post('/refresh', refresh);
// router.post('/register', register);
// router.post('/logout', logout);
// router.get('/me', me);

// export default router;

import express from 'express';
import {
  login,
  refresh,
  register,
  logout,
  me,
} from './auth.controller.js'; // keep .js if you're using ts-node or "type": "module"

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/register', register);
router.post('/logout', logout);
router.get('/me', me);

export default router;
