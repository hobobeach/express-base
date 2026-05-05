import hbs from 'express-handlebars';
import cookieParser from 'cookie-parser';
import createError from 'http-errors';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import passport from 'passport';
import express, { 
  Express, Request, Response, NextFunction 
} from 'express';
import dotenv from 'dotenv';

import { config } from './shared/config';
import { errorHandler } from './middlewares/error';
import { log } from './shared/log';

const environment = process.env.NODE_ENV || 'development';
dotenv.config({
  path: path.resolve(__dirname, `../.env.${environment}`)
});
log('Server is running in the ' + environment + ' environment.');

import { jwtStrategy } from './shared/jwt';
import { indexRouter } from './routes/index';

const app: Express = express();

passport.use('jwt', jwtStrategy);

app.engine('hbs', hbs({
  partialsDir: [
    path.join(__dirname, '../views/partials'),
  ],
  extname: 'hbs',
  defaultLayout: config.layout
}));
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'hbs');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      'style-src': ["'self'", "'unsafe-inline'"],
    },
  },
}));
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/', indexRouter);

// Catch 404s and forward to error handler
app.use((request: Request, response: Response, next: NextFunction) => {
  next(createError(404, 'The requested resource was not found.'));
});
app.use(errorHandler);

export default app;