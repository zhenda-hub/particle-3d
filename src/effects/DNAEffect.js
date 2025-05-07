// 在浏览器中，THREE 已经通过 script 标签全局加载
const THREE = window.THREE;
import { BaseEffect } from '../core/BaseEffect';

export class DNAEffect extends BaseEffect {
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
        const strands = new Float32Array(count); // 0 = 第一条链, 1 = 第二条链

        // DNA颜色
        const strandColor1 = new THREE.Color(0x0088ff); // 蓝色
        const strandColor2 = new THREE.Color(0xff8800); // 橙色
        const baseColor1 = new THREE.Color(0x00ff88); // 绿色
        const baseColor2 = new THREE.Color(0xff0088); // 粉色

        // DNA参数
        const dnaLength = 20;       // DNA长度
        const dnaRadius = 2;        // DNA半径
        const dnaWindings = 10;     // 螺旋圈数
        const basePairsPerWinding = count / (dnaWindings * 2); // 每圈碱基对数量

        for (let i = 0; i < count; i++) {
            // 确定粒子是在哪条链上
            strands[i] = i % 2;
            const strand = strands[i];
            
            // 沿DNA长度均匀分布粒子
            const heightFraction = (i / count) * dnaLength - dnaLength / 2;
            
            // 计算螺旋角度
            const angle = (i / basePairsPerWinding) * Math.PI * 2;
            
            // 计算位置
            positions[i * 3] = Math.cos(angle) * dnaRadius * (strand === 0 ? 1 : -1);
            positions[i * 3 + 1] = heightFraction;
            positions[i * 3 + 2] = Math.sin(angle) * dnaRadius * (strand === 0 ? 1 : -1);
            
            // 设置颜色 - 链和碱基不同颜色
            let color;
            if (i % 10 < 8) { // 80%是链
                color = strand === 0 ? strandColor1 : strandColor2;
            } else { // 20%是碱基对
                color = strand === 0 ? baseColor1 : baseColor2;
            }
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            // 碱基对粒子更大
            sizes[i] = i % 10 < 8 ? 0.1 : 0.2;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        this.geometry.setAttribute('strand', new THREE.BufferAttribute(strands, 1));

        // 使用自定义着色器材质
        const vertexShader = `
            attribute float size;
            attribute float strand;
            varying vec3 vColor;
            uniform float time;
            
            void main() {
                vColor = color;
                
                // 旋转DNA
                float rotationSpeed = 0.2;
                float angle = time * rotationSpeed;
                
                vec3 pos = position;
                
                // 应用旋转
                float cosA = cos(angle);
                float sinA = sin(angle);
                float newX = pos.x * cosA - pos.z * sinA;
                float newZ = pos.x * sinA + pos.z * cosA;
                pos.x = newX;
                pos.z = newZ;
                
                // 添加一些波动
                float wave = sin(position.y * 0.5 + time) * 0.2;
                pos.x += wave;
                pos.z += wave;
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const fragmentShader = `
            varying vec3 vColor;
            
            void main() {
                // 创建圆形粒子
                float r = 0.0;
                vec2 cxy = 2.0 * gl_PointCoord - 1.0;
                r = dot(cxy, cxy);
                if (r > 1.0) {
                    discard;
                }
                
                // 添加发光效果
                gl_FragColor = vec4(vColor, 1.0 - r * 0.5);
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
