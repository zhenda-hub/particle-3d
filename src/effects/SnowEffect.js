// 在浏览器中，THREE 已经通过 script 标签全局加载
const THREE = window.THREE;
import { BaseEffect } from '../core/BaseEffect';

export class SnowEffect extends BaseEffect {
    constructor(options) {
        super(options);
        this._initParticles();
    }

    _initParticles() {
        const positions = new Float32Array(this.options.count * 3);
        const velocities = new Float32Array(this.options.count * 3);
        const rotations = new Float32Array(this.options.count);

        for (let i = 0; i < this.options.count; i++) {
            // 随机位置
            positions[i * 3] = Math.random() * 20 - 10;     // x
            positions[i * 3 + 1] = Math.random() * 20 - 10; // y
            positions[i * 3 + 2] = Math.random() * 20 - 10; // z

            // 雪花速度 - 缓慢飘落
            velocities[i * 3] = (Math.random() - 0.5) * 0.3;      // x方向随机
            velocities[i * 3 + 1] = -1 - Math.random();           // y方向向下
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3;  // z方向随机

            // 旋转速度
            rotations[i] = Math.random() * Math.PI * 2;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        this.geometry.setAttribute('rotation', new THREE.BufferAttribute(rotations, 1));

        // 使用特殊的雪花材质
        this.material.map = this._createSnowflakeTexture();
    }

    _createSnowflakeTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        // 绘制雪花
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(16, 16, 8, 0, Math.PI * 2);
        ctx.fill();

        // 创建纹理
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    update(delta) {
        const positions = this.geometry.attributes.position.array;
        const velocities = this.geometry.attributes.velocity.array;
        const rotations = this.geometry.attributes.rotation.array;
        const speed = this.options.speed;

        for (let i = 0; i < positions.length; i += 3) {
            // 更新位置
            positions[i] += velocities[i] * speed * delta;
            positions[i + 1] += velocities[i + 1] * speed * delta;
            positions[i + 2] += velocities[i + 2] * speed * delta;

            // 添加随机摆动
            positions[i] += Math.sin(rotations[i / 3] + delta) * 0.1;

            // 如果雪花落到底部，重置到顶部
            if (positions[i + 1] < -10) {
                positions[i + 1] = 10;
                positions[i] = Math.random() * 20 - 10;
                positions[i + 2] = Math.random() * 20 - 10;
            }

            // 更新旋转
            rotations[i / 3] += delta * 0.5;
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.rotation.needsUpdate = true;
    }

    dispose() {
        super.dispose();
        if (this.material.map) {
            this.material.map.dispose();
        }
    }
}
