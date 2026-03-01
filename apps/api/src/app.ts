import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';

import { env } from './config';
import { errorHandler } from './middleware';
import authRouter from './routes/auth';
import billingRouter from './routes/billing';
import dashboardRouter from './routes/dashboard';
import geographyRouter from './routes/geography';
import listSourcesRouter from './routes/list-sources';
import leasesRouter from './routes/leases';
import pricesRouter from './routes/property-prices';
import propertiesRouter from './routes/properties';
import propertyAttributesRouter from './routes/property-attributes';
import usersRouter from './routes/users';

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: false,
  }),
);
app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

app.get('/health', (_request, response) => {
  response.json({ ok: true });
});

app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/users', usersRouter);
app.use('/api/list-sources', listSourcesRouter);
app.use('/api/property-attributes', propertyAttributesRouter);
app.use('/api/geography', geographyRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/property-prices', pricesRouter);
app.use('/api/leases', leasesRouter);
app.use('/api/billing', billingRouter);

app.use(errorHandler);

export default app;
