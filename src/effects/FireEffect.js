// 在浏览器中，THREE 已经通过 script 标签全局加载
const THREE = window.THREE;
import { BaseEffect } from '../core/BaseEffect';

export class FireEffect extends BaseEffect {
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
        const lifetimes = new Float32Array(count);
        const velocities = new Float32Array(count * 3);

        // 火焰颜色
        const colorBase = new THREE.Color(0xff7700);  // 橙色
        const colorMiddle = new THREE.Color(0xff2200); // 红色
        const colorTip = new THREE.Color(0xffff00);   // 黄色

        for (let i = 0; i < count; i++) {
            // 初始位置 - 在底部区域随机生成 - 增大范围
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 20; // 增大宽度到 20
            positions[i3 + 1] = -10; // 低于视野中心
            positions[i3 + 2] = (Math.random() - 0.5) * 20; // 增大深度到 20

            // 初始速度 - 主要向上，带有一些随机性
            velocities[i3] = (Math.random() - 0.5) * 1.5; // 增大水平浮动
            velocities[i3 + 1] = 5 + Math.random() * 5;   // 增大垂直速度
            velocities[i3 + 2] = (Math.random() - 0.5) * 1.5; // 增大水平浮动

            // 随机生命周期
            lifetimes[i] = Math.random();

            // 根据生命周期设置颜色
            let color;
            if (lifetimes[i] < 0.3) {
                color = colorBase.clone();
            } else if (lifetimes[i] < 0.6) {
                color = colorMiddle.clone();
            } else {
                color = colorTip.clone();
            }

            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;

            // 粒子大小
            sizes[i] = 0.1 + Math.random() * 0.2;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        this.geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
        this.geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

        // 使用自定义着色器材质
        const vertexShader = `
            attribute float size;
            attribute float lifetime;
            varying vec3 vColor;
            varying float vLifetime;
            
            void main() {
                vColor = color;
                vLifetime = lifetime;
                
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const fragmentShader = `
            varying vec3 vColor;
            varying float vLifetime;
            
            void main() {
                // 创建柔和的粒子效果
                float r = 0.0;
                vec2 cxy = 2.0 * gl_PointCoord - 1.0;
                r = dot(cxy, cxy);
                if (r > 1.0) {
                    discard;
                }
                
                // 根据生命周期调整透明度
                float alpha = (1.0 - r) * (1.0 - vLifetime);
                gl_FragColor = vec4(vColor, alpha);
            }
        `;

        this.material = new THREE.ShaderMaterial({
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
        const positions = this.geometry.attributes.position.array;
        const velocities = this.geometry.attributes.velocity.array;
        const lifetimes = this.geometry.attributes.lifetime.array;
        const sizes = this.geometry.attributes.sizes;
        const colors = this.geometry.attributes.color.array;
        
        // 火焰颜色
        const colorBase = new THREE.Color(0xff7700);  // 橙色
        const colorMiddle = new THREE.Color(0xff2200); // 红色
        const colorTip = new THREE.Color(0xffff00);   // 黄色

        for (let i = 0; i < this.options.count; i++) {
            const i3 = i * 3;
            
            // 更新位置
            positions[i3] += velocities[i3] * delta;
            positions[i3 + 1] += velocities[i3 + 1] * delta;
            positions[i3 + 2] += velocities[i3 + 2] * delta;
            
            // 添加一些随机横向移动模拟空气流动
            positions[i3] += (Math.random() - 0.5) * 0.1 * delta;
            positions[i3 + 2] += (Math.random() - 0.5) * 0.1 * delta;
            
            // 更新生命周期
            lifetimes[i] += delta * 0.5;
            
            // 重置已经消失的粒子
            if (lifetimes[i] >= 1.0 || positions[i3 + 1] > 8) {
                positions[i3] = (Math.random() - 0.5) * 2;
                positions[i3 + 1] = 0;
                positions[i3 + 2] = (Math.random() - 0.5) * 2;
                
                velocities[i3] = (Math.random() - 0.5) * 0.5;
                velocities[i3 + 1] = 2 + Math.random() * 2;
                velocities[i3 + 2] = (Math.random() - 0.5) * 0.5;
                
                lifetimes[i] = 0;
                
                // 重新设置颜色
                let color;
                if (lifetimes[i] < 0.3) {
                    color = colorBase.clone();
                } else if (lifetimes[i] < 0.6) {
                    color = colorMiddle.clone();
                } else {
                    color = colorTip.clone();
                }

                colors[i3] = color.r;
                colors[i3 + 1] = color.g;
                colors[i3 + 2] = color.b;
            }
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.lifetime.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
    }

    dispose() {
        super.dispose();
    }
}
