// 在浏览器中，THREE 已经通过 script 标签全局加载
const THREE = window.THREE;
import { BaseEffect } from '../core/BaseEffect';

export class MeteorShowerEffect extends BaseEffect {
    constructor(options) {
        super(options);
        this.meteors = [];
        this._initParticles();
    }

    _initParticles() {
        // 初始化时不创建粒子，等待update时创建
        this.geometry = new THREE.BufferGeometry();
        
        // 使用特殊的材质使流星更亮
        this.material = new THREE.PointsMaterial({
            size: this.options.size * 2,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            vertexColors: true,
            map: this._createMeteorTexture()
        });

        this.mesh = new THREE.Group();
    }

    _createMeteorTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        // 创建径向渐变
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 220, 128, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 128, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        // 绘制圆形
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(16, 16, 16, 0, Math.PI * 2);
        ctx.fill();

        // 创建纹理
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    _createMeteor() {
        const particleCount = 30; // 每个流星的粒子数
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // 流星起始位置 - 增大范围
        const startX = (Math.random() - 0.5) * 60; // 增大宽度到 60
        const startY = 30 + Math.random() * 20;    // 增大高度到 30-50
        const startZ = (Math.random() - 0.5) * 60; // 增大深度到 60
        
        // 流星方向 - 主要向下，增大速度
        const dirX = (Math.random() - 0.5) * 5;    // 增大水平速度
        const dirY = -8 - Math.random() * 4;       // 增大垂直速度
        const dirZ = (Math.random() - 0.5) * 5;    // 增大水平速度
        
        // 流星颜色
        const color = new THREE.Color(0xffffff);
        const tailColor = new THREE.Color(0xff8800);

        for (let i = 0; i < particleCount; i++) {
            // 粒子位置 - 沿流星路径分布
            const fraction = i / particleCount;
            positions[i * 3] = startX - dirX * fraction * 5;
            positions[i * 3 + 1] = startY - dirY * fraction * 5;
            positions[i * 3 + 2] = startZ - dirZ * fraction * 5;

            // 颜色 - 从头部到尾部渐变
            const particleColor = color.clone().lerp(tailColor, fraction);
            colors[i * 3] = particleColor.r;
            colors[i * 3 + 1] = particleColor.g;
            colors[i * 3 + 2] = particleColor.b;

            // 大小 - 头部大，尾部小
            sizes[i] = (1 - fraction) * 0.5 + 0.1;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const meteorMaterial = this.material.clone();
        
        const meteor = {
            mesh: new THREE.Points(geometry, meteorMaterial),
            velocity: new THREE.Vector3(dirX, dirY, dirZ),
            life: 1.0 // 生命值
        };

        this.mesh.add(meteor.mesh);
        this.meteors.push(meteor);
        
        return meteor;
    }

    update(delta) {
        // 随机创建新流星
        if (Math.random() < 0.05 * this.options.speed) {
            this._createMeteor();
        }

        // 更新所有流星
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const meteor = this.meteors[i];
            const positions = meteor.mesh.geometry.attributes.position.array;

            // 更新位置
            for (let j = 0; j < positions.length; j += 3) {
                positions[j] += meteor.velocity.x * delta * this.options.speed;
                positions[j + 1] += meteor.velocity.y * delta * this.options.speed;
                positions[j + 2] += meteor.velocity.z * delta * this.options.speed;
            }

            // 更新生命值
            meteor.life -= delta * 0.2;
            meteor.mesh.material.opacity = meteor.life;

            meteor.mesh.geometry.attributes.position.needsUpdate = true;

            // 移除消失的流星
            if (meteor.life <= 0 || positions[1] < -20) {
                this.mesh.remove(meteor.mesh);
                meteor.mesh.geometry.dispose();
                meteor.mesh.material.dispose();
                this.meteors.splice(i, 1);
            }
        }
    }

    dispose() {
        super.dispose();
        // 清理所有流星
        this.meteors.forEach(meteor => {
            this.mesh.remove(meteor.mesh);
            meteor.mesh.geometry.dispose();
            meteor.mesh.material.dispose();
        });
        this.meteors = [];
        
        if (this.material.map) {
            this.material.map.dispose();
        }
    }
}
