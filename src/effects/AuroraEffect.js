// 在浏览器中，THREE 已经通过 script 标签全局加载
const THREE = window.THREE;
import { BaseEffect } from '../core/BaseEffect';

export class AuroraEffect extends BaseEffect {
    constructor(options) {
        super(options);
        this.time = 0;
        this._initParticles();
    }

    _initParticles() {
        const count = this.options.count;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const phases = new Float32Array(count);

        // 极光的颜色范围
        const colorPalette = [
            new THREE.Color(0x88ff99), // 浅绿色
            new THREE.Color(0x4488ff), // 蓝色
            new THREE.Color(0x9944ff), // 紫色
            new THREE.Color(0x44ffff)  // 青色
        ];

        for (let i = 0; i < count; i++) {
            // 在半球形区域内分布粒子
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.5;
            const r = 5 + Math.random() * 5;

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.cos(phi) + 5; // 向上偏移
            positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

            // 随机选择颜色
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            // 随机大小
            sizes[i] = 0.05 + Math.random() * 0.15;

            // 随机相位
            phases[i] = Math.random() * Math.PI * 2;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        this.geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

        // 使用自定义着色器材质
        const vertexShader = `
            attribute float size;
            attribute float phase;
            varying vec3 vColor;
            uniform float time;
            
            void main() {
                vColor = color;
                
                // 添加波动效果
                vec3 pos = position;
                float wave = sin(phase + time * 2.0) * 0.5 + 0.5;
                pos.y += wave * 0.5;
                
                // 添加水平波动
                pos.x += sin(phase + time) * 0.3;
                pos.z += cos(phase + time * 0.7) * 0.3;
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const fragmentShader = `
            varying vec3 vColor;
            
            void main() {
                // 创建柔和的粒子效果
                float r = 0.0;
                vec2 cxy = 2.0 * gl_PointCoord - 1.0;
                r = dot(cxy, cxy);
                if (r > 1.0) {
                    discard;
                }
                
                // 添加发光效果
                float alpha = 1.0 - r;
                gl_FragColor = vec4(vColor, alpha);
            }
        `;

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            vertexColors: true
        });

        this.mesh = new THREE.Points(this.geometry, this.material);
    }

    update(delta) {
        this.time += delta;
        this.material.uniforms.time.value = this.time;
    }

    dispose() {
        super.dispose();
    }
}
