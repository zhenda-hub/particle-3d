import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
    input: 'src/core/ParticleSystem.js',
    output: [
        {
            file: 'dist/particle-system.min.js',
            format: 'umd',
            name: 'ParticleSystem',
            globals: {
                'three': 'THREE'
            },
            exports: 'named',
            extend: true
        },
        {
            file: 'dist/particle-system.esm.js',
            format: 'es'
        }
    ],
    external: ['three'],
    plugins: [
        nodeResolve(),
        terser({
            format: {
                comments: false
            }
        })
    ]
};
