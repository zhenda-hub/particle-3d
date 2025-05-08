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

        // 星系参数 - 更真实的设置
        const radius = 25;  // 显著增大半径使星系显示区域更大
        const branches = 3;  // 增加到 3 个旋臂，更常见
        const spin = 0.8;   // 增大旋转参数使旋臂更明显
        const randomness = 0.2; // 增加随机性使星系更自然
        const randomnessPower = 2.2; // 调整随机分布
        const coreSize = 5.0;  // 增大核心大小
        
        // 更丰富的星系颜色
        const insideColor = new THREE.Color(0xffa07a);  // 核心为淡橙色
        const midColor = new THREE.Color(0xffff99);     // 中间区域淡黄色
        const outsideColor = new THREE.Color(0x4682b4); // 外围蓝色

        for (let i = 0; i < count; i++) {
            // 位置
            const i3 = i * 3;
            
            // 半径 - 使用平方分布使粒子在中心更密集
            let r;
            if (i < count * 0.15) { // 15% 的粒子在核心区域
                r = Math.random() * coreSize;
            } else {
                r = coreSize + Math.pow(Math.random(), 1.5) * (radius - coreSize);
            }
            radiusArray[i] = r;
            
            // 旋转角度 - 使用对数螺旋更真实
            let branchAngle;
            if (r < coreSize) {
                // 核心粒子随机分布
                branchAngle = Math.random() * Math.PI * 2;
            } else {
                // 旋臂粒子按分支分布
                branchAngle = (i % branches) / branches * Math.PI * 2;
            }
            
            // 旋臂旋转 - 对数螺旋更真实
            const spinAngle = spin * Math.log(r) * 0.5;
            angles[i] = branchAngle + spinAngle;
            
            // 随机偏移 - 根据半径调整偏移量
            let randFactor = r < coreSize ? 0.02 : randomness;
            const randomX = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randFactor * r;
            const randomY = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randFactor * 0.5 * r; // Y方向偏移更小
            const randomZ = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randFactor * r;
            
            positions[i3] = Math.cos(branchAngle + spinAngle) * r + randomX;
            positions[i3 + 1] = randomY;
            positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + randomZ;
            
            // 颜色 - 使用更丰富的颜色分布
            let mixedColor = new THREE.Color();
            
            // 添加一些随机性到颜色中
            const colorRandom = Math.random();
            
            if (r < coreSize * 0.6) {
                // 核心区域 - 橙色到黄色的变化
                mixedColor.copy(insideColor);
                // 添加一些亮星
                if (colorRandom > 0.97) {
                    mixedColor.setRGB(1.0, 1.0, 0.9); // 一些亮白色的星星
                }
            } else if (r < radius * 0.75) {
                // 中间区域 - 黄色到淡蓝的过渡
                const t = (r - coreSize * 0.6) / (radius * 0.75 - coreSize * 0.6);
                mixedColor.copy(insideColor).lerp(midColor, t);
                
                // 添加一些蓝色星星
                if (colorRandom > 0.93) {
                    mixedColor.setRGB(0.7, 0.8, 1.0);
                }
            } else {
                // 外围区域 - 淡蓝到深蓝
                const t = (r - radius * 0.75) / (radius - radius * 0.75);
                mixedColor.copy(midColor).lerp(outsideColor, t);
                
                // 在外围添加一些红色星云
                if (colorRandom > 0.85 && colorRandom < 0.9) {
                    mixedColor.setRGB(0.8, 0.3, 0.3);
                }
            }
            
            colors[i3] = mixedColor.r;
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;
            
            // 大小 - 核心星星更大，外围星星更小
            if (r < coreSize) {
                sizes[i] = 0.15 + Math.random() * 0.1; // 核心星星更大
            } else {
                sizes[i] = 0.05 + Math.random() * 0.1 * (1 - r / radius); // 外围星星更小
            }
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
            varying float vDistance;
            varying float vRadius;
            uniform float time;
            
            // 添加噪声函数用于模拟星系中的小尺度流动
            float noise(vec2 p) {
                return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
            }
            
            void main() {
                vColor = color;
                vRadius = radius;
                
                // 使用更真实的开普勒旋转模型
                float rotationSpeed = 0.03 + 0.08 * exp(-radius / 8.0);
                float newAngle = angle + time * rotationSpeed;
                
                // 添加小尺度的流动效果
                float flowEffect = noise(vec2(angle, time * 0.1)) * 0.1;
                newAngle += flowEffect;
                
                // 保持原始 Y 坐标，只旋转 XZ 平面
                vec3 pos = position;
                
                // 根据半径应用不同的旋转效果
                if (radius > ${coreSize.toFixed(1)}) {
                    // 外围粒子使用旋转模型
                    pos.x = cos(newAngle) * radius;
                    pos.z = sin(newAngle) * radius;
                    
                    // 添加垂直方向的微小波动
                    float waveY = sin(angle * 5.0 + time) * 0.05 * radius;
                    pos.y += waveY;
                } else {
                    // 核心粒子添加微小的浮动效果
                    float drift = sin(time * 0.5 + angle * 3.0) * 0.1;
                    pos.x += drift;
                    pos.z += cos(time * 0.5 + angle * 2.0) * 0.1;
                }
                
                // 计算到相机的距离用于衰减效果
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                float distance = length(mvPosition.xyz);
                vDistance = distance;
                
                // 距离越远的星星大小衰减越快
                float sizeAttenuation = 400.0 / -mvPosition.z;
                
                // 添加微小的闪烁效果
                float twinkle = 0.9 + 0.2 * sin(time * 2.0 + angle * 10.0);
                
                gl_PointSize = size * sizeAttenuation * twinkle;
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const fragmentShader = `
            varying vec3 vColor;
            varying float vDistance;
            varying float vRadius;
            uniform float time;
            
            // 添加噪声函数用于模拟星星的纹理
            float noise(vec2 p) {
                return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
            }
            
            void main() {
                // 创建更真实的星星形状
                vec2 cxy = 2.0 * gl_PointCoord - 1.0;
                float r = dot(cxy, cxy);
                
                // 为不同的星星创建不同的形状
                float shapeNoise = noise(vec2(vRadius, time * 0.1));
                float shapeFactor = 0.7 + shapeNoise * 0.3; // 0.7-1.0 之间的值
                
                // 如果超出边界则丢弃
                if (r > shapeFactor) discard;
                
                // 使用高斯分布创建更自然的星星形状
                float intensity = 1.0 - smoothstep(0.0, shapeFactor, r);
                intensity = pow(intensity, 1.2); // 调整亮度分布
                
                // 根据距离调整亮度
                float distanceFactor = 1.0 - smoothstep(0.0, 1200.0, vDistance);
                intensity *= distanceFactor * 1.5;
                
                // 根据半径调整星星的外观
                vec3 starColor = vColor;
                
                // 核心区域的星星更亮
                if (vRadius < ${coreSize.toFixed(1)}) {
                    // 增强核心区域的亮度
                    intensity *= 1.3;
                    
                    // 添加光晕效果
                    float glowSize = 1.5;
                    float glow = exp(-r / glowSize);
                    starColor += vec3(0.3, 0.2, 0.1) * glow * 0.5;
                }
                
                // 添加弱光晕效果给所有星星
                float glowFactor = exp(-r * 2.0) * 0.3;
                vec3 finalColor = mix(starColor, starColor * 1.5, glowFactor);
                
                // 如果太暗就丢弃该片段
                if (intensity < 0.01) discard;
                
                gl_FragColor = vec4(finalColor * intensity, intensity);
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
