import express from 'express';
import cors from 'cors';
import reservasRouter from '../src/routes/reservas';
import mesasRouter from '../src/routes/mesas';
import disponibilidadRouter from '../src/routes/disponibilidad';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/reservas', reservasRouter);
app.use('/api/mesas', mesasRouter);
app.use('/api/disponibilidad', disponibilidadRouter);

app.get('/', (req, res) => {
  res.json({ message: 'API El Rinconcito de Anaga' });
});

export default app;
