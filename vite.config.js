import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: '.',
    resolve: {
        alias: {
            '@core': resolve(__dirname, 'src/core'),
            '@infrastructure': resolve(__dirname, 'src/infrastructure'),
            '@store': resolve(__dirname, 'src/store'),
            '@ui': resolve(__dirname, 'src/ui'),
            '@assets': resolve(__dirname, 'src/assets'),
        },
    },
    build: {
        rollupOptions: {
            input: {
                index: resolve(__dirname, 'index.html'),
                ordenes: resolve(__dirname, 'ordenes.html'),
                reportes: resolve(__dirname, 'reportes.html'),
                historial: resolve(__dirname, 'historial.html'),
            },
        },
    },
    server: {
        port: 3000,
        open: true,
    },
});