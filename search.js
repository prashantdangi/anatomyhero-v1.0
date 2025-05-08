document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    let searchTimeout;
    let currentFocus = -1;

    // Sample anatomy data - replace with your actual data
    const anatomyData = [
        { name: 'Heart', category: 'Cardiovascular System', icon: 'fa-heart' },
        { name: 'Brain', category: 'Nervous System', icon: 'fa-brain' },
        { name: 'Lungs', category: 'Respiratory System', icon: 'fa-lungs' },
        { name: 'Liver', category: 'Digestive System', icon: 'fa-liver' },
        { name: 'Kidney', category: 'Urinary System', icon: 'fa-kidney' },
        // Add more anatomy parts here
    ];

    function showLoading() {
        searchResults.innerHTML = `
            <div class="search-loading">
                <i class="fas fa-spinner"></i>
                <span>Searching...</span>
            </div>
        `;
        searchResults.classList.add('active');
    }

    function showResults(results, query) {
        searchResults.innerHTML = '';
        
        if (results.length > 0) {
            results.forEach((result, index) => {
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'suggestion-item';
                suggestionItem.tabIndex = 0;
                suggestionItem.innerHTML = `
                    <i class="fas ${result.icon}"></i>
                    <span class="suggestion-text">${highlightMatch(result.name, query)}</span>
                    <span class="suggestion-category">${result.category}</span>
                `;
                
                suggestionItem.addEventListener('click', () => {
                    selectItem(result);
                });

                suggestionItem.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        selectItem(result);
                    }
                });

                searchResults.appendChild(suggestionItem);
            });
        } else {
            searchResults.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <span>No results found for "${query}"</span>
                </div>
            `;
        }
    }

    function highlightMatch(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    function selectItem(result) {
        searchInput.value = result.name;
        searchResults.classList.remove('active');
        currentFocus = -1;
        // Add your selection handling logic here
    }

    searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        const query = e.target.value.toLowerCase().trim();
        currentFocus = -1;

        if (query.length === 0) {
            searchResults.classList.remove('active');
            return;
        }

        showLoading();

        // Add a small delay to prevent too many updates while typing
        searchTimeout = setTimeout(() => {
            const filteredResults = anatomyData.filter(item => 
                item.name.toLowerCase().includes(query) || 
                item.category.toLowerCase().includes(query)
            );

            showResults(filteredResults, query);
        }, 300);
    });

    // Close search results when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
            currentFocus = -1;
        }
    });

    // Handle keyboard navigation
    searchInput.addEventListener('keydown', function(e) {
        const items = searchResults.getElementsByClassName('suggestion-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentFocus = Math.min(currentFocus + 1, items.length - 1);
            items[currentFocus]?.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentFocus = Math.max(currentFocus - 1, 0);
            items[currentFocus]?.focus();
        } else if (e.key === 'Enter' && currentFocus >= 0) {
            e.preventDefault();
            items[currentFocus]?.click();
        } else if (e.key === 'Escape') {
            searchResults.classList.remove('active');
            currentFocus = -1;
        }
    });
}); 