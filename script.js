// Global variables
let scene, camera, renderer, controls;
let loadedModels = {};
let anatomyData = {}; // Will store text data from models
let isDarkMode = false;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let totalModels = 0;
let loadedModelsCount = 0;

// Initialize loading bar
function initializeLoading() {
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');
    
    // Count total models to load
    totalModels = document.querySelectorAll('.system-checkbox').length;
    
    // Update loading progress
    function updateProgress(progress) {
        loadingBar.style.width = progress + '%';
        loadingText.textContent = `Loading anatomy models... ${progress}%`;
    }
    
    // Start with 0%
    updateProgress(0);
}

// Initialize 3D scene
function initScene() {
    const canvas = document.getElementById('scene-canvas');
    const container = document.getElementById('canvas-container');
    
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(isDarkMode ? 0x000000 : 0xffffff);
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(
        75, 
        container.clientWidth / container.clientHeight, 
        0.1, 
        1000
    );
    camera.position.z = 5;
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: true,
        alpha: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    
    // Controls setup
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Setup lighting
    setupLights();
    
    // Setup raycaster for clicking
    setupRaycaster();
    
    // Handle resize
    window.addEventListener('resize', onWindowResize);
    
    // Animation loop
    animate();
}

function setupLights() {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, isDarkMode ? 0.3 : 0.5);
    scene.add(ambientLight);
    
    // Add directional lights from multiple angles
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, isDarkMode ? 0.5 : 0.8);
    directionalLight1.position.set(5, 10, 7);
    directionalLight1.castShadow = true;
    scene.add(directionalLight1);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, isDarkMode ? 0.3 : 0.5);
    directionalLight2.position.set(-5, 5, -5);
    scene.add(directionalLight2);
    
    const directionalLight3 = new THREE.DirectionalLight(0xffffff, isDarkMode ? 0.2 : 0.3);
    directionalLight3.position.set(0, -10, 0);
    scene.add(directionalLight3);
}

function setupRaycaster() {
    const canvas = document.getElementById('scene-canvas');
    canvas.addEventListener('click', onCanvasClick);
}

function onCanvasClick(event) {
    const canvas = document.getElementById('scene-canvas');
    const rect = canvas.getBoundingClientRect();
    
    mouse.x = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / canvas.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
        const object = getTopLevelObject(intersects[0].object);
        showInfoPanel(object);
    }
}

function getTopLevelObject(object) {
    let currentObj = object;
    while (currentObj.parent && currentObj.parent !== scene) {
        currentObj = currentObj.parent;
    }
    return currentObj;
}

function showInfoPanel(object) {
    const infoPanel = document.getElementById('info-panel');
    const infoContent = document.getElementById('info-content');
    
    if (object.name) {
        infoPanel.style.display = 'block';
        infoContent.innerHTML = `
            <strong>${object.name}</strong><br>
            ${getObjectDescription(object.name)}
        `;
    }
}

function getObjectDescription(objectName) {
    // This would be replaced with actual data from your anatomy database
    return `This is the ${objectName} of the human body.`;
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
}

// Load GLTF models
function loadModel(modelPath, systemName) {
    return new Promise((resolve, reject) => {
        const loader = new THREE.GLTFLoader();
        const dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
        loader.setDRACOLoader(dracoLoader);
        
        loader.load(
            `models/${modelPath}`,
            (gltf) => {
                // Extract any text content from the model for search
                extractModelData(gltf, systemName);
                
                // Hide model initially
                gltf.scene.visible = false;
                
                // Center and scale the model
                const box = new THREE.Box3().setFromObject(gltf.scene);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2 / maxDim;
                
                gltf.scene.position.sub(center.multiplyScalar(scale));
                gltf.scene.scale.multiplyScalar(scale);
                
                // Add to scene and store reference
                scene.add(gltf.scene);
                loadedModels[systemName] = gltf.scene;
                
                // Update loading progress
                loadedModelsCount++;
                const progress = Math.min(100, Math.round((loadedModelsCount / totalModels) * 100));
                document.getElementById('loading-bar').style.width = progress + '%';
                document.getElementById('loading-text').textContent = `Loading ${systemName}... ${progress}%`;
                
                resolve(gltf);
            },
            (xhr) => {
                // Progress callback
                const percent = (xhr.loaded / xhr.total * 100).toFixed(0);
                document.getElementById('loading-text').textContent = `Loading ${systemName}... ${percent}%`;
            },
            (error) => {
                console.error(`Error loading model ${modelPath}:`, error);
                document.getElementById('loading-text').textContent = `Error loading ${systemName}. Please check console for details.`;
                reject(error);
            }
        );
    });
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Extract textual data from model
function extractModelData(gltf, systemName) {
    // This function would extract text data from GLTF 
    // For demo purposes, we'll populate with sample data
    anatomyData[systemName] = {
        parts: []
    };
    
    // In a real implementation, you would iterate through model parts
    // and extract names, descriptions, etc.
    
    // Sample data - in a real app this would come from the GLTF
    const sampleData = {
        'skeletal': ['Skull', 'Vertebrae', 'Ribs', 'Pelvis', 'Femur', 'Tibia', 'Humerus'],
        'joints': ['Knee Joint', 'Hip Joint', 'Shoulder Joint', 'Elbow Joint', 'Ankle Joint'],
        'muscular': ['Biceps', 'Triceps', 'Quadriceps', 'Hamstrings', 'Pectoralis'],
        'fasciate': ['Thoracolumbar Fascia', 'Plantar Fascia', 'Cervical Fascia'],
        'arterial': ['Aorta', 'Carotid Artery', 'Femoral Artery', 'Brachial Artery'],
        'venous': ['Jugular Vein', 'Femoral Vein', 'Superior Vena Cava', 'Portal Vein'],
        'lymphoid': ['Lymph Nodes', 'Thymus', 'Spleen', 'Tonsils', 'Lymphatic Vessels'],
        'nervous': ['Brain', 'Spinal Cord', 'Cranial Nerves', 'Sciatic Nerve', 'Brachial Plexus'],
        'visceral': ['Heart', 'Lungs', 'Liver', 'Stomach', 'Intestines', 'Kidneys'],
        'regions': ['Head', 'Neck', 'Thorax', 'Abdomen', 'Upper Limb', 'Lower Limb'],
        'movements': ['Flexion', 'Extension', 'Abduction', 'Adduction', 'Rotation']
    };
    
    // Add the sample data to our anatomyData object
    if (sampleData[systemName]) {
        sampleData[systemName].forEach(part => {
            anatomyData[systemName].parts.push({
                name: part,
                description: `This is the ${part} of the ${systemName} system.`,
                id: `${systemName}-${part.toLowerCase().replace(/\s/g, '-')}`
            });
        });
    }
}

// Toggle system visibility
function toggleSystem(systemName, isVisible) {
    if (loadedModels[systemName]) {
        loadedModels[systemName].visible = isVisible;
    } else {
        console.warn(`Model for ${systemName} not loaded yet`);
    }
}

// Reset view
function resetView() {
    controls.reset();
    
    // Reset all checkboxes
    document.querySelectorAll('.system-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Hide all models
    Object.keys(loadedModels).forEach(key => {
        loadedModels[key].visible = false;
    });
}

// Toggle fullscreen
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// Take screenshot
function takeScreenshot() {
    html2canvas(document.body).then(canvas => {
        const link = document.createElement('a');
        link.download = 'anatomyhero-screenshot.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

// Toggle dark/light mode
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    
    isDarkMode = !isDarkMode;
    
    if (isDarkMode) {
        body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        if (scene) {
            scene.background = new THREE.Color(0x000000);
            // Update lights for dark mode
            scene.children.forEach(child => {
                if (child instanceof THREE.Light) {
                    if (child instanceof THREE.AmbientLight) {
                        child.intensity = 0.3;
                    } else if (child instanceof THREE.DirectionalLight) {
                        if (child.position.y > 0) {
                            child.intensity = 0.5;
                        } else {
                            child.intensity = 0.2;
                        }
                    }
                }
            });
        }
    } else {
        body.classList.remove('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        if (scene) {
            scene.background = new THREE.Color(0xffffff);
            // Update lights for light mode
            scene.children.forEach(child => {
                if (child instanceof THREE.Light) {
                    if (child instanceof THREE.AmbientLight) {
                        child.intensity = 0.5;
                    } else if (child instanceof THREE.DirectionalLight) {
                        if (child.position.y > 0) {
                            child.intensity = 0.8;
                        } else {
                            child.intensity = 0.3;
                        }
                    }
                }
            });
        }
    }
}

// Search function
function performSearch(query) {
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = '';
    
    if (!query) return;
    
    query = query.toLowerCase();
    let results = [];
    
    // Search through all anatomy data
    Object.keys(anatomyData).forEach(system => {
        anatomyData[system].parts.forEach(part => {
            if (part.name.toLowerCase().includes(query) || 
                part.description.toLowerCase().includes(query)) {
                results.push({
                    system,
                    part
                });
            }
        });
    });
    
    // Display results
    if (results.length > 0) {
        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.textContent = `${result.part.name} (${result.system})`;
            
            resultItem.addEventListener('click', () => {
                // Show the system
                const checkbox = document.getElementById(result.system);
                checkbox.checked = true;
                toggleSystem(result.system, true);
                
                // Show info panel
                const infoPanel = document.getElementById('info-panel');
                const infoContent = document.getElementById('info-content');
                
                infoPanel.style.display = 'block';
                infoContent.innerHTML = `
                    <strong>${result.part.name}</strong><br>
                    ${result.part.description}
                `;
                
                // In a real implementation, you would also highlight 
                // or focus the camera on the specific part
            });
            
            searchResults.appendChild(resultItem);
        });
    } else {
        const noResults = document.createElement('div');
        noResults.textContent = 'No results found';
        searchResults.appendChild(noResults);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Show loading screen
    initializeLoading();
    
    // Initialize 3D scene
    initScene();
    
    // Load models
    const systemCheckboxes = document.querySelectorAll('.system-checkbox');
    const modelLoadPromises = [];
    
    systemCheckboxes.forEach(checkbox => {
        const systemName = checkbox.id;
        const modelPath = checkbox.getAttribute('data-model');
        
        // Add to load queue
        modelLoadPromises.push(loadModel(modelPath, systemName));
        
        // Add event listener
        checkbox.addEventListener('change', (e) => {
            toggleSystem(systemName, e.target.checked);
        });
    });
    
    // When all models are loaded
    Promise.all(modelLoadPromises)
        .then(() => {
            console.log('All models loaded successfully');
            // Fade out loading screen
            const loadingContainer = document.getElementById('loading-container');
            loadingContainer.style.opacity = '0';
            setTimeout(() => {
                loadingContainer.style.display = 'none';
            }, 500);
        })
        .catch(error => {
            console.error('Error loading models:', error);
            document.getElementById('loading-text').textContent = 'Error loading models. Please check console for details.';
        });
    
    // Set up control buttons
    document.getElementById('reset-view-btn').addEventListener('click', resetView);
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
    document.getElementById('screenshot-btn').addEventListener('click', takeScreenshot);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    
    // Set up search
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        performSearch(e.target.value);
    });
}); 