import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { healthResponseSchema } from '@neet/shared';

const app = express();
const port = Number(process.env.API_PORT ?? 4000);

app.use(helmet());
app.use(cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/v1/health', (_request, response) => {
  const payload = healthResponseSchema.parse({
    status: 'ok',
    service: 'api',
    version: '0.1.0',
  });
  response.json(payload);
});

app.use((_request, response) => {
  response.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested API route was not found.',
    },
  });
});

app.listen(port, () => {
  console.log(`NEET API listening on http://localhost:${port}`);
});
