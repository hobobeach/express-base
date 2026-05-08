import { DataSource } from 'typeorm';
import 'reflect-metadata';
// PLUGINS: data-source-import

export const AppDataSource = new DataSource({
    type: 'sqlite',
    database: process.env.DATABASE_NAME || 'database.sqlite',
    entities: [
        // PLUGINS: entities
    ],
    logging: true,
    synchronize: true,
});
