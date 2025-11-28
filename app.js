// --- STATE & DOM ELEMENTS ---
let toolsData = []; // Initialement vide, sera rempli par fetch
const container = document.getElementById('toolsContainer');
const searchInput = document.getElementById('searchInput');
const categoryContainer = document.getElementById('categoryContainer');
const noResults = document.getElementById('noResults');
const toolCount = document.getElementById('toolCount');

// Modal Elements
const modal = document.getElementById('toolModal');
const modalTitle = document.getElementById('modalTitle');
const modalCategory = document.getElementById('modalCategory');
const modalDesc = document.getElementById('modalDesc');
const modalCommand = document.getElementById('modalCommand');
const modalEthical = document.getElementById('modalEthical');

let currentFilter = 'Tous';
let currentSearch = '';

// --- INITIALIZATION (ASYNC) ---
async function init() {
    try {
        // Chargement du JSON externe
        const response = await fetch('tools.json');
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        toolsData = await response.json();
        
        // Démarrage de l'app une fois les données reçues
        renderCategories();
        renderTools();
        updateCount();
        setupEventListeners();

    } catch (error) {
        console.error("Impossible de charger les outils :", error);
        container.innerHTML = `
            <div class="col-span-full text-center text-red-500 py-10">
                <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
                <p>Erreur de chargement des données (tools.json).</p>
                <p class="text-xs text-gray-500 mt-2">Si vous testez en local, utilisez un serveur local (Live Server).</p>
            </div>
        `;
    }
}

function setupEventListeners() {
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        renderTools();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    document.addEventListener('keydown', (e) => {
        if(e.key === "Escape" && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
}

// --- RENDER FUNCTIONS ---
function renderCategories() {
    const categories = ['Tous', ...new Set(toolsData.map(tool => tool.category))];
    
    categoryContainer.innerHTML = categories.map(cat => `
        <button 
            onclick="setCategory('${cat}')"
            class="px-3 py-1 text-xs md:text-sm border border-cyber-greenDim hover:bg-cyber-green hover:text-black transition-all duration-300 rounded-sm uppercase tracking-wide ${currentFilter === cat ? 'bg-cyber-green text-black font-bold shadow-[0_0_10px_#00ff41]' : 'text-cyber-green bg-cyber-dark'}"
        >
            ${cat}
        </button>
    `).join('');
}

function renderTools() {
    container.innerHTML = '';
    
    const filteredTools = toolsData.filter(tool => {
        const matchesCategory = currentFilter === 'Tous' || tool.category === currentFilter;
        const matchesSearch = tool.name.toLowerCase().includes(currentSearch) || 
                              tool.shortDesc.toLowerCase().includes(currentSearch) ||
                              tool.category.toLowerCase().includes(currentSearch);
        return matchesCategory && matchesSearch;
    });

    if (filteredTools.length === 0) {
        noResults.classList.remove('hidden');
        toolCount.textContent = 0;
    } else {
        noResults.classList.add('hidden');
        toolCount.textContent = filteredTools.length;
        
        filteredTools.forEach(tool => {
            const card = document.createElement('div');
            card.className = 'bg-cyber-dark border border-cyber-greenDim p-5 rounded-sm hover:border-cyber-green hover:shadow-[0_0_15px_rgba(0,255,65,0.15)] transition-all cursor-pointer group tool-card flex flex-col justify-between h-full relative overflow-hidden';
            card.onclick = () => openModal(tool);
            
            const decoration = document.createElement('div');
            decoration.className = 'absolute top-0 right-0 w-4 h-4 border-t border-r border-cyber-green opacity-50 group-hover:opacity-100 transition-opacity';
            card.appendChild(decoration);

            card.innerHTML += `
                <div>
                    <div class="flex justify-between items-start mb-3">
                        <h3 class="text-xl font-bold text-cyber-green group-hover:neon-text transition-all tracking-wide">${tool.name}</h3>
                        <span class="text-[10px] text-cyber-purple border border-cyber-purple px-2 py-0.5 rounded uppercase">${tool.category}</span>
                    </div>
                    <p class="text-gray-400 text-sm mb-4 line-clamp-3 font-sans">${tool.shortDesc}</p>
                </div>
                <div class="flex justify-between items-end border-t border-gray-800 pt-3 mt-2">
                    <span class="text-xs text-gray-600 font-mono">ID: ${String(tool.id).padStart(3, '0')}</span>
                    <span class="text-xs text-cyber-greenDim group-hover:text-cyber-green font-mono transition-colors">./ACCESS >></span>
                </div>
            `;
            container.appendChild(card);
        });
    }
}

function updateCount() {
    toolCount.textContent = toolsData.length;
}

// --- ACTIONS ---
// Note: Ces fonctions doivent être accessibles globalement (window) car appelées via onclick="" dans le HTML
window.setCategory = function(cat) {
    currentFilter = cat;
    renderCategories();
    renderTools();
}

window.closeModal = function() {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto'; 
}

window.copyToClipboard = function() {
    const text = modalCommand.textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('#toolModal button i.fa-copy').parentNode;
        const originalHtml = btn.innerHTML;
        
        btn.innerHTML = '<i class="fas fa-check"></i> <span>Copié !</span>';
        btn.classList.add('text-cyber-green', 'border-cyber-green');
        
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.classList.remove('text-cyber-green', 'border-cyber-green');
        }, 2000);
    }).catch(err => {
        console.error('Erreur :', err);
    });
}

function openModal(tool) {
    modalTitle.textContent = tool.name;
    modalCategory.textContent = tool.category;
    modalDesc.textContent = tool.fullDesc;
    modalCommand.textContent = tool.command;
    modalEthical.textContent = tool.ethicalUse;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 
}

// Start App
init();
