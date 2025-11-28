// --- STATE ---
let toolsData = [];
let playbooksData = [];
let currentFilter = 'Tous';
let currentSearch = '';
let favorites = JSON.parse(localStorage.getItem('hackingToolkitFavs')) || [];

// --- DOM ELEMENTS ---
const container = document.getElementById('toolsContainer');
const playbooksContainer = document.getElementById('playbooksContainer');
const searchInput = document.getElementById('searchInput');
const categoryContainer = document.getElementById('categoryContainer');
const toolCount = document.getElementById('toolCount');
const body = document.body;

// Tabs
const tabTools = document.getElementById('tabTools');
const tabPlaybooks = document.getElementById('tabPlaybooks');
const toolsSection = document.getElementById('toolsSection');
const playbooksSection = document.getElementById('playbooksSection');

// Modal
const modal = document.getElementById('toolModal');

// --- INITIALIZATION ---
async function init() {
    console.log("🚀 Démarrage V5...");
    
    // 1. ACTIVER LES BOUTONS IMMÉDIATEMENT (Correction du bug)
    setupEventListeners();
    
    // 2. Charger le thème
    const savedTheme = localStorage.getItem('hackingToolkitTheme') || 'default';
    setTheme(savedTheme);

    // 3. Charger les données
    try {
        console.log("⏳ Chargement des fichiers JSON...");
        
        // On essaie de charger tools.json
        const resTools = await fetch('tools.json');
        if (!resTools.ok) throw new Error(`Erreur tools.json: ${resTools.status}`);
        toolsData = await resTools.json();
        console.log(`✅ ${toolsData.length} outils chargés.`);

        // On essaie de charger playbooks.json
        const resPlaybooks = await fetch('playbooks.json');
        if (!resPlaybooks.ok) throw new Error(`Erreur playbooks.json: ${resPlaybooks.status}`);
        playbooksData = await resPlaybooks.json();
        console.log(`✅ ${playbooksData.length} playbooks chargés.`);
        
        // 4. Affichage
        renderCategories();
        renderTools();
        renderPlaybooks();
        updateCount();

    } catch (error) {
        console.error("❌ ERREUR CRITIQUE:", error);
        container.innerHTML = `
            <div class="col-span-full text-center text-red-500 py-10 border border-red-900 bg-red-900 bg-opacity-20 rounded p-4">
                <i class="fas fa-bug text-4xl mb-4"></i>
                <h2 class="text-xl font-bold">Erreur de chargement</h2>
                <p class="text-sm mt-2">${error.message}</p>
                <p class="text-xs text-gray-400 mt-4">Vérifiez la console (F12) et assurez-vous que 'tools.json' et 'playbooks.json' sont dans le même dossier.</p>
            </div>`;
    }
}

// --- EVENT LISTENERS (Délégués et Robustes) ---
function setupEventListeners() {
    console.log("🔌 Activation des boutons...");

    // 1. Navigation Tabs (Correction directe)
    if(tabTools && tabPlaybooks) {
        tabTools.addEventListener('click', (e) => { 
            e.preventDefault(); 
            switchTab('tools'); 
        });
        tabPlaybooks.addEventListener('click', (e) => { 
            e.preventDefault(); 
            switchTab('playbooks'); 
        });
    } else {
        console.error("⚠️ Impossible de trouver les boutons des onglets dans le HTML.");
    }

    // 2. Recherche
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            renderTools();
            renderPlaybooks();
        });
    }

    // 3. Clics globaux (Délégation pour les cartes et favoris)
    document.addEventListener('click', (e) => {
        // Ouvrir Modal Outil (sur la carte ou le badge dans playbook)
        const toolCard = e.target.closest('.js-open-modal');
        if (toolCard) {
            const id = parseInt(toolCard.dataset.id);
            if(!isNaN(id)) openModal(id);
        }

        // Favoris
        const favBtn = e.target.closest('.js-fav-btn');
        if (favBtn) {
            e.stopPropagation();
            const id = parseInt(favBtn.dataset.id);
            toggleFavorite(id, favBtn);
        }

        // Fermer Modal
        if (e.target === modal || e.target.closest('.js-close-modal')) {
            closeModal();
        }
    });

    // 4. Clavier
    document.addEventListener('keydown', (e) => {
        if(e.key === "Escape" && !modal.classList.contains('hidden')) closeModal();
    });
}

// --- THEME ENGINE ---
window.toggleTheme = function() {
    const themes = ['default', 'red-team', 'corporate', 'synthwave'];
    const current = localStorage.getItem('hackingToolkitTheme') || 'default';
    const nextIndex = (themes.indexOf(current) + 1) % themes.length;
    setTheme(themes[nextIndex]);
}

function setTheme(themeName) {
    if (themeName === 'default') body.removeAttribute('data-theme');
    else body.setAttribute('data-theme', themeName);
    localStorage.setItem('hackingToolkitTheme', themeName);
}

// --- TABS LOGIC ---
function switchTab(tab) {
    console.log("Switching to tab:", tab);
    if (tab === 'tools') {
        toolsSection.classList.remove('hidden');
        playbooksSection.classList.add('hidden');
        tabTools.classList.add('active');
        tabPlaybooks.classList.remove('active');
        categoryContainer.classList.remove('hidden');
    } else {
        toolsSection.classList.add('hidden');
        playbooksSection.classList.remove('hidden');
        tabTools.classList.remove('active');
        tabPlaybooks.classList.add('active');
        categoryContainer.classList.add('hidden');
    }
}

// --- RENDER FUNCTIONS ---
function renderTools() {
    if(!container) return;
    container.innerHTML = '';
    
    const filtered = toolsData.filter(tool => {
        const matchesSearch = tool.name.toLowerCase().includes(currentSearch) || 
                              tool.shortDesc.toLowerCase().includes(currentSearch) ||
                              (tool.tags && tool.tags.some(t => t.toLowerCase().includes(currentSearch)));
        
        let matchesCategory = true;
        if (currentFilter === 'Favoris') matchesCategory = favorites.includes(tool.id);
        else if (currentFilter !== 'Tous') matchesCategory = tool.category === currentFilter;

        return matchesSearch && matchesCategory;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center text-gray-500 py-10">Aucun outil trouvé pour cette recherche.</div>`;
    } else {
        filtered.forEach(tool => {
            const isFav = favorites.includes(tool.id);
            container.innerHTML += `
                <div class="bg-cyber-dark border border-cyber-greenDim p-5 rounded-sm tool-card flex flex-col justify-between h-full relative js-open-modal cursor-pointer animate-fade-in" data-id="${tool.id}">
                    <div>
                        <div class="flex justify-between items-start mb-3">
                            <h3 class="text-xl font-bold text-cyber-green neon-text tracking-wide">${tool.name}</h3>
                            <span class="text-[10px] text-cyber-purple border border-cyber-purple px-2 py-0.5 rounded uppercase">${tool.category}</span>
                        </div>
                        <div class="mb-3 flex gap-1 flex-wrap">
                            ${tool.tags ? tool.tags.map(t => `<span class="text-[9px] bg-cyber-black border border-gray-700 text-gray-400 px-1 rounded">${t}</span>`).join('') : ''}
                        </div>
                        <p class="text-gray-400 text-sm mb-4 line-clamp-3 font-sans pointer-events-none">${tool.shortDesc}</p>
                    </div>
                    <div class="flex justify-between items-end border-t border-gray-800 pt-3 mt-2">
                        <button class="text-lg transition-colors focus:outline-none js-fav-btn ${isFav ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}" data-id="${tool.id}">
                            <i class="${isFav ? 'fas' : 'far'} fa-star"></i>
                        </button>
                        <span class="text-xs text-cyber-greenDim font-mono">./ACCESS >></span>
                    </div>
                </div>`;
        });
    }
    if(toolCount) toolCount.textContent = filtered.length;
}

function renderPlaybooks() {
    if(!playbooksContainer) return;
    playbooksContainer.innerHTML = '';
    
    if(playbooksData.length === 0) return;

    const filtered = playbooksData.filter(pb => 
        pb.title.toLowerCase().includes(currentSearch) || 
        pb.description.toLowerCase().includes(currentSearch)
    );

    if (filtered.length === 0) {
        playbooksContainer.innerHTML = `<div class="text-center text-gray-500 py-10">Aucun playbook trouvé.</div>`;
        return;
    }

    filtered.forEach(pb => {
        let stepsHtml = '';
        pb.steps.forEach(s => {
            // Lien avec les outils
            const linkedTool = toolsData.find(t => t.id === s.toolId);
            const toolBadge = linkedTool 
                ? `<span class="ml-2 text-xs border border-cyber-green text-cyber-green px-1 rounded cursor-pointer hover:bg-cyber-green hover:text-black js-open-modal transition-colors" data-id="${linkedTool.id}"><i class="fas fa-link mr-1"></i>${linkedTool.name}</span>` 
                : '';

            stepsHtml += `
                <div class="flex gap-4 items-start mb-4 last:mb-0">
                    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyber-black border border-cyber-greenDim flex items-center justify-center text-cyber-green font-bold text-sm">
                        ${s.step}
                    </div>
                    <div>
                        <p class="text-gray-300 text-sm mt-1 leading-relaxed">${s.desc} ${toolBadge}</p>
                    </div>
                </div>
            `;
        });

        playbooksContainer.innerHTML += `
            <div class="bg-cyber-dark border border-cyber-greenDim p-6 rounded-sm mb-6 animate-fade-in relative overflow-hidden group">
                <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-6xl text-cyber-green"><i class="fas fa-chess-knight"></i></div>
                <div class="flex justify-between items-center mb-4 relative z-10">
                    <h3 class="text-2xl font-bold text-cyber-purple neon-text">${pb.title}</h3>
                    <span class="px-2 py-1 bg-cyber-black border border-gray-600 text-xs text-gray-400 rounded">${pb.level}</span>
                </div>
                <p class="text-gray-400 mb-6 italic border-b border-gray-800 pb-4">${pb.description}</p>
                <div class="space-y-4 relative z-10">
                    ${stepsHtml}
                </div>
            </div>
        `;
    });
}

function renderCategories() {
    if(!categoryContainer) return;
    const categories = ['Tous', 'Favoris', ...new Set(toolsData.map(tool => tool.category))];
    categoryContainer.innerHTML = categories.map(cat => `
        <button onclick="setCategory('${cat}')"
            class="px-3 py-1 text-xs md:text-sm border border-cyber-greenDim hover:bg-cyber-green hover:text-black transition-all duration-300 rounded-sm uppercase tracking-wide 
            ${currentFilter === cat ? 'bg-cyber-green text-black font-bold' : 'text-cyber-green bg-cyber-dark'}">
            ${cat === 'Favoris' ? '<i class="fas fa-star mr-1"></i>' : ''}${cat}
        </button>
    `).join('');
}

// --- GLOBAL HELPERS (Window scope pour onclick HTML) ---
window.setCategory = function(cat) { currentFilter = cat; renderTools(); }
window.toggleFavorite = function(id, btn) {
    if(favorites.includes(id)) favorites = favorites.filter(fav => fav !== id);
    else favorites.push(id);
    localStorage.setItem('hackingToolkitFavs', JSON.stringify(favorites));
    renderTools();
}

// --- MODAL LOGIC ---
window.openModal = function(id) {
    const tool = toolsData.find(t => t.id === id);
    if(!tool) return;
    
    document.getElementById('modalTitle').textContent = tool.name;
    // Remplissage des champs de base
    const catElem = document.getElementById('modalCategory');
    if(catElem) catElem.textContent = tool.category;
    
    const descElem = document.getElementById('modalDesc');
    if(descElem) descElem.textContent = tool.fullDesc;

    const ethicalElem = document.getElementById('modalEthical');
    if(ethicalElem) ethicalElem.textContent = tool.ethicalUse;
    
    // Tags
    const tagsElem = document.getElementById('modalTags');
    if(tagsElem) tagsElem.innerHTML = tool.tags ? tool.tags.map(t => `<span class="px-2 py-1 bg-cyber-black text-cyber-green text-xs rounded border border-gray-700">${t}</span>`).join('') : '';
    
    // Link
    const linkElem = document.getElementById('modalLink');
    if(linkElem) linkElem.innerHTML = tool.link ? `<a href="${tool.link}" target="_blank" class="text-cyber-purple hover:text-white underline text-xs"><i class="fas fa-external-link-alt mr-1"></i>Site Officiel</a>` : '';

    // Command Builder
    const area = document.getElementById('modalInputsArea');
    const code = document.getElementById('modalCommandCode');
    
    if(area && code) {
        area.innerHTML = '';
        if (tool.inputs && tool.inputs.length > 0) {
            tool.inputs.forEach(input => {
                const div = document.createElement('div');
                div.innerHTML = `<label class="block text-xs text-gray-500 mb-1 font-mono">${input.label}</label>
                    <input type="text" data-key="${input.id}" value="${input.default}" class="builder-input w-full p-2 rounded text-sm transition-colors border border-gray-700 bg-cyber-black text-cyber-green focus:border-cyber-green outline-none">`;
                area.appendChild(div);
            });
            const inputs = area.querySelectorAll('input');
            inputs.forEach(i => i.addEventListener('input', () => updateCmd(tool, code, inputs)));
            updateCmd(tool, code, inputs);
        } else {
            area.innerHTML = '<p class="text-xs text-gray-500 italic col-span-full">Aucun paramètre configurable.</p>';
            code.textContent = tool.command;
        }
    }

    modal.classList.remove('hidden');
    body.style.overflow = 'hidden';
}

function updateCmd(tool, codeElem, inputs) {
    let cmd = tool.command;
    inputs.forEach(i => cmd = cmd.replace(new RegExp(`{{${i.dataset.key}}}`, 'g'), i.value));
    codeElem.textContent = cmd;
}

window.closeModal = function() { modal.classList.add('hidden'); body.style.overflow = 'auto'; }

window.copyToClipboard = function() {
    const code = document.getElementById('modalCommandCode');
    if(code) navigator.clipboard.writeText(code.textContent);
}

// Start
init();
