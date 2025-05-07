// 在浏览器中，THREE 已经通过 script 标签全局加载
const THREE = window.THREE;
import { BaseEffect } from '../core/BaseEffect';

export class GalaxyEffect extends BaseEffect {
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
        const angles = new Float32Array(count);
        const radiusArray = new Float32Array(count);

        // 星系参数
        const radius = 10;
        const branches = 5;
        const spin = 1;
        const randomness = 0.2;
        const randomnessPower = 3;
        const insideColor = new THREE.Color(0xff6030);
        const outsideColor = new THREE.Color(0x1b3984);

        for (let i = 0; i < count; i++) {
            // 位置
            const i3 = i * 3;
            
            // 半径
            const r = Math.random() * radius;
            radiusArray[i] = r;
            
            // 旋转角度
            const branchAngle = (i % branches) / branches * Math.PI * 2;
            
            // 旋臂旋转
            const spinAngle = r * spin;
            angles[i] = branchAngle + spinAngle;
            
            // 随机偏移
            const randomX = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r;
            const randomY = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r;
            const randomZ = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r;
            
            positions[i3] = Math.cos(branchAngle + spinAngle) * r + randomX;
            positions[i3 + 1] = randomY;
            positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + randomZ;
            
            // 颜色
            const mixedColor = insideColor.clone();
            mixedColor.lerp(outsideColor, r / radius);
            
            colors[i3] = mixedColor.r;
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;
            
            // 大小
            sizes[i] = Math.random() * 0.2 + 0.05;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        this.geometry.setAttribute('angle', new THREE.BufferAttribute(angles, 1));
        this.geometry.setAttribute('radius', new THREE.BufferAttribute(radiusArray, 1));

        // 使用自定义着色器材质
        const vertexShader = `
            attribute float size;
            attribute float angle;
            attribute float radius;
            varying vec3 vColor;
            uniform float time;
            
            void main() {
                vColor = color;
                
                // 旋转效果
                float newAngle = angle + time * (0.1 + 0.1 * (1.0 - radius / 10.0));
                vec3 pos = position;
                
                // 应用旋转
                pos.x = cos(newAngle) * radius;
                pos.z = sin(newAngle) * radius;
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const fragmentShader = `
            varying vec3 vColor;
            
            void main() {
                // 创建星星效果
                float r = 0.0;
                vec2 cxy = 2.0 * gl_PointCoord - 1.0;
                r = dot(cxy, cxy);
                if (r > 1.0) {
                    discard;
                }
                
                // 添加发光效果
                gl_FragColor = vec4(vColor, 1.0 - r);
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
