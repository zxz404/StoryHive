import { HomePg } from '../pages/home/home-pg.js';
import { LoginPg } from '../pages/auth/login-pg.js';
import { RegPg } from '../pages/auth/reg-pg.js';
import { AddSPg } from '../pages/add-s/add-s-pg.js';
import { SDetailPg } from '../pages/s-detail/s-detail-pg.js';

const routes = {
  '/home': HomePg,
  '/auth': LoginPg,
  '/register': RegPg,
  '/add-s': AddSPg,
  '/s/:id': SDetailPg,
};

export default routes;