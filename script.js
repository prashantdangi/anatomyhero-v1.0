// Global variables
let scene, camera, renderer, controls;
let loadedModels = {};
let anatomyData = {}; // Will store text data from models
let isDarkMode = false;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let totalModels = 0;
let loadedModelsCount = 0;
let selectedObject = null;
let originalMaterials = new Map();
let lastMouseMoveTime = 0;
const mouseMoveThreshold = 100; // ms

// Annotation related variables
let isAnnotationMode = false;
let currentAnnotationPoint = null;
let annotations = {};

// Add to global variables at the top
let isIsolateMode = false;
let isolatedObject = null;
let isDragging = false;
let dragStart = new THREE.Vector2();
let dragEnd = new THREE.Vector2();
let selectionBox = null;
let originalControlsEnabled = true;
let selectionGrid = null;

// Add these variables at the top with other global variables
let isSelecting = false;
let selectionStart = new THREE.Vector2();
let selectionEnd = new THREE.Vector2();

// DOM Elements
const descriptionPanel = document.getElementById('info-panel');
const closeDescriptionBtn = document.getElementById('close-description');
const partTitle = document.getElementById('part-title');
const partInfo = document.getElementById('part-info');

// Sample descriptions for demonstration purposes
const partDescriptions = {
    // Major parts (shown on click)
    "skeletal": {
        title: "Skeletal System",
        info: "The skeletal system provides structural support and protection for the body's organs. It consists of bones, cartilage, and ligaments."
    },
    "muscular": {
        title: "Muscular System",
        info: "The muscular system enables movement and maintains posture. It consists of skeletal, smooth, and cardiac muscles."
    },
    "cardiovascular": {
        title: "Cardiovascular System",
        info: "The cardiovascular system circulates blood throughout the body, delivering oxygen and nutrients to tissues."
    },
    "nervous": {
        title: "Nervous System",
        info: "The nervous system coordinates voluntary and involuntary actions and transmits signals between different parts of the body."
    },
    "visceral": {
        title: "Visceral Systems",
        info: "The visceral systems include the digestive, respiratory, and urinary systems that maintain the body's internal environment."
    },
    "lymphoid": {
        title: "Lymphoid Organs",
        info: "The lymphoid system helps protect the body from infection and disease by producing and storing white blood cells."
    },
    "joints": {
        title: "Joints",
        info: "Joints are the connections between bones that allow movement and provide mechanical support."
    },
    "regions": {
        title: "Regions of Human Body",
        info: "The human body is divided into major regions including the head, neck, thorax, abdomen, and limbs."
    }
};

// Detailed parts (shown in search)
const detailedPartDescriptions = {
    // Skeletal System
    "skull": {
        title: "Skull",
        info: "The skull is a bony structure that forms the head in vertebrates. It supports the structures of the face and provides a protective cavity for the brain."
    },
    "vertebrae": {
        title: "Vertebrae",
        info: "The vertebrae are the individual bones that make up the spinal column, providing support and protection for the spinal cord."
    },
    "ribs": {
        title: "Ribs",
        info: "The ribs are long curved bones that form the rib cage, protecting the thoracic organs such as the heart and lungs."
    },
    // Muscular System
    "biceps": {
        title: "Biceps",
        info: "The biceps is a two-headed muscle located on the upper arm between the shoulder and the elbow."
    },
    "triceps": {
        title: "Triceps",
        info: "The triceps is a three-headed muscle located on the back of the upper arm, responsible for extending the elbow joint."
    },
    // Cardiovascular System
    "heart": {
        title: "Heart",
        info: "The heart is a muscular organ that pumps blood through the blood vessels of the circulatory system."
    },
    "aorta": {
        title: "Aorta",
        info: "The aorta is the largest artery in the body, originating from the left ventricle of the heart and extending down to the abdomen."
    }
};

// Z-Anatomy and ZygoteBody detailed color scheme
const zAnatomyColors = {
    // Skeletal System
    skeletal: {
        // Bones
        skull: 0xE6E6E6, // Light gray
        mandible: 0xE6E6E6, // Light gray
        vertebrae: 0xE6E6E6, // Light gray
        ribs: 0xE6E6E6, // Light gray
        sternum: 0xE6E6E6, // Light gray
        clavicle: 0xE6E6E6, // Light gray
        scapula: 0xE6E6E6, // Light gray
        humerus: 0xE6E6E6, // Light gray
        radius: 0xE6E6E6, // Light gray
        ulna: 0xE6E6E6, // Light gray
        pelvis: 0xE6E6E6, // Light gray
        femur: 0xE6E6E6, // Light gray
        tibia: 0xE6E6E6, // Light gray
        fibula: 0xE6E6E6, // Light gray
        // Cartilage
        articular: 0xF5F5F5, // Off-white
        costal: 0xF5F5F5, // Off-white
        elastic: 0xF5F5F5, // Off-white
        fibrocartilage: 0xF5F5F5, // Off-white
        // Joints
        synovial: 0xD3D3D3, // Light gray
        fibrous: 0xD3D3D3, // Light gray
        cartilaginous: 0xD3D3D3 // Light gray
    }
    // Commented out other systems for initial deployment
    /*
    // Muscular System
    muscular: {
        // Skeletal Muscles
        head: 0xFF6B6B, // Light red
        neck: 0xFF6B6B, // Light red
        back: 0xFF6B6B, // Light red
        chest: 0xFF6B6B, // Light red
        abdomen: 0xFF6B6B, // Light red
        arm: 0xFF6B6B, // Light red
        forearm: 0xFF6B6B, // Light red
        hand: 0xFF6B6B, // Light red
        thigh: 0xFF6B6B, // Light red
        leg: 0xFF6B6B, // Light red
        foot: 0xFF6B6B, // Light red
        // Tendons
        tendon: 0xFF8C8C, // Lighter red
        // Fascia
        fascia: 0xFFA5A5, // Very light red
        // Smooth Muscle
        smooth: 0xFFB6C1, // Light pink
        // Cardiac Muscle
        cardiac: 0xFF0000 // Red
    },
    // ... other systems ...
    */
};

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
    
    // Camera setup with adjusted position and field of view
    camera = new THREE.PerspectiveCamera(
        50, // Reduced field of view for better perspective
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 7); // Increased Z position to show smaller model
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: true,
        alpha: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    
    // Controls setup with adjusted parameters
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5; // Increased minimum zoom distance
    controls.maxDistance = 15; // Increased maximum zoom distance
    controls.maxPolarAngle = Math.PI / 1.5; // Limit vertical rotation
    
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
    
    // Calculate mouse position relative to canvas
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    if (isIsolateMode) {
        // Don't handle click in isolate mode, let the drag events handle it
        return;
    } else if (isAnnotationMode) {
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        if (intersects.length > 0) {
            currentAnnotationPoint = intersects[0].point;
            showAnnotationDialog();
        }
    } else {
        const visibleObjects = [];
        scene.traverse((object) => {
            if (object instanceof THREE.Mesh && object.visible) {
                visibleObjects.push(object);
            }
        });
        
        const intersects = raycaster.intersectObjects(visibleObjects, true);
        
        if (intersects.length > 0) {
            const selectedPart = intersects[0].object;
            resetSelection();
            selectedObject = selectedPart;
            
            if (!originalMaterials.has(selectedPart.id)) {
                originalMaterials.set(selectedPart.id, selectedPart.material.clone());
            }
            
            highlightObject(selectedPart);
            showPartDescription(selectedPart);
        } else {
            resetSelection();
        }
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
        
        // Hide the panel after 5 seconds
        setTimeout(() => {
            infoPanel.style.display = 'none';
        }, 5000);
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
        
        // Update the path to use the correct base URL for Vercel deployment
        const modelUrl = `/public/models/${modelPath}`; // Updated path for Vercel
        
        console.log(`Attempting to load model from: ${modelUrl}`); // Debug log
        
        // Add error handling for missing model
        const errorHandler = (error) => {
            console.error(`Error loading model ${modelPath}:`, error);
            
            // Check if it's a network error
            if (error.message.includes('Unexpected token') || error.message.includes('JSON')) {
                const errorMessage = `Network error loading ${systemName} model. Please check your internet connection and try again.`;
                document.getElementById('loading-text').textContent = errorMessage;
            } else {
                const errorMessage = `Failed to load ${systemName} model. Please ensure the model file exists at: ${modelUrl}`;
                document.getElementById('loading-text').textContent = errorMessage;
            }
            
            // Show more detailed error information
            const errorDiv = document.createElement('div');
            errorDiv.style.color = 'red';
            errorDiv.style.padding = '10px';
            errorDiv.style.margin = '10px';
            errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
            errorDiv.style.borderRadius = '5px';
            errorDiv.innerHTML = `
                <strong>Error loading model:</strong><br>
                Model: ${modelPath}<br>
                URL: ${modelUrl}<br>
                Error: ${error.message || 'Model file not found'}<br>
                <br>
                Please ensure:<br>
                1. The model file exists in the public/models directory<br>
                2. The file name matches exactly (case-sensitive)<br>
                3. The file is a valid GLB format<br>
                4. You have a stable internet connection
            `;
            document.getElementById('loading-container').appendChild(errorDiv);
            
            reject(new Error(errorMessage));
        };
        
        // Add timeout handling
        const timeout = setTimeout(() => {
            errorHandler(new Error('Model loading timed out. The file might be too large.'));
        }, 30000); // 30 second timeout
        
        loader.load(
            modelUrl,
            (gltf) => {
                clearTimeout(timeout);
                console.log(`Successfully loaded model: ${modelPath}`);
                // Extract any text content from the model for search
                extractModelData(gltf, systemName);
                
                // Hide model initially
                gltf.scene.visible = false;
                
                // Apply Z-Anatomy colors to the model
                applyZAnatomyColors(gltf.scene, systemName);
                
                // Center and scale the model
                const box = new THREE.Box3().setFromObject(gltf.scene);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 5.0 / maxDim;
                
                gltf.scene.position.sub(center.multiplyScalar(scale));
                gltf.scene.position.y = -2.5;
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
                const percent = (xhr.loaded / xhr.total * 100).toFixed(0);
                document.getElementById('loading-text').textContent = `Loading ${systemName}... ${percent}%`;
            },
            errorHandler
        );
    });
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    updateAnnotationPositions();
    renderer.render(scene, camera);
}

// Extract textual data from model
function extractModelData(gltf, systemName) {
    // This function would extract text data from GLTF 
    // For demo purposes, we'll populate with sample data
    anatomyData[systemName] = {
        parts: []
    };
    
    // Sample data - in a real app this would come from the GLTF
    const sampleData = {
        'skeletal': ['Skull', 'Vertebrae', 'Ribs', 'Pelvis', 'Femur', 'Tibia', 'Humerus']
        // Commented out other systems for initial deployment
        /*
        'joints': ['Knee Joint', 'Hip Joint', 'Shoulder Joint', 'Elbow Joint', 'Ankle Joint'],
        'muscular': ['Biceps', 'Triceps', 'Quadriceps', 'Hamstrings', 'Pectoralis'],
        'muscular_insertion': ['Biceps Insertion', 'Triceps Insertion', 'Quadriceps Insertion'],
        'cardiovascular': ['Heart', 'Aorta', 'Pulmonary Artery', 'Coronary Arteries'],
        'lymphoid': ['Lymph Nodes', 'Thymus', 'Spleen', 'Tonsils', 'Lymphatic Vessels'],
        'nervous': ['Brain', 'Spinal Cord', 'Cranial Nerves', 'Sciatic Nerve', 'Brachial Plexus'],
        'visceral': ['Heart', 'Lungs', 'Liver', 'Stomach', 'Intestines', 'Kidneys'],
        'regions': ['Head', 'Neck', 'Thorax', 'Abdomen', 'Upper Limb', 'Lower Limb']
        */
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
    // Reset camera controls
    controls.reset();
    
    // Reset all checkboxes
    document.querySelectorAll('.system-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Hide all models first
    Object.keys(loadedModels).forEach(key => {
        loadedModels[key].visible = false;
    });
    
    // Show only the skeletal model
    if (loadedModels['skeletal']) {
        loadedModels['skeletal'].visible = true;
        // Check the skeletal checkbox
        const skeletalCheckbox = document.getElementById('skeletal');
        if (skeletalCheckbox) {
            skeletalCheckbox.checked = true;
        }
    }
    
    // Reset isolated object and selection box
    if (isolatedObject || selectionBox) {
        scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.visible = true;
            }
        });
        if (selectionBox) {
            selectionBox.visible = false;
        }
        isolatedObject = null;
    }
    
    // Reset cursor
    const canvas = document.getElementById('scene-canvas');
    canvas.style.cursor = 'default';
    
    // Exit isolate mode if active
    if (isIsolateMode) {
        isIsolateMode = false;
        document.body.classList.remove('isolate-mode');
        const isolateOption = document.querySelector('.view-option:last-child');
        isolateOption.classList.remove('active');
    }
    
    // Reset fade mode if active
    if (document.body.classList.contains('fade-mode')) {
        document.body.classList.remove('fade-mode');
        const fadeOption = document.querySelector('.view-option:nth-child(2)');
        fadeOption.classList.remove('active');
        
        // Reset opacity of all objects
        scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.material.opacity = 0.8;
            }
        });
    }
    
    // Reset annotation mode if active
    if (isAnnotationMode) {
        isAnnotationMode = false;
        document.body.classList.remove('annotation-mode');
        const annotateOption = document.querySelector('.view-option:first-child');
        annotateOption.classList.remove('active');
    }
    
    // Reset selection
    resetSelection();
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
    // Create a temporary canvas to render the scene
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d');
    
    // Set the temporary canvas size to match the renderer
    tempCanvas.width = renderer.domElement.width;
    tempCanvas.height = renderer.domElement.height;
    
    // Render the scene to the temporary canvas
    renderer.render(scene, camera);
    
    // Get the data URL from the renderer's canvas
    const dataURL = renderer.domElement.toDataURL('image/png');
    
    // Create a download link
    const link = document.createElement('a');
    link.download = 'anatomyhero-screenshot.png';
    link.href = dataURL;
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

// Function to fetch Wikipedia description
async function fetchWikipediaDescription(partName) {
    try {
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(partName)}&origin=*`;
        const response = await fetch(searchUrl);
        const data = await response.json();
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        
        if (pageId === '-1') {
            // If no exact match, try searching
            const searchApiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(partName + " anatomy")}&format=json&origin=*`;
            const searchResponse = await fetch(searchApiUrl);
            const searchData = await searchResponse.json();
            
            if (searchData.query.search.length > 0) {
                const firstResult = searchData.query.search[0];
                const newSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(firstResult.title)}&origin=*`;
                const newResponse = await fetch(newSearchUrl);
                const newData = await newResponse.json();
                const newPages = newData.query.pages;
                const newPageId = Object.keys(newPages)[0];
                return newPages[newPageId].extract || "No detailed description available.";
            }
            return "No detailed description available.";
        }
        
        return pages[pageId].extract || "No detailed description available.";
    } catch (error) {
        console.error('Error fetching Wikipedia description:', error);
        return "Error fetching description. Please try again later.";
    }
}

// Get part description
async function getPartDescription(partName, isSearch = false) {
    const lowerCaseName = partName.toLowerCase();
    
    // For search results, use detailed descriptions
    if (isSearch) {
        if (detailedPartDescriptions[lowerCaseName]) {
            return detailedPartDescriptions[lowerCaseName];
        }
        
        for (const key in detailedPartDescriptions) {
            if (lowerCaseName.includes(key)) {
                return detailedPartDescriptions[key];
            }
        }
    }
    
    // For click interactions, use major part descriptions or fetch from Wikipedia
    if (partDescriptions[lowerCaseName]) {
        const desc = partDescriptions[lowerCaseName];
        const wikiDesc = await fetchWikipediaDescription(desc.title);
        return {
            title: desc.title,
            info: wikiDesc
        };
    }
    
    // If no predefined description, fetch from Wikipedia
    const wikiDesc = await fetchWikipediaDescription(partName);
    return {
        title: partName,
        info: wikiDesc
    };
}

// Show part description
async function showPartDescription(part, isSearch = false) {
    let partName = part.name || "Unknown Part";
    if (partName === "" || partName === "Unknown Part") {
        if (part.parent && part.parent.name) {
            partName = part.parent.name;
        }
    }
    
    // Show loading state
    partTitle.textContent = partName;
    partInfo.textContent = "Loading description...";
    descriptionPanel.classList.add('active');
    
    // Fetch and show description
    const description = await getPartDescription(partName, isSearch);
    partTitle.textContent = description.title;
    partInfo.textContent = description.info;
}

// Search function
function performSearch(query) {
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = '';
    
    if (!query) return;
    
    query = query.toLowerCase();
    let results = [];
    
    // Search through detailed parts
    Object.keys(detailedPartDescriptions).forEach(part => {
        if (part.toLowerCase().includes(query)) {
            results.push({
                name: part,
                description: detailedPartDescriptions[part]
            });
        }
    });
    
    // Display results
    if (results.length > 0) {
        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.textContent = result.name;
            
            resultItem.addEventListener('click', () => {
                // Show the description
                partTitle.textContent = result.description.title;
                partInfo.textContent = result.description.info;
                descriptionPanel.classList.add('active');
                
                // Highlight the part if it exists in the scene
                highlightPartByName(result.name);
            });
            
            searchResults.appendChild(resultItem);
        });
    } else {
        const noResults = document.createElement('div');
        noResults.textContent = 'No results found';
        searchResults.appendChild(noResults);
    }
}

// Highlight part by name
function highlightPartByName(partName) {
    // Reset previous selection
    resetSelection();
    
    // Find the part in the scene
    scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
            const objectName = object.name.toLowerCase();
            if (objectName.includes(partName.toLowerCase())) {
                selectedObject = object;
                
                // Store original material
                if (!originalMaterials.has(object.id)) {
                    originalMaterials.set(object.id, object.material.clone());
                }
                
                // Highlight the part
                highlightObject(object);
                return;
            }
        }
    });
}

// Mouse move handler for highlighting
function onMouseMove(event) {
    const now = Date.now();
    if (now - lastMouseMoveTime < mouseMoveThreshold) return;
    lastMouseMoveTime = now;
    
    const canvas = document.getElementById('scene-canvas');
    const rect = canvas.getBoundingClientRect();
    
    // Calculate mouse position relative to canvas
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    // Only check for intersections with visible objects
    const visibleObjects = [];
    scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object.visible) {
            visibleObjects.push(object);
        }
    });
    
    const intersects = raycaster.intersectObjects(visibleObjects, true);
    
    // Check if fade mode is active
    const isFadeMode = document.body.classList.contains('fade-mode');
    
    // Reset all objects to original materials except selected
    scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object !== selectedObject) {
            if (originalMaterials.has(object.id)) {
                const origMaterial = originalMaterials.get(object.id);
                object.material = origMaterial.clone();
                // Maintain fade mode opacity
                if (isFadeMode) {
                    object.material.opacity = 0.3;
                }
            }
        }
    });
    
    // Highlight hovered object if not selected
    if (intersects.length > 0) {
        const hoveredPart = intersects[0].object;
        if (hoveredPart !== selectedObject && hoveredPart instanceof THREE.Mesh) {
            if (!originalMaterials.has(hoveredPart.id)) {
                originalMaterials.set(hoveredPart.id, hoveredPart.material.clone());
            }
            
            const hoverMaterial = originalMaterials.get(hoveredPart.id).clone();
            if (hoverMaterial.emissive !== undefined) {
                hoverMaterial.emissive = new THREE.Color(0x333333);
            }
            // Maintain fade mode opacity even on hover
            if (isFadeMode) {
                hoverMaterial.opacity = 0.3;
            }
            hoveredPart.material = hoverMaterial;
            
            canvas.style.cursor = 'pointer';
        } else {
            canvas.style.cursor = 'default';
        }
    } else {
        canvas.style.cursor = 'default';
    }
}

// Highlight selected object
function highlightObject(object) {
    if (!originalMaterials.has(object.id)) {
        originalMaterials.set(object.id, object.material.clone());
    }
    
    const highlightMaterial = originalMaterials.get(object.id).clone();
    highlightMaterial.emissive = new THREE.Color(0x999900);
    highlightMaterial.emissiveIntensity = 0.5;
    highlightMaterial.opacity = 1.0;
    highlightMaterial.transparent = true;
    object.material = highlightMaterial;
}

// Reset selection
function resetSelection() {
    if (selectedObject) {
        if (originalMaterials.has(selectedObject.id)) {
            const originalMaterial = originalMaterials.get(selectedObject.id);
            selectedObject.material = originalMaterial.clone();
            selectedObject.material.opacity = 0.8; // Reset opacity
        }
        selectedObject = null;
    }
    
    descriptionPanel.classList.remove('active');
}

// Get Z-Anatomy color for a specific part
function getZAnatomyColor(partName, systemName) {
    const lowerPartName = partName.toLowerCase();
    const systemColors = zAnatomyColors[systemName];
    
    if (systemColors) {
        // First try exact matches
        for (const partType in systemColors) {
            if (lowerPartName === partType.toLowerCase()) {
                return systemColors[partType];
            }
        }
        
        // Then try partial matches
        for (const partType in systemColors) {
            if (lowerPartName.includes(partType.toLowerCase())) {
                return systemColors[partType];
            }
        }
        
        // Default to first color in the system's color palette
        return systemColors[Object.keys(systemColors)[0]];
    }
    
    // Default color if no matching system or part is found
    return 0xFFFFFF;
}

// Apply Z-Anatomy colors to the model
function applyZAnatomyColors(object, systemName) {
    object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            // Get the appropriate color based on the system and part name
            const color = getZAnatomyColor(child.name, systemName);
            
            // Create a new material with the Z-Anatomy color
            const material = new THREE.MeshPhongMaterial({
                color: color,
                shininess: 30,
                specular: 0x111111,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide // Render both sides of the mesh
            });
            
            // Apply the material
            child.material = material;
            
            // Store original material for highlighting
            originalMaterials.set(child.id, material.clone());
        }
    });
}

// Function to search for a term when clicked
function searchForTerm(term) {
    const searchInput = document.getElementById('search-input');
    searchInput.value = term;
    performSearch(term);
}

// Load annotations from localStorage
function loadAnnotations() {
    const savedAnnotations = localStorage.getItem('anatomyAnnotations');
    if (savedAnnotations) {
        annotations = JSON.parse(savedAnnotations);
        displayAnnotations();
    }
}

// Save annotations to localStorage
function saveAnnotations() {
    localStorage.setItem('anatomyAnnotations', JSON.stringify(annotations));
}

// Display all annotations
function displayAnnotations() {
    const container = document.getElementById('annotations-container');
    container.innerHTML = '';
    
    Object.keys(annotations).forEach(key => {
        const annotation = annotations[key];
        const marker = document.createElement('div');
        marker.className = 'annotation-marker';
        marker.dataset.id = key;
        
        const popup = document.createElement('div');
        popup.className = 'annotation-popup';
        popup.innerHTML = `
            <div class="popup-header">
                <h4>${annotation.title}</h4>
                <div class="popup-actions">
                    <button class="delete-annotation" title="Delete annotation">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="close-popup">&times;</button>
                </div>
            </div>
            <p>${annotation.description}</p>
        `;
        
        marker.appendChild(popup);
        container.appendChild(marker);
        
        // Add click event to show/hide popup
        marker.addEventListener('click', (e) => {
            e.stopPropagation();
            const popup = marker.querySelector('.annotation-popup');
            popup.classList.toggle('active');
        });
        
        // Add click event to close popup
        const closeBtn = popup.querySelector('.close-popup');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            popup.classList.remove('active');
        });

        // Add click event to delete annotation
        const deleteBtn = popup.querySelector('.delete-annotation');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this annotation?')) {
                delete annotations[key];
                saveAnnotations();
                displayAnnotations();
            }
        });
    });
    
    // Update annotation positions
    updateAnnotationPositions();
}

// Update annotation positions based on camera and model movement
function updateAnnotationPositions() {
    Object.keys(annotations).forEach(key => {
        const annotation = annotations[key];
        const marker = document.querySelector(`.annotation-marker[data-id="${key}"]`);
        if (marker) {
            const worldPosition = new THREE.Vector3().fromArray(annotation.worldPosition);
            const screenPos = getScreenPosition(worldPosition);
            marker.style.left = `${screenPos.x}px`;
            marker.style.top = `${screenPos.y}px`;
        }
    });
}

// Show annotation dialog
function showAnnotationDialog() {
    const dialog = document.getElementById('annotation-dialog');
    dialog.classList.add('active');
    
    // Clear previous values
    document.getElementById('annotation-title').value = '';
    document.getElementById('annotation-description').value = '';
    
    // Add event listeners for dialog buttons
    const saveBtn = document.getElementById('save-annotation');
    const cancelBtn = document.getElementById('cancel-annotation');
    const closeBtn = document.querySelector('.close-dialog-btn');
    
    const closeDialog = () => {
        dialog.classList.remove('active');
        currentAnnotationPoint = null;
    };
    
    saveBtn.onclick = () => {
        const title = document.getElementById('annotation-title').value.trim();
        const description = document.getElementById('annotation-description').value.trim();
        
        if (title && description && currentAnnotationPoint) {
            const annotationId = Date.now().toString();
            
            annotations[annotationId] = {
                title,
                description,
                worldPosition: currentAnnotationPoint.toArray()
            };
            
            saveAnnotations();
            displayAnnotations();
            closeDialog();
        }
    };
    
    cancelBtn.onclick = closeDialog;
    closeBtn.onclick = closeDialog;
}

// Convert 3D position to screen coordinates
function getScreenPosition(position) {
    const vector = position.clone();
    vector.project(camera);
    
    const x = (vector.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
    const y = -(vector.y * 0.5 - 0.5) * renderer.domElement.clientHeight;
    
    return { x, y };
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Show loading screen
    initializeLoading();
    
    // Initialize 3D scene
    initScene();
    
    // Show info panel by default
    document.getElementById('info-panel').classList.add('active');
    
    // Add event listeners for part selection
    const canvas = document.getElementById('scene-canvas');
    canvas.addEventListener('click', onCanvasClick);
    canvas.addEventListener('mousemove', onMouseMove);
    
    // Add expand button functionality
    const expandBtn = document.getElementById('expand-description');
    const infoContent = document.getElementById('info-panel-content');
    
    expandBtn.addEventListener('click', () => {
        expandBtn.classList.toggle('expanded');
        infoContent.classList.toggle('expanded');
    });

    // Add view options functionality
    const viewOptions = document.querySelectorAll('.view-option');
    viewOptions.forEach(option => {
        option.addEventListener('click', () => {
            const action = option.querySelector('span').textContent.toLowerCase();
            switch(action) {
                case 'annotate':
                    toggleAnnotationMode();
                    break;
                case 'fade':
                    toggleFadeMode();
                    break;
                case 'isolate':
                    toggleIsolateMode();
                    break;
            }
        });
    });
    
    // Load models
    const systemCheckboxes = document.querySelectorAll('.system-checkbox');
    const modelLoadPromises = [];
    
    systemCheckboxes.forEach(checkbox => {
        const systemName = checkbox.id;
        const modelPath = checkbox.getAttribute('data-model');
        
        modelLoadPromises.push(loadModel(modelPath, systemName));
        
        checkbox.addEventListener('change', (e) => {
            toggleSystem(systemName, e.target.checked);
            if (e.target.checked) {
                // Uncheck other checkboxes
                systemCheckboxes.forEach(cb => {
                    if (cb !== checkbox) {
                        cb.checked = false;
                        toggleSystem(cb.id, false);
                    }
                });
            }
        });
    });
    
    // When all models are loaded
    Promise.all(modelLoadPromises)
        .then(() => {
            console.log('All models loaded successfully');
            const loadingContainer = document.getElementById('loading-container');
            loadingContainer.style.opacity = '0';
            setTimeout(() => {
                loadingContainer.style.display = 'none';
                // Show skeletal system by default
                if (loadedModels['skeletal']) {
                    loadedModels['skeletal'].visible = true;
                }
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

    const hideInterfaceBtn = document.getElementById('hide-interface-btn');
    let isInterfaceHidden = false;

    hideInterfaceBtn.addEventListener('click', function() {
        isInterfaceHidden = !isInterfaceHidden;
        document.body.classList.toggle('interface-hidden', isInterfaceHidden);
        
        // Update button icon and text
        const icon = hideInterfaceBtn.querySelector('i');
        const text = hideInterfaceBtn.querySelector('span') || document.createElement('span');
        
        if (isInterfaceHidden) {
            icon.className = 'fas fa-eye';
            text.textContent = 'Show Interface';
        } else {
            icon.className = 'fas fa-eye-slash';
            text.textContent = 'Hide Interface';
        }
        
        if (!hideInterfaceBtn.contains(text)) {
            hideInterfaceBtn.appendChild(text);
        }

        // Adjust camera and controls if needed
        if (isInterfaceHidden) {
            // You might want to adjust the camera position or controls here
            // For example:
            // camera.position.set(0, 0, 5);
            // controls.update();
        }
    });

    // Load saved annotations
    loadAnnotations();
    
    // Add click event listener to close annotation popups when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.annotation-marker')) {
            document.querySelectorAll('.annotation-popup.active').forEach(popup => {
                popup.classList.remove('active');
            });
        }
    });
});

// View options functions
function toggleAnnotationMode() {
    isAnnotationMode = !isAnnotationMode;
    document.body.classList.toggle('annotation-mode', isAnnotationMode);
    const annotateOption = document.querySelector('.view-option:first-child');
    annotateOption.classList.toggle('active', isAnnotationMode);
    
    // Change cursor when in annotation mode
    const canvas = document.getElementById('scene-canvas');
    canvas.style.cursor = isAnnotationMode ? 'crosshair' : 'default';
}

function toggleFadeMode() {
    // Toggle fade mode
    const isFadeMode = document.body.classList.toggle('fade-mode');
    const fadeOption = document.querySelector('.view-option:nth-child(2)');
    fadeOption.classList.toggle('active', isFadeMode);
    
    // Adjust opacity of non-selected parts
    scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object !== selectedObject) {
            if (isFadeMode) {
                object.material.opacity = 0.3;
            } else {
                object.material.opacity = 0.8;
            }
        }
    });
}

function createSelectionGrid() {
    const size = 10;
    const divisions = 10;
    const gridHelper = new THREE.GridHelper(size, divisions, 0x00ff00, 0x00ff00);
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    gridHelper.position.y = -2.5; // Match the model's y position
    gridHelper.visible = false;
    scene.add(gridHelper);
    return gridHelper;
}

function createSelectionBox() {
    const div = document.createElement('div');
    div.className = 'selection-box';
    div.style.display = 'none';
    document.body.appendChild(div);
    return div;
}

function updateSelectionBox(start, end) {
    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    
    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
}

function getObjectsInSelectionBox() {
    const objects = [];
    const rect = selectionBox.getBoundingClientRect();
    const canvas = document.getElementById('scene-canvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    // Convert selection box to normalized device coordinates
    const startX = ((rect.left - canvasRect.left) / canvasRect.width) * 2 - 1;
    const startY = -((rect.top - canvasRect.top) / canvasRect.height) * 2 + 1;
    const endX = ((rect.right - canvasRect.left) / canvasRect.width) * 2 - 1;
    const endY = -((rect.bottom - canvasRect.top) / canvasRect.height) * 2 + 1;
    
    // Get all visible meshes
    const visibleMeshes = [];
    scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object.visible) {
            visibleMeshes.push(object);
        }
    });
    
    // Check each visible mesh
    visibleMeshes.forEach((mesh) => {
        // Get the bounding box of the mesh
        const boundingBox = new THREE.Box3().setFromObject(mesh);
        const center = boundingBox.getCenter(new THREE.Vector3());
        
        // Project the center point to screen coordinates
        const screenPos = center.clone().project(camera);
        
        // Check if the mesh's center is within the selection box
        const isInBox = screenPos.x >= Math.min(startX, endX) && 
                       screenPos.x <= Math.max(startX, endX) && 
                       screenPos.y >= Math.min(startY, endY) && 
                       screenPos.y <= Math.max(startY, endY);
        
        if (isInBox) {
            objects.push(mesh);
        }
    });
    
    return objects;
}

function onIsolateMouseDown(event) {
    if (!isIsolateMode) return;
    
    const canvas = document.getElementById('scene-canvas');
    const rect = canvas.getBoundingClientRect();
    
    isSelecting = true;
    canvas.classList.add('selecting');
    
    // Store the initial mouse position relative to the canvas
    selectionStart.x = event.clientX - rect.left;
    selectionStart.y = event.clientY - rect.top;
    selectionEnd.copy(selectionStart);
    
    if (!selectionBox) {
        selectionBox = createSelectionBox();
    }
    
    selectionBox.style.display = 'block';
    updateSelectionBox(selectionStart, selectionEnd);
}

function onIsolateMouseMove(event) {
    if (!isSelecting) return;
    
    const canvas = document.getElementById('scene-canvas');
    const rect = canvas.getBoundingClientRect();
    
    // Update the end position relative to the canvas
    selectionEnd.x = event.clientX - rect.left;
    selectionEnd.y = event.clientY - rect.top;
    
    updateSelectionBox(selectionStart, selectionEnd);
}

function onIsolateMouseUp(event) {
    if (!isSelecting) return;
    
    const canvas = document.getElementById('scene-canvas');
    canvas.classList.remove('selecting');
    isSelecting = false;
    
    if (selectionBox) {
        selectionBox.style.display = 'none';
    }
    
    // Get objects in selection box
    const selectedObjects = getObjectsInSelectionBox();
    
    if (selectedObjects.length > 0) {
        // First, hide all objects in the scene
        scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.visible = false;
                object.userData.originalVisibility = false;
            }
        });
        
        // Then show only the selected objects
        selectedObjects.forEach((object) => {
            // Make sure the object and its parent are visible
            object.visible = true;
            object.userData.originalVisibility = true;
            
            let parent = object.parent;
            while (parent && parent !== scene) {
                parent.visible = true;
                parent = parent.parent;
            }
            
            // Center the camera on the selected object
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            // Adjust camera position to focus on the selected object
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
            
            // Add some padding
            cameraZ *= 1.5;
            
            // Set camera position
            camera.position.set(center.x, center.y, center.z + cameraZ);
            camera.lookAt(center);
            
            // Update controls target
            controls.target.copy(center);
            controls.update();
        });
        
        // Show description for the first selected object
        if (selectedObjects[0]) {
            showPartDescription(selectedObjects[0]);
        }
    }
}

function toggleIsolateMode() {
    isIsolateMode = !isIsolateMode;
    
    document.body.classList.toggle('isolate-mode', isIsolateMode);
    const isolateOption = document.querySelector('.view-option:last-child');
    isolateOption.classList.toggle('active', isIsolateMode);
    
    const canvas = document.getElementById('scene-canvas');
    
    if (isIsolateMode) {
        // Store current controls state and disable them
        originalControlsEnabled = controls.enabled;
        controls.enabled = false;
        
        // Add mouse event listeners for selection
        canvas.addEventListener('mousedown', onIsolateMouseDown);
        canvas.addEventListener('mousemove', onIsolateMouseMove);
        canvas.addEventListener('mouseup', onIsolateMouseUp);
        
        // Make sure all objects are visible when entering isolate mode
        scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.visible = true;
                object.userData.originalVisibility = true;
            }
        });
    } else {
        // Restore controls state
        controls.enabled = originalControlsEnabled;
        
        // Remove mouse event listeners
        canvas.removeEventListener('mousedown', onIsolateMouseDown);
        canvas.removeEventListener('mousemove', onIsolateMouseMove);
        canvas.removeEventListener('mouseup', onIsolateMouseUp);
        
        // Remove selection box if it exists
        if (selectionBox) {
            selectionBox.remove();
            selectionBox = null;
        }
        
        // Restore all objects to their original state
        scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.visible = object.userData.originalVisibility !== undefined ? 
                               object.userData.originalVisibility : true;
            }
        });
        
        isolatedObject = null;
    }
} 