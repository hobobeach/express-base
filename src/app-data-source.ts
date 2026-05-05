import { DataSource } from 'typeorm';
import 'reflect-metadata';

export const AppDataSource = new DataSource({
    type: 'sqlite',
    database: process.env.DATABASE_NAME || 'database.sqlite',
    entities: [
    ],
    logging: true,
    synchronize: true,
});
