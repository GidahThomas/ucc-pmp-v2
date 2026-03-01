import app from './app';
import { env } from './config';

app.listen(env.API_PORT, () => {
  console.log(`API server listening on http://localhost:${env.API_PORT}`);
});
