// 在浏览器中，THREE 已经通过 script 标签全局加载
const THREE = window.THREE;
import { BaseEffect } from '../core/BaseEffect';

export class SolarSystemEffect extends BaseEffect {
    constructor(options) {
        super(options);
        this.time = 0;
        this.planets = [];
        this.orbits = [];
        this._initSolarSystem();
    }

    _initSolarSystem() {
        // 创建一个空的几何体和材质
        this.geometry = new THREE.BufferGeometry();
        this.material = new THREE.PointsMaterial({ size: 0.1, color: 0xffffff });
        
        // 创建组对象而不是粒子系统
        this.planetGroup = new THREE.Group();
        
        // 添加光源
        this._setupLights();
        
        // 创建太阳
        this._createSun();
        
        // 创建行星
        this._createPlanets();
        
        // 创建轨道线
        this._createOrbits();
        
        // 创建背景星空
        this._createStarfield();
        
        // 设置相机位置
        if (this.options.camera) {
            this.options.camera.position.set(0, 30, 80);
            this.options.camera.lookAt(0, 0, 0);
        }
        
        // 创建粒子系统对象（实际上只是一个容器）
        this.points = new THREE.Group();
        this.points.add(this.planetGroup);
        
        // 将粒子系统添加到场景中
        if (this.options.scene) {
            this.options.scene.add(this.points);
        }
    }
    
    _setupLights() {
        // 添加环境光 - 增强环境光的强度
        const ambientLight = new THREE.AmbientLight(0x666666);
        this.planetGroup.add(ambientLight);
        this.ambientLight = ambientLight;
        
        // 添加定向光，模拟太阳光
        const sunLight = new THREE.PointLight(0xffffff, 2.0, 300);
        sunLight.position.set(0, 0, 0); // 从太阳位置发出
        this.planetGroup.add(sunLight);
        this.sunLight = sunLight;
        
        // 添加辅助光源，使背光侧的行星也可见
        const backLight = new THREE.DirectionalLight(0x444444, 1.0);
        backLight.position.set(-1, 1, -1);
        this.planetGroup.add(backLight);
        this.backLight = backLight;
        
        // 添加一个额外的光源来照亮整个场景
        if (this.options.scene) {
            const sceneLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
            this.options.scene.add(sceneLight);
            this.sceneLight = sceneLight;
        }
    }
    
    _createStarfield() {
        // 创建背景星空
        const starCount = 2000;
        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.7,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const starPositions = new Float32Array(starCount * 3);
        const starSizes = new Float32Array(starCount);
        
        for (let i = 0; i < starCount; i++) {
            // 在大球体上随机分布星星
            const radius = 150 + Math.random() * 50;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            starPositions[i * 3 + 2] = radius * Math.cos(phi);
            
            // 随机大小
            starSizes[i] = Math.random() * 1.5;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
        
        const starField = new THREE.Points(starGeometry, starMaterial);
        this.planetGroup.add(starField);
        this.starField = starField;
    }
    
    _createSun() {
        // 太阳纹理
        const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
        // 使用 MeshBasicMaterial 而不是带发光属性的材质
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffdd00,
            transparent: true,
            opacity: 1.0
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        
        // 添加太阳光晕
        const sunGlowGeometry = new THREE.SphereGeometry(6, 32, 32);
        const sunGlowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                uniform float time;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                    
                    // 添加微小的脉动效果
                    float pulseFactor = sin(time * 2.0) * 0.05 + 1.0;
                    vec3 pos = position * pulseFactor;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                uniform float time;
                
                void main() {
                    // 根据法线和视角创建光晕效果
                    float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
                    
                    // 添加脉动效果
                    float pulse = sin(time * 3.0) * 0.1 + 0.9;
                    intensity *= pulse;
                    
                    // 混合多种颜色创建真实的太阳光晕
                    vec3 innerColor = vec3(1.0, 0.8, 0.3); // 内部黄色
                    vec3 outerColor = vec3(1.0, 0.4, 0.0); // 外部橙色
                    vec3 finalColor = mix(innerColor, outerColor, intensity);
                    
                    gl_FragColor = vec4(finalColor, intensity * 0.6);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide
        });
        const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
        sun.add(sunGlow);
        
        this.sun = sun;
        this.sunGlow = sunGlow;
        this.planetGroup.add(sun);
    }
    
    _createPlanets() {
        // 行星数据：名称、距离、大小、颜色、轨道周期、倾角、纹理路径
        const planetData = [
            { 
                name: "Mercury", 
                distance: 10, 
                size: 0.4, 
                color: 0xaaaaaa, 
                period: 0.24, 
                rotationPeriod: 58.6, // 自转周期（地球日）
                tilt: 0.03,
                texture: this._createPlanetTexture(0xaaaaaa, 0x888888, 0.2) // 水星纹理
            },
            { 
                name: "Venus", 
                distance: 15, 
                size: 0.9, 
                color: 0xf5deb3, 
                period: 0.62, 
                rotationPeriod: -243, // 逆旋转
                tilt: 3.1, // 金星倾角很大
                texture: this._createPlanetTexture(0xf5deb3, 0xe6c9a8, 0.1) // 金星纹理
            },
            { 
                name: "Earth", 
                distance: 20, 
                size: 1.0, 
                color: 0x6b93d6, 
                period: 1.0, 
                rotationPeriod: 1, 
                tilt: 0.41, // 23.5度转换为弧度
                hasAtmosphere: true,
                texture: this._createEarthTexture() // 地球特殊纹理
            },
            { 
                name: "Mars", 
                distance: 25, 
                size: 0.5, 
                color: 0xc1440e, 
                period: 1.88, 
                rotationPeriod: 1.03, 
                tilt: 0.44,
                texture: this._createPlanetTexture(0xc1440e, 0xa13a0c, 0.3) // 火星纹理
            },
            { 
                name: "Jupiter", 
                distance: 35, 
                size: 2.5, 
                color: 0xd8ca9d, 
                period: 11.86, 
                rotationPeriod: 0.41, // 木星自转很快
                tilt: 0.05,
                hasStripes: true,
                texture: this._createJupiterTexture() // 木星特殊纹理
            },
            { 
                name: "Saturn", 
                distance: 45, 
                size: 2.2, 
                color: 0xead6b8, 
                period: 29.46, 
                rotationPeriod: 0.44, 
                tilt: 0.47, // 土星倾角很大
                hasRings: true,
                texture: this._createPlanetTexture(0xead6b8, 0xd4c4a8, 0.15, true) // 土星纹理
            },
            { 
                name: "Uranus", 
                distance: 55, 
                size: 1.8, 
                color: 0xd1e7e7, 
                period: 84.01, 
                rotationPeriod: -0.72, // 逆旋转
                tilt: 1.71, // 天王星的转轴几乎平躺
                texture: this._createPlanetTexture(0xd1e7e7, 0xc1d7d7, 0.05) // 天王星纹理
            },
            { 
                name: "Neptune", 
                distance: 65, 
                size: 1.8, 
                color: 0x5b5ddf, 
                period: 164.8, 
                rotationPeriod: 0.67, 
                tilt: 0.49,
                texture: this._createPlanetTexture(0x5b5ddf, 0x4b4dcf, 0.2) // 海王星纹理
            }
        ];
        
        // 创建每个行星
        planetData.forEach(planet => {
            // 创建行星几何体和材质
            const planetGeometry = new THREE.SphereGeometry(planet.size, 32, 32);
            let planetMaterial;
            
            if (planet.texture) {
                // 使用生成的纹理
                planetMaterial = new THREE.MeshPhongMaterial({ 
                    map: planet.texture,
                    shininess: 5,
                    bumpScale: 0.05
                });
            } else {
                // 使用纯色
                planetMaterial = new THREE.MeshPhongMaterial({ 
                    color: planet.color,
                    shininess: 5
                });
            }
            
            const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
            
            // 设置行星初始位置
            const angle = Math.random() * Math.PI * 2;
            planetMesh.position.x = Math.cos(angle) * planet.distance;
            planetMesh.position.z = Math.sin(angle) * planet.distance;
            
            // 设置行星倾角
            planetMesh.rotation.x = planet.tilt;
            
            // 添加行星数据
            planetMesh.userData = {
                distance: planet.distance,
                period: planet.period,
                rotationPeriod: planet.rotationPeriod,
                angle: angle,
                tilt: planet.tilt,
                name: planet.name
            };
            
            // 添加大气层（如果有）
            if (planet.hasAtmosphere) {
                const atmosphereGeometry = new THREE.SphereGeometry(planet.size * 1.05, 32, 32);
                const atmosphereMaterial = new THREE.MeshPhongMaterial({
                    color: 0x88aaff,
                    transparent: true,
                    opacity: 0.2,
                    side: THREE.BackSide
                });
                const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
                planetMesh.add(atmosphere);
            }
            
            // 为土星添加光环
            if (planet.hasRings) {
                // 为土星创建多层光环
                const ringColors = [0xd4af37, 0xc4a030, 0xb49020];
                const ringRadii = [
                    { inner: planet.size * 1.4, outer: planet.size * 1.8 },
                    { inner: planet.size * 1.9, outer: planet.size * 2.1 },
                    { inner: planet.size * 2.2, outer: planet.size * 2.4 }
                ];
                
                // 创建光环组
                const ringGroup = new THREE.Group();
                
                // 添加多层光环
                ringRadii.forEach((radius, index) => {
                    const ringGeometry = new THREE.RingGeometry(radius.inner, radius.outer, 64);
                    const ringMaterial = new THREE.MeshBasicMaterial({
                        color: ringColors[index],
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.7 - index * 0.15
                    });
                    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                    ring.rotation.x = Math.PI / 2;
                    ringGroup.add(ring);
                });
                
                // 将光环组添加到行星
                planetMesh.add(ringGroup);
            }
            
            this.planets.push(planetMesh);
            this.planetGroup.add(planetMesh);
        });
        
        // 为地球添加月球
        const earthIndex = planetData.findIndex(p => p.name === "Earth");
        if (earthIndex >= 0 && this.planets[earthIndex]) {
            const earth = this.planets[earthIndex];
            
            // 创建月球
            const moonGeometry = new THREE.SphereGeometry(0.27, 32, 32);
            
            // 创建月球纹理
            const moonCanvas = document.createElement('canvas');
            moonCanvas.width = 128;
            moonCanvas.height = 128;
            const moonCtx = moonCanvas.getContext('2d');
            
            // 填充月球基本颜色
            moonCtx.fillStyle = '#cccccc';
            moonCtx.fillRect(0, 0, 128, 128);
            
            // 添加月球坦面
            for (let i = 0; i < 30; i++) {
                const x = Math.random() * 128;
                const y = Math.random() * 128;
                const radius = Math.random() * 3 + 1;
                moonCtx.beginPath();
                moonCtx.arc(x, y, radius, 0, Math.PI * 2);
                moonCtx.fillStyle = '#aaaaaa';
                moonCtx.fill();
            }
            
            const moonTexture = new THREE.CanvasTexture(moonCanvas);
            const moonMaterial = new THREE.MeshPhongMaterial({ 
                map: moonTexture,
                shininess: 5
            });
            
            const moon = new THREE.Mesh(moonGeometry, moonMaterial);
            
            // 设置月球位置
            moon.position.x = 2;
            
            // 添加月球数据
            moon.userData = {
                distance: 2,
                period: 0.08,  // 月球公转周期约为地球的1/12
                rotationPeriod: 27.3, // 月球自转周期与公转周期相同
                angle: 0
            };
            
            // 创建月球轨道组
            const moonOrbit = new THREE.Group();
            moonOrbit.add(moon);
            earth.add(moonOrbit);
            
            this.moon = moon;
            this.moonOrbit = moonOrbit;
        }
    }
    
    // 创建行星纹理
    _createPlanetTexture(baseColor, spotColor, spotDensity = 0.2, hasStripes = false) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // 转换颜色为 RGB 格式
        const baseColorRGB = {
            r: (baseColor >> 16) & 255,
            g: (baseColor >> 8) & 255,
            b: baseColor & 255
        };
        
        const spotColorRGB = {
            r: (spotColor >> 16) & 255,
            g: (spotColor >> 8) & 255,
            b: spotColor & 255
        };
        
        // 填充基本颜色
        ctx.fillStyle = `rgb(${baseColorRGB.r}, ${baseColorRGB.g}, ${baseColorRGB.b})`;
        ctx.fillRect(0, 0, 256, 256);
        
        if (hasStripes) {
            // 添加条纹（如木星或土星）
            const stripeCount = 10;
            const stripeWidth = 256 / stripeCount;
            
            for (let i = 0; i < stripeCount; i++) {
                if (i % 2 === 0) continue; // 跳过偶数条纹
                
                const y = i * stripeWidth;
                ctx.fillStyle = `rgba(${spotColorRGB.r}, ${spotColorRGB.g}, ${spotColorRGB.b}, 0.3)`;
                ctx.fillRect(0, y, 256, stripeWidth);
            }
        }
        
        // 添加随机斑点
        const spotCount = Math.floor(256 * 256 * spotDensity / 10);
        for (let i = 0; i < spotCount; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const radius = Math.random() * 4 + 1;
            const alpha = Math.random() * 0.5 + 0.2;
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${spotColorRGB.r}, ${spotColorRGB.g}, ${spotColorRGB.b}, ${alpha})`;
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    // 创建地球纹理
    _createEarthTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // 填充海洋颜色
        ctx.fillStyle = '#1E88E5';
        ctx.fillRect(0, 0, 256, 256);
        
        // 添加大陆
        const continents = [
            { x: 50, y: 60, width: 60, height: 40 },  // 北美
            { x: 120, y: 60, width: 40, height: 30 }, // 欧洲
            { x: 140, y: 100, width: 50, height: 50 }, // 非洲
            { x: 180, y: 70, width: 60, height: 40 },  // 亚洲
            { x: 40, y: 140, width: 40, height: 40 },  // 南美
            { x: 220, y: 180, width: 30, height: 20 }  // 澳洲
        ];
        
        ctx.fillStyle = '#4CAF50';
        continents.forEach(continent => {
            ctx.beginPath();
            ctx.ellipse(
                continent.x, 
                continent.y, 
                continent.width, 
                continent.height, 
                0, 0, Math.PI * 2
            );
            ctx.fill();
        });
        
        // 添加冰川
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(128, 20, 40, 20, 0, 0, Math.PI * 2); // 北极
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(128, 236, 40, 20, 0, 0, Math.PI * 2); // 南极
        ctx.fill();
        
        // 添加云层
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const radius = Math.random() * 20 + 10;
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    // 创建木星纹理
    _createJupiterTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // 填充基本颜色
        const baseColor = { r: 216, g: 202, b: 157 }; // 木星的基本颜色
        ctx.fillStyle = `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`;
        ctx.fillRect(0, 0, 256, 256);
        
        // 添加条纹
        const stripeCount = 15;
        const stripeWidth = 256 / stripeCount;
        
        for (let i = 0; i < stripeCount; i++) {
            const y = i * stripeWidth;
            
            // 交替颜色
            if (i % 2 === 0) {
                ctx.fillStyle = 'rgba(180, 160, 120, 0.5)';
            } else {
                ctx.fillStyle = 'rgba(220, 190, 150, 0.5)';
            }
            
            // 不规则的条纹
            const height = stripeWidth * (0.8 + Math.random() * 0.4);
            ctx.fillRect(0, y, 256, height);
        }
        
        // 添加大红斑
        ctx.fillStyle = 'rgba(200, 60, 30, 0.7)';
        ctx.beginPath();
        ctx.ellipse(180, 120, 30, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 添加小斑点
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const radius = Math.random() * 5 + 1;
            
            // 随机颜色
            const r = baseColor.r + (Math.random() * 40 - 20);
            const g = baseColor.g + (Math.random() * 40 - 20);
            const b = baseColor.b + (Math.random() * 40 - 20);
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    _createOrbits() {
        // 为每个行星创建轨道线
        this.planets.forEach(planet => {
            const distance = planet.userData.distance;
            const orbitGeometry = new THREE.BufferGeometry();
            
            // 创建圆形轨道点
            const points = [];
            const segments = 128;
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const x = Math.cos(angle) * distance;
                const z = Math.sin(angle) * distance;
                points.push(new THREE.Vector3(x, 0, z));
            }
            
            orbitGeometry.setFromPoints(points);
            
            const orbitMaterial = new THREE.LineBasicMaterial({
                color: 0x444444,
                transparent: true,
                opacity: 0.3
            });
            
            const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
            this.orbits.push(orbit);
            this.planetGroup.add(orbit);
        });
    }

    update(delta) {
        this.time += delta;
        
        // 更新太阳光晕
        if (this.sunGlow && this.sunGlow.material.uniforms) {
            this.sunGlow.material.uniforms.time.value = this.time;
        }
        
        // 更新太阳自转
        if (this.sun) {
            this.sun.rotation.y += delta * 0.2; // 太阳缓慢自转
        }
        
        // 更新行星位置
        this.planets.forEach(planet => {
            const data = planet.userData;
            
            // 计算公转速度 - 模拟开普勒定律，距离越远越慢
            const orbitSpeed = (1 / data.period) * 0.5;
            data.angle += delta * orbitSpeed;
            
            // 更新行星位置
            planet.position.x = Math.cos(data.angle) * data.distance;
            planet.position.z = Math.sin(data.angle) * data.distance;
            
            // 行星自转 - 根据实际自转周期计算
            // 考虑旋转方向（正负值）
            if (data.rotationPeriod !== 0) {
                const rotationSpeed = (1 / Math.abs(data.rotationPeriod)) * 2;
                const direction = data.rotationPeriod > 0 ? 1 : -1;
                planet.rotation.y += delta * rotationSpeed * direction;
            }
            
            // 对于土星等有光环的行星，保持光环倾角
            if (data.name === "Saturn") {
                // 土星的光环保持固定倾角
                planet.children.forEach(child => {
                    if (child.type === "Group") { // 光环组
                        child.rotation.z = 0; // 重置旋转
                        child.rotation.x = Math.PI / 2; // 保持水平
                    }
                });
            }
        });
        
        // 更新月球位置和自转
        if (this.moonOrbit && this.moon) {
            // 月球公转
            this.moonOrbit.rotation.y += delta * 2;
            
            // 月球自转 - 月球始终面向地球
            if (this.moon.userData && this.moon.userData.rotationPeriod) {
                const rotationSpeed = (1 / this.moon.userData.rotationPeriod) * 2;
                this.moon.rotation.y += delta * rotationSpeed;
            }
        }
        
        // 更新星空背景
        if (this.starField) {
            this.starField.rotation.y = -this.time * 0.01; // 缓慢反向旋转
        }
        
        // 可以添加很小的整体旋转，但不要太大，以免影响观察
        if (this.planetGroup) {
            // 非常缓慢的旋转，仅作为视角变化
            this.planetGroup.rotation.y = this.time * 0.01;
        }
    }

    dispose() {
        // 清理所有创建的资源
        if (this.sun) {
            if (this.sun.material) this.sun.material.dispose();
            if (this.sun.geometry) this.sun.geometry.dispose();
        }
        
        if (this.sunGlow) {
            if (this.sunGlow.material) this.sunGlow.material.dispose();
            if (this.sunGlow.geometry) this.sunGlow.geometry.dispose();
        }
        
        this.planets.forEach(planet => {
            if (planet.material) planet.material.dispose();
            if (planet.geometry) planet.geometry.dispose();
            
            // 处理子对象（如土星环）
            planet.children.forEach(child => {
                if (child.material) child.material.dispose();
                if (child.geometry) child.geometry.dispose();
            });
        });
        
        this.orbits.forEach(orbit => {
            if (orbit.material) orbit.material.dispose();
            if (orbit.geometry) orbit.geometry.dispose();
        });
        
        if (this.moon) {
            if (this.moon.material) this.moon.material.dispose();
            if (this.moon.geometry) this.moon.geometry.dispose();
        }
        
        this.planets = [];
        this.orbits = [];
        
        // 调用父类的 dispose 方法
        super.dispose();
    }
}
