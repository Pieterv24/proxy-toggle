import nodeResolve from '@rollup/plugin-node-resolve';

export default {
    input: 'src/proxy-popup.js',
    output: {
        dir: 'dist',
        format: 'iife'
    },
    plugins: [
        nodeResolve()
    ]
}