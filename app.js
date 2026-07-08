document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const franchiseSelect = document.getElementById('franchise-select');
    const storeSearch = document.getElementById('store-search');
    const clearSearchBtn = document.getElementById('clear-search');
    const resultsList = document.getElementById('results-list');
    const resultsCount = document.getElementById('results-count');
    const toastContainer = document.getElementById('toast-container');
    const updateStoresBtn = document.getElementById('update-stores-btn');
    const excelFileInput = document.getElementById('excel-file');

    let currentStores = [];
    let localFranquiasData = [];

    // Load data from localStorage or fallback to data.js
    const savedData = localStorage.getItem('savedFranquiasData');
    if (savedData) {
        try {
            localFranquiasData = JSON.parse(savedData);
        } catch (e) {
            console.error("Error parsing localStorage data", e);
            localFranquiasData = typeof franquiasData !== 'undefined' ? franquiasData : [];
        }
    } else {
        localFranquiasData = typeof franquiasData !== 'undefined' ? franquiasData : [];
    }
    
    function initFranchiseSelect() {
        franchiseSelect.innerHTML = '<option value="">Selecione uma franquia...</option>';
        // Sort franchises alphabetically
        localFranquiasData.sort((a, b) => a.franchise.localeCompare(b.franchise));

        // Initialize Franchise Select
        localFranquiasData.forEach((data, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = data.franchise;
            franchiseSelect.appendChild(option);
        });
    }

    initFranchiseSelect();

    // Event Listeners
    franchiseSelect.addEventListener('change', (e) => {
        const selectedIndex = e.target.value;
        
        if (selectedIndex === "") {
            storeSearch.disabled = true;
            storeSearch.value = "";
            clearSearchBtn.hidden = true;
            currentStores = [];
            renderEmptyState("Selecione uma franquia para ver as lojas.");
            updateCount(0);
        } else {
            storeSearch.disabled = false;
            currentStores = localFranquiasData[selectedIndex].stores;
            // Sort stores alphabetically by name
            currentStores.sort((a, b) => a.name.localeCompare(b.name));
            renderStores(currentStores);
            storeSearch.value = "";
            clearSearchBtn.hidden = true;
        }
    });

    storeSearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        clearSearchBtn.hidden = query.length === 0;
        
        if (query === "") {
            renderStores(currentStores);
            return;
        }

        const filtered = currentStores.filter(store => 
            store.name.toLowerCase().includes(query) || 
            store.city.toLowerCase().includes(query)
        );
        
        renderStores(filtered);
    });

    clearSearchBtn.addEventListener('click', () => {
        storeSearch.value = "";
        clearSearchBtn.hidden = true;
        storeSearch.focus();
        renderStores(currentStores);
    });

    // Render Functions
    function renderEmptyState(message) {
        resultsList.innerHTML = `
            <div class="empty-state">
                <i class="ri-store-3-line"></i>
                <p>${message}</p>
            </div>
        `;
    }

    function renderStores(stores) {
        updateCount(stores.length);
        
        if (stores.length === 0) {
            renderEmptyState("Nenhuma loja encontrada para sua busca.");
            return;
        }

        resultsList.innerHTML = '';
        
        // Use document fragment for better performance
        const fragment = document.createDocumentFragment();

        stores.forEach((store, index) => {
            const card = document.createElement('div');
            card.className = 'store-card';
            // Add staggered animation delay
            card.style.animationDelay = `${Math.min(index * 0.05, 0.5)}s`;
            
            const cityHtml = store.city ? `<span class="store-city"><i class="ri-map-pin-line"></i> ${store.city}</span>` : '';
            
            card.innerHTML = `
                <div class="store-info">
                    <span class="store-name">${store.name}</span>
                    ${cityHtml}
                </div>
                <button class="copy-btn" data-id="${store.id}">
                    <i class="ri-file-copy-line"></i> Copiar ID
                </button>
            `;
            
            const copyBtn = card.querySelector('.copy-btn');
            copyBtn.addEventListener('click', () => handleCopy(store.id, copyBtn));
            
            fragment.appendChild(card);
        });

        resultsList.appendChild(fragment);
    }

    function updateCount(count) {
        if (count === 0) {
            resultsCount.textContent = "0 lojas";
        } else if (count === 1) {
            resultsCount.textContent = "1 loja encontrada";
        } else {
            resultsCount.textContent = `${count} lojas encontradas`;
        }
    }

    // Copy ID functionality
    function handleCopy(id, btnElement) {
        // Fallback for older devices/browsers
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(id).then(() => {
                showSuccess(btnElement);
            }).catch(err => {
                console.error("Falha ao copiar: ", err);
                fallbackCopyTextToClipboard(id, btnElement);
            });
        } else {
            fallbackCopyTextToClipboard(id, btnElement);
        }
    }

    function fallbackCopyTextToClipboard(text, btnElement) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        
        // Avoid scrolling to bottom
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showSuccess(btnElement);
            } else {
                showToast("Erro ao copiar ID", false);
            }
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
            showToast("Erro ao copiar ID", false);
        }

        document.body.removeChild(textArea);
    }

    function showSuccess(btnElement) {
        // Visual feedback on button
        const originalHtml = btnElement.innerHTML;
        btnElement.classList.add('success');
        btnElement.innerHTML = `<i class="ri-check-line"></i> Copiado!`;
        
        showToast("ID copiado com sucesso!");

        setTimeout(() => {
            btnElement.classList.remove('success');
            btnElement.innerHTML = originalHtml;
        }, 2000);
    }

    function showToast(message, isSuccess = true) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        
        const icon = isSuccess ? 'ri-checkbox-circle-fill' : 'ri-error-warning-fill';
        toast.innerHTML = `<i class="${icon}"></i> ${message}`;
        
        toastContainer.appendChild(toast);
        
        // Remove toast after animation
        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => {
                if(toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300); // match CSS animation duration
        }, 2500);
    }

    // Excel Import Logic
    if (updateStoresBtn && excelFileInput) {
        updateStoresBtn.addEventListener('click', () => {
            excelFileInput.click();
        });

        excelFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = event.target.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    
                    const newDb = [];
                    
                    workbook.SheetNames.forEach(sheetName => {
                        const worksheet = workbook.Sheets[sheetName];
                        // Read as array of arrays (header: 1)
                        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        
                        const stores = [];
                        rows.forEach((row, rowIndex) => {
                            // Ignora a primeira linha se parecer cabeçalho (ex: id, loja na linha 0)
                            if (rowIndex === 0 && (!row[0] || String(row[0]).length !== 24)) {
                                return;
                            }
                            
                            if (row.length >= 2) {
                                const id = String(row[0] || '').trim();
                                const name = String(row[1] || '').trim();
                                
                                // Verifica se tem ID válido (24 caracteres hexadecimais no formato MongoDB)
                                // Ou qualquer formato que seja adotado. Para ser mais flexível, vamos aceitar se tiver ID e Nome
                                // Mas vamos manter o regex original se possível:
                                if (id && name) {
                                    // Assumindo que a coluna A é ID e B é Nome, Cidade pode ficar vazio
                                    stores.push({ id, name, city: '' });
                                }
                            }
                        });

                        if (stores.length > 0) {
                            newDb.push({
                                franchise: sheetName,
                                stores: stores
                            });
                        }
                    });

                    if (newDb.length > 0) {
                        localFranquiasData = newDb;
                        localStorage.setItem('savedFranquiasData', JSON.stringify(newDb));
                        initFranchiseSelect();
                        showToast(`Planilha importada com sucesso! ${newDb.length} franquias carregadas.`);
                        
                        // Reset filters
                        franchiseSelect.value = "";
                        franchiseSelect.dispatchEvent(new Event('change'));
                    } else {
                        showToast('Nenhum dado válido encontrado na planilha.', false);
                    }
                    
                } catch (err) {
                    console.error(err);
                    showToast('Erro ao processar o arquivo Excel.', false);
                }
                
                // Clear the input so the same file can be selected again
                excelFileInput.value = '';
            };
            
            reader.readAsBinaryString(file);
        });
    }
});
