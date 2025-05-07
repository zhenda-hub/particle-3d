// 在浏览器中，THREE 已经通过 script 标签全局加载
const THREE = window.THREE;
import { BaseEffect } from '../core/BaseEffect';

export class FireworksEffect extends BaseEffect {
    constructor(options) {
        super(options);
        this.fireworks = [];
        this._initParticles();
    }

    _initParticles() {
        // 初始化时不创建粒子，等待触发时创建
        this.geometry = new THREE.BufferGeometry();
        
        // 使用特殊的材质使烟花更亮
        this.material = new THREE.PointsMaterial({
            size: this.options.size,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            vertexColors: true
        });
    }

    _createFirework(x, y, z) {
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        const color = new THREE.Color(Math.random() * 0xffffff);

        for (let i = 0; i < particleCount; i++) {
            // 初始位置
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // 随机速度（球形分布）
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const speed = 2 + Math.random() * 2;

            velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
            velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
            velocities[i * 3 + 2] = Math.cos(phi) * speed;

            // 颜色
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const firework = {
            mesh: new THREE.Points(geometry, this.material),
            velocities: velocities,
            life: 1.0 // 生命值
        };

        // 将烟花添加到主网格中，而不是场景
        this.mesh.add(firework.mesh);
        this.fireworks.push(firework);
    }

    update(delta) {
        // 随机创建新烟花
        if (Math.random() < 0.05 * this.options.speed) {
            const x = (Math.random() - 0.5) * 10;
            const y = -5 + Math.random() * 5;
            const z = (Math.random() - 0.5) * 10;
            this._createFirework(x, y, z);
        }

        // 更新所有烟花
        for (let i = this.fireworks.length - 1; i >= 0; i--) {
            const firework = this.fireworks[i];
            const positions = firework.mesh.geometry.attributes.position.array;
            const velocities = firework.velocities;

            // 更新位置
            for (let j = 0; j < positions.length; j += 3) {
                positions[j] += velocities[j] * delta;
                velocities[j + 1] -= 1 * delta; // 重力
                positions[j + 1] += velocities[j + 1] * delta;
                positions[j + 2] += velocities[j + 2] * delta;
            }

            // 更新生命值
            firework.life -= delta;
            firework.mesh.material.opacity = firework.life;

            firework.mesh.geometry.attributes.position.needsUpdate = true;

            // 移除死亡的烟花
            if (firework.life <= 0) {
                this.scene.remove(firework.mesh);
                firework.mesh.geometry.dispose();
                this.fireworks.splice(i, 1);
            }
        }
    }

    dispose() {
        super.dispose();
        // 清理所有烟花
        this.fireworks.forEach(firework => {
            this.mesh.remove(firework.mesh);
            firework.mesh.geometry.dispose();
        });
        this.fireworks = [];
    }
}
