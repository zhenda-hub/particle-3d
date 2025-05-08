// 在浏览器中，THREE 已经通过 script 标签全局加载
const THREE = window.THREE;
import { BaseEffect } from '../core/BaseEffect';

export class WaterRippleEffect extends BaseEffect {
    constructor(options) {
        super(options);
        this.time = 0;
        this._initParticles();
    }

    _initParticles() {
        const count = this.options.count;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const phases = new Float32Array(count);
        const amplitudes = new Float32Array(count);
        const distances = new Float32Array(count);

        // 水的颜色
        const waterColor1 = new THREE.Color(0x0088ff); // 浅蓝色
        const waterColor2 = new THREE.Color(0x004488); // 深蓝色

        // 创建水面网格
        for (let i = 0; i < count; i++) {
            // 在圆形区域内均匀分布粒子 - 增大范围
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.sqrt(Math.random()) * 30; // 将半径从 10 增加到 30
            distances[i] = distance;
            
            positions[i * 3] = Math.cos(angle) * distance;
            positions[i * 3 + 1] = 0; // 初始高度为0
            positions[i * 3 + 2] = Math.sin(angle) * distance;

            // 随机相位和振幅 - 增大振幅
            phases[i] = Math.random() * Math.PI * 2;
            amplitudes[i] = 0.3 + Math.random() * 0.5; // 增大振幅使波纹更明显

            // 颜色 - 从中心到边缘渐变
            const colorFactor = distance / 30; // 调整为新的半径
            const color = waterColor1.clone().lerp(waterColor2, colorFactor);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
        this.geometry.setAttribute('amplitude', new THREE.BufferAttribute(amplitudes, 1));
        this.geometry.setAttribute('distance', new THREE.BufferAttribute(distances, 1));

        // 使用自定义着色器材质
        const vertexShader = `
            attribute float phase;
            attribute float amplitude;
            attribute float distance;
            varying vec3 vColor;
            uniform float time;
            
            void main() {
                vColor = color;
                
                // 计算波纹效果
                vec3 pos = position;
                float waveSpeed = 2.0;
                float waveFrequency = 0.8;
                
                // 创建多个波源
                float wave1 = sin(distance * waveFrequency + time * waveSpeed + phase) * amplitude;
                float wave2 = sin(distance * waveFrequency * 1.5 + time * waveSpeed * 0.8 + phase * 1.2) * amplitude * 0.5;
                float wave3 = sin(distance * waveFrequency * 0.8 + time * waveSpeed * 1.2 + phase * 0.8) * amplitude * 0.3;
                
                // 组合波形
                pos.y = wave1 + wave2 + wave3;
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = 3.0 * (300.0 / -mvPosition.z);
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
                
                gl_FragColor = vec4(vColor, 1.0);
            }
        `;

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            vertexColors: true
        });

        this.points = new THREE.Points(this.geometry, this.material);
        this.mesh = this.points; // 兼容旧代码
    }

    update(delta) {
        this.time += delta;
        this.material.uniforms.time.value = this.time;
    }

    dispose() {
        super.dispose();
    }
}
