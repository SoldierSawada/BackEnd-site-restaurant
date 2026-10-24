import { Server } from 'http';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { useContainer, useExpressServer } from 'routing-controllers';
import { AppKernel } from './AppKernel';
import { DomainErrorMiddleware } from '../middlewares/DomainErrorMiddleware';
import { AuthenticationMiddleware } from '../middlewares/AuthenticationMiddleware';

import { ReservationController } from '../modules/restaurant/ReservationController';
import { ReservationModule } from '../modules/restaurant/ReservationModule';
import { MemberController } from '../modules/membership/MemberController';
import { MemberModule } from '../modules/membership/MemberModule';
import { AdminController } from '../modules/admin/AdminController';
import { AdminModule } from '../modules/admin/AdminModule';
import { ReviewController } from '../modules/review/ReviewController';
import { ReviewModule } from '../modules/review/ReviewModule';
import { BlogController } from '../modules/blog/BlogController';
import { BlogModule } from '../modules/blog/BlogModule';
import { MenuController } from '../modules/menu/MenuController';
import { MenuModule } from '../modules/menu/MenuModule';
import { seedAdmin } from './SeedAdmin';
import { seedContent } from './SeedContent';
import { NotificationHub } from '../modules/notification/NotificationHub';

export async function setup(app: Application, server: Server): Promise<Application> {
  app.use(express.json());
  app.use(morgan('dev'));
  app.use(cors());

  const container = await new AppKernel().setup();
  useContainer(container);
  await seedAdmin(container);
  await seedContent(container);

  new ReservationModule().configure(container);
  new MemberModule().configure(container);
  new AdminModule().configure(container);
  new ReviewModule().configure(container);
  new BlogModule().configure(container);
  new MenuModule().configure(container);
  container.bind(DomainErrorMiddleware).toSelf();
  container.bind(AuthenticationMiddleware).toSelf();
  container.bind(NotificationHub).toSelf().inSingletonScope();
  container.get(NotificationHub).attach(server);

  app.get('/status', (_req: Request, res: Response) => {
    res.sendStatus(200);
  });

  useExpressServer(app, {
    routePrefix: '/restaurant',
    defaultErrorHandler: false,
    middlewares: [DomainErrorMiddleware],
    classTransformer: true,
    validation: true,
    controllers: [
      ReservationController,
      MemberController,
      AdminController,
      ReviewController,
      BlogController,
      MenuController,
    ],
  });

  return app;
}
