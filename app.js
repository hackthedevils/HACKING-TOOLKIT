// --- STATE & DOM ELEMENTS ---
let toolsData = [];
const container = document.getElementById('toolsContainer');
const searchInput = document.getElementById('searchInput');
const categoryContainer = document.getElementById('categoryContainer');
const noResults = document.getElementById('noResults');
const toolCount = document.getElementById('toolCount');

// Modal Elements
const modal = document.getElementById('toolModal');
const modalTitle = document.getElementById('modalTitle');
const modalCategory = document.getElementById('modalCategory');
const modalTags = document.getElementById('modalTags');
const modalDesc = document.getElementById('modalDesc');
const modalInputsArea = document.getElementById('modalInputsArea');
const modalCommandCode = document.getElementById('modalCommandCode');
const modalLink = document.getElementById('modalLink');
const modalEthical = document.getElementById('modalEthical');

let currentFilter = 'Tous';
let currentSearch = '';
let favorites = JSON.parse(localStorage.getItem('hackingToolkitFavs')) || [];
let currentToolId = null;

// --- INITIALIZATION ---
async function init() {
    try {
        const response = await fetch('tools.json');
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        toolsData = await response.json();
        
        renderCategories();
        renderTools();
        updateCount();
        setupEventListeners();
    } catch (error) {
        console.error("Erreur chargement:", error);
        container.innerHTML = `
            <div class="col-span-full text-center text-red-500 py-10 border border-red-900 bg-red-900 bg-opacity-10 rounded">
                <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
                <p>Impossible de charger le fichier de données (tools.json).</p>
                <p class="text-xs text-gray-500 mt-2">Assurez-vous de lancer ce projet via un Serveur Local ou GitHub Pages.</p>
            </div>`;
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
        if(e.key === "Escape" && !modal.classList.contains('hidden')) closeModal();
    });
}

// --- RENDER FUNCTIONS ---
function renderCategories() {
    const categories = ['Tous', 'Favoris', ...new Set(toolsData.map(tool => tool.category))];
    categoryContainer.innerHTML = categories.map(cat => `
        <button onclick="setCategory('${cat}')"
            class="px-3 py-1 text-xs md:text-sm border border-cyber-greenDim hover:bg-cyber-green hover:text-black transition-all duration-300 rounded-sm uppercase tracking-wide 
            ${currentFilter === cat ? 'bg-cyber-green text-black font-bold shadow-[0_0_10px_#00ff41]' : 'text-cyber-green bg-cyber-dark'}">
            ${cat === 'Favoris' ? '<i class="fas fa-star mr-1"></i>' : ''}${cat}
        </button>
    `).join('');
}

function renderTools() {
    container.innerHTML = '';
    
    const filteredTools = toolsData.filter(tool => {
        // Filtre catégorie
        let matchesCategory = true;
        if (currentFilter === 'Favoris') {
            matchesCategory = favorites.includes(tool.id);
        } else if (currentFilter !== 'Tous') {
            matchesCategory = tool.category === currentFilter;
        }

        // Filtre recherche
        const matchesSearch = tool.name.toLowerCase().includes(currentSearch) || 
                              tool.shortDesc.toLowerCase().includes(currentSearch) ||
                              (tool.tags && tool.tags.some(t => t.toLowerCase().includes(currentSearch)));
        
        return matchesCategory && matchesSearch;
    });

    if (filteredTools.length === 0) {
        noResults.classList.remove('hidden');
        toolCount.textContent = 0;
    } else {
        noResults.classList.add('hidden');
        toolCount.textContent = filteredTools.length;
        
        filteredTools.forEach(tool => {
            const isFav = favorites.includes(tool.id);
            const card = document.createElement('div');
            card.className = 'bg-cyber-dark border border-cyber-greenDim p-5 rounded-sm hover:border-cyber-green hover:shadow-[0_0_15px_rgba(0,255,65,0.15)] transition-all relative group tool-card flex flex-col justify-between h-full';
            
            card.innerHTML = `
                <div class="cursor-pointer" onclick="openModal(${tool.id})">
                    <div class="flex justify-between items-start mb-3">
                        <h3 class="text-xl font-bold text-cyber-green group-hover:neon-text transition-all tracking-wide">${tool.name}</h3>
                        <span class="text-[10px] text-cyber-purple border border-cyber-purple px-2 py-0.5 rounded uppercase">${tool.category}</span>
                    </div>
                    
                    <div class="mb-3 flex gap-1 flex-wrap">
                        ${tool.tags ? tool.tags.map(t => `<span class="text-[9px] bg-gray-900 border border-gray-700 text-gray-400 px-1 rounded">${t}</span>`).join('') : ''}
                    </div>

                    <p class="text-gray-400 text-sm mb-4 line-clamp-3 font-sans">${tool.shortDesc}</p>
                </div>
                
                <div class="flex justify-between items-end border-t border-gray-800 pt-3 mt-2">
                    <button onclick="toggleFavorite(${tool.id}, this)" class="text-lg transition-colors focus:outline-none ${isFav ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}">
                        <i class="${isFav ? 'fas' : 'far'} fa-star"></i>
                    </button>
                    <button onclick="openModal(${tool.id})" class="text-xs text-cyber-greenDim group-hover:text-cyber-green font-mono transition-colors">./ACCESS >></button>
                </div>
            `;
            container.appendChild(card);
        });
    }
}

function updateCount() { toolCount.textContent = toolsData.length; }

// --- LOGIQUE MODALE & COMMAND BUILDER ---
window.openModal = function(id) {
    const tool = toolsData.find(t => t.id === id);
    if(!tool) return;

    currentToolId = id;
    modalTitle.textContent = tool.name;
    modalCategory.textContent = tool.category;
    modalDesc.textContent = tool.fullDesc;
    modalEthical.textContent = tool.ethicalUse;
    
    // Tags
    modalTags.innerHTML = tool.tags 
        ? tool.tags.map(t => `<span class="px-2 py-1 bg-gray-800 text-cyber-green text-xs rounded border border-gray-700">${t}</span>`).join('') 
        : '';

    // Lien Externe
    modalLink.innerHTML = tool.link 
        ? `<a href="${tool.link}" target="_blank" class="text-cyber-purple hover:text-white underline text-xs transition-colors"><i class="fas fa-external-link-alt mr-1"></i>Site Officiel / Docs</a>` 
        : '';

    // GÉNÉRATION DES INPUTS
    modalInputsArea.innerHTML = '';
    
    if (tool.inputs && tool.inputs.length > 0) {
        tool.inputs.forEach(input => {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = `
                <label class="block text-xs text-gray-500 mb-1 font-mono">${input.label}</label>
                <input type="text" data-key="${input.id}" value="${input.default}" 
                    class="builder-input w-full bg-black border border-gray-700 text-cyber-green text-sm p-2 rounded focus:border-cyber-green focus:outline-none transition-colors placeholder-gray-800"
                >
            `;
            modalInputsArea.appendChild(wrapper);
        });

        // Listeners pour mise à jour live
        const inputs = modalInputsArea.querySelectorAll('.builder-input');
        inputs.forEach(inp => inp.addEventListener('input', updateCommandPreview));
        
        updateCommandPreview(); // Premier calcul
    } else {
        // Pas d'inputs configurables
        modalInputsArea.innerHTML = '<p class="text-xs text-gray-600 italic col-span-full">Aucun paramètre configurable pour cet outil.</p>';
        modalCommandCode.textContent = tool.command;
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 
}

function updateCommandPreview() {
    const tool = toolsData.find(t => t.id === currentToolId);
    let cmd = tool.command;
    
    const inputs = modalInputsArea.querySelectorAll('.builder-input');
    inputs.forEach(inp => {
        const key = inp.getAttribute('data-key');
        const val = inp.value;
        // Regex pour remplacer {{key}}
        cmd = cmd.replace(new RegExp(`{{${key}}}`, 'g'), val);
    });

    modalCommandCode.textContent = cmd;
}

// --- FAVORITES LOGIC ---
window.toggleFavorite = function(id, btn) {
    if(favorites.includes(id)) {
        favorites = favorites.filter(fav => fav !== id);
        if(btn) {
            btn.innerHTML = '<i class="far fa-star"></i>';
            btn.classList.remove('text-yellow-400');
            btn.classList.add('text-gray-600');
        }
    } else {
        favorites.push(id);
        if(btn) {
            btn.innerHTML = '<i class="fas fa-star"></i>';
            btn.classList.add('text-yellow-400');
            btn.classList.remove('text-gray-600');
        }
    }
    localStorage.setItem('hackingToolkitFavs', JSON.stringify(favorites));
    
    // Si on est dans l'onglet favoris, on rafraîchit pour enlever la carte
    if(currentFilter === 'Favoris') renderTools();
}

// --- ACTIONS GLOBALES ---
window.setCategory = function(cat) { currentFilter = cat; renderCategories(); renderTools(); }
window.closeModal = function() { modal.classList.add('hidden'); document.body.style.overflow = 'auto'; }

window.copyToClipboard = function() {
    const text = modalCommandCode.textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyBtn');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.classList.add('text-cyber-green');
        setTimeout(() => { btn.innerHTML = originalHtml; btn.classList.remove('text-cyber-green'); }, 2000);
    });
}

init();
