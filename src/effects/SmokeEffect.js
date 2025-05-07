// 在浏览器中，THREE 已经通过 script 标签全局加载
const THREE = window.THREE;
import { BaseEffect } from '../core/BaseEffect';

export class SmokeEffect extends BaseEffect {
    constructor(options) {
        super(options);
        this.time = 0;
        this._initParticles();
    }

    _initParticles() {
        const count = this.options.count;
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const lifetimes = new Float32Array(count);
        const opacities = new Float32Array(count);

        // 烟雾颜色
        const smokeColor = new THREE.Color(0x888888);

        for (let i = 0; i < count; i++) {
            // 初始化粒子位置 - 在底部区域随机生成
            positions[i * 3] = (Math.random() - 0.5) * 3;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 3;

            // 初始化粒子速度 - 主要向上，带有一些随机性
            velocities[i * 3] = (Math.random() - 0.5) * 0.3;
            velocities[i * 3 + 1] = 0.5 + Math.random() * 0.5;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3;

            // 初始化粒子大小 - 随着上升会变大
            sizes[i] = 0.2 + Math.random() * 0.3;

            // 初始化生命周期和不透明度
            lifetimes[i] = Math.random();
            opacities[i] = 0.7 + Math.random() * 0.3;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        this.geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
        this.geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

        // 创建烟雾纹理
        const texture = this._createSmokeTexture();

        // 使用标准的点材质
        this.material = new THREE.PointsMaterial({
            size: 1.0,
            map: texture,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
            blending: THREE.NormalBlending,
            color: smokeColor
        });

        this.mesh = new THREE.Points(this.geometry, this.material);
    }

    _createSmokeTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // 创建径向渐变
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        // 绘制圆形
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(32, 32, 32, 0, Math.PI * 2);
        ctx.fill();

        // 创建纹理
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    update(delta) {
        const positions = this.geometry.attributes.position.array;
        const velocities = this.geometry.attributes.velocity.array;
        const sizes = this.geometry.attributes.size.array;
        const lifetimes = this.geometry.attributes.lifetime.array;
        const opacities = this.geometry.attributes.opacity.array;
        
        this.time += delta;

        for (let i = 0; i < this.options.count; i++) {
            const i3 = i * 3;
            
            // 更新位置
            positions[i3] += velocities[i3] * delta * this.options.speed;
            positions[i3 + 1] += velocities[i3 + 1] * delta * this.options.speed;
            positions[i3 + 2] += velocities[i3 + 2] * delta * this.options.speed;
            
            // 添加一些随机横向移动模拟空气流动
            positions[i3] += (Math.random() - 0.5) * 0.05 * delta;
            positions[i3 + 2] += (Math.random() - 0.5) * 0.05 * delta;
            
            // 更新生命周期
            lifetimes[i] += delta * 0.2;
            
            // 随着上升，粒子变大
            sizes[i] += delta * 0.1;
            
            // 随着生命周期增加，不透明度降低
            opacities[i] -= delta * 0.2;
            if (opacities[i] < 0) opacities[i] = 0;
            
            // 重置已经消失的粒子
            if (lifetimes[i] >= 1.0 || positions[i3 + 1] > 10 || opacities[i] <= 0) {
                positions[i3] = (Math.random() - 0.5) * 3;
                positions[i3 + 1] = 0;
                positions[i3 + 2] = (Math.random() - 0.5) * 3;
                
                velocities[i3] = (Math.random() - 0.5) * 0.3;
                velocities[i3 + 1] = 0.5 + Math.random() * 0.5;
                velocities[i3 + 2] = (Math.random() - 0.5) * 0.3;
                
                sizes[i] = 0.2 + Math.random() * 0.3;
                lifetimes[i] = 0;
                opacities[i] = 0.7 + Math.random() * 0.3;
            }
        }

        // 更新材质不透明度
        this.material.opacity = 0.7;
        
        // 更新几何体属性
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.size.needsUpdate = true;
        this.geometry.attributes.opacity.needsUpdate = true;
    }

    dispose() {
        super.dispose();
        if (this.material.map) {
            this.material.map.dispose();
        }
    }
}
