// 在浏览器中，THREE 已经通过 script 标签全局加载
const THREE = window.THREE;
import { BaseEffect } from '../core/BaseEffect';

export class MagicEffect extends BaseEffect {
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
        const speeds = new Float32Array(count);
        const offsets = new Float32Array(count);

        // 魔法粒子的颜色
        const colorPalette = [
            new THREE.Color(0xff88ff), // 粉色
            new THREE.Color(0x88ffff), // 青色
            new THREE.Color(0xffff88), // 黄色
            new THREE.Color(0x88ff88)  // 绿色
        ];

        for (let i = 0; i < count; i++) {
            // 在半球形区域内随机分布粒子
            const radius = 5 + Math.random() * 5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.5;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = Math.random() * 2; // 从地面开始
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

            // 随机选择颜色
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            // 随机大小
            sizes[i] = 0.1 + Math.random() * 0.3;

            // 随机速度和偏移
            speeds[i] = 0.2 + Math.random() * 0.8;
            offsets[i] = Math.random() * Math.PI * 2;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        this.geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
        this.geometry.setAttribute('offset', new THREE.BufferAttribute(offsets, 1));

        // 创建魔法粒子纹理
        const texture = this._createMagicTexture();

        // 使用自定义着色器材质
        const vertexShader = `
            attribute float size;
            attribute float speed;
            attribute float offset;
            varying vec3 vColor;
            varying float vAlpha;
            uniform float time;
            
            void main() {
                vColor = color;
                
                // 计算上升和漂浮效果
                vec3 pos = position;
                
                // 上升效果
                pos.y += time * speed;
                
                // 周期性重置位置
                float cycleTime = 10.0; // 10秒一个周期
                float normalizedTime = mod(time + offset, cycleTime) / cycleTime;
                
                // 如果粒子到达顶部，重置到底部
                if (pos.y > 10.0) {
                    pos.y = fract(pos.y / 10.0) * 2.0;
                }
                
                // 横向漂移
                pos.x += sin(time * speed + offset) * 0.2;
                pos.z += cos(time * speed * 0.7 + offset) * 0.2;
                
                // 闪烁效果
                float blink = sin(time * 3.0 + offset * 10.0) * 0.5 + 0.5;
                vAlpha = blink * 0.7 + 0.3; // 透明度在0.3-1.0之间变化
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z) * (blink * 0.5 + 0.5);
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const fragmentShader = `
            varying vec3 vColor;
            varying float vAlpha;
            uniform sampler2D particleTexture;
            
            void main() {
                vec4 texColor = texture2D(particleTexture, gl_PointCoord);
                if (texColor.a < 0.1) discard;
                gl_FragColor = vec4(vColor * texColor.rgb, texColor.a * vAlpha);
            }
        `;

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                particleTexture: { value: texture },
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

    _createMagicTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // 清空画布
        ctx.clearRect(0, 0, 64, 64);

        // 创建径向渐变
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        // 绘制主光点
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(32, 32, 32, 0, Math.PI * 2);
        ctx.fill();

        // 添加一些星形光芒
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(32, 32);
            ctx.lineTo(32 + Math.cos(angle) * 32, 32 + Math.sin(angle) * 32);
            ctx.stroke();
        }

        // 创建纹理
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    update(delta) {
        this.time += delta;
        this.material.uniforms.time.value = this.time;

        // 随机触发魔法爆发效果
        if (Math.random() < 0.02 * this.options.speed) {
            this._createMagicBurst();
        }
    }

    _createMagicBurst() {
        // 随机选择一个粒子位置作为爆发中心
        const positions = this.geometry.attributes.position.array;
        const index = Math.floor(Math.random() * this.options.count);
        const x = positions[index * 3];
        const y = positions[index * 3 + 1];
        const z = positions[index * 3 + 2];

        // 在这个位置临时增加一些粒子的大小
        const sizes = this.geometry.attributes.size.array;
        const originalSize = sizes[index];
        sizes[index] = originalSize * 3;
        this.geometry.attributes.size.needsUpdate = true;

        // 一段时间后恢复原来的大小
        setTimeout(() => {
            sizes[index] = originalSize;
            this.geometry.attributes.size.needsUpdate = true;
        }, 200);
    }

    dispose() {
        // 先调用父类的 dispose 方法
        super.dispose();
        
        // 我们不需要在这里手动处理纹理的释放
        // 因为父类的 dispose 方法已经处理了所有 uniforms
    }
}
