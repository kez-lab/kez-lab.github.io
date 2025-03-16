/**
 * Client-side search functionality for Jekyll blogs
 * Loads search data from search-data.json and provides searching/filtering capabilities
 */

class BlogSearch {
  constructor() {
    this.searchIndex = [];
    this.searchInput = document.getElementById('search-input');
    this.searchResults = document.getElementById('search-results');
    this.searchInfo = document.querySelector('.search-info');
    this.minQueryLength = 3;
    this.loadingTimeout = null;
    this.debounceTimeout = null;
    this.debounceDelay = 300; // ms
  }

  async init() {
    if (!this.searchInput || !this.searchResults) return;

    this.setupEventListeners();
    await this.loadSearchData();
    
    // Check if URL contains search parameter
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('q');
    
    if (queryParam) {
      this.searchInput.value = queryParam;
      this.performSearch(queryParam);
    }
  }

  setupEventListeners() {
    // Handle keyboard input with debounce
    this.searchInput.addEventListener('input', () => {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => {
        const query = this.searchInput.value.trim();
        
        // Show loading state if query is long enough
        if (query.length >= this.minQueryLength) {
          this.showLoadingState();
        }
        
        this.performSearch(query);
      }, this.debounceDelay);
    });

    // Handle form submission
    if (this.searchInput.form) {
      this.searchInput.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = this.searchInput.value.trim();
        if (query.length >= this.minQueryLength) {
          this.performSearch(query);
          // Update URL with search query
          const newUrl = new URL(window.location);
          newUrl.searchParams.set('q', query);
          window.history.pushState({}, '', newUrl);
        }
      });
    }
  }

  showLoadingState() {
    if (this.searchInfo) {
      this.searchInfo.textContent = 'Searching...';
    }
    this.searchResults.innerHTML = `
      <div class="search-loading">
        <div class="loading-spinner"></div>
      </div>
    `;
  }

  async loadSearchData() {
    try {
      const response = await fetch('/assets/js/search-data.json');
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      this.searchIndex = await response.json();
    } catch (error) {
      console.error('Error loading search data:', error);
      this.searchResults.innerHTML = '<p class="search-error">Error loading search data. Please try again later.</p>';
    }
  }

  performSearch(query) {
    // Clear existing results
    this.searchResults.innerHTML = '';
    
    // Update info text
    if (this.searchInfo) {
      if (query.length < this.minQueryLength) {
        this.searchInfo.textContent = `Type at least ${this.minQueryLength} characters to search`;
        return;
      } else {
        this.searchInfo.textContent = 'Showing search results for "' + query + '"';
      }
    }

    if (query.length < this.minQueryLength) {
      return;
    }

    // Filter posts that match the query
    const results = this.filterResults(query);
    this.displayResults(query, results);
  }

  filterResults(query) {
    const queryLower = query.toLowerCase();
    
    return this.searchIndex.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(queryLower);
      const contentMatch = item.content.toLowerCase().includes(queryLower);
      const categoriesMatch = item.categories.some(
        category => category.toLowerCase().includes(queryLower)
      );
      const tagsMatch = item.tags.some(
        tag => tag.toLowerCase().includes(queryLower)
      );
      
      return titleMatch || contentMatch || categoriesMatch || tagsMatch;
    });
  }

  displayResults(query, results) {
    if (results.length === 0) {
      this.searchResults.innerHTML = `
        <div class="no-results">
          No results found for "${query}"
        </div>
      `;
      return;
    }

    results.forEach(result => {
      let resultElement = document.createElement('div');
      resultElement.className = 'search-result';
      
      // Highlight matched text in title
      let titleHtml = this.highlightText(result.title, query);
      
      // Create result excerpt
      let excerpt = '';
      if (result.content.toLowerCase().includes(query.toLowerCase())) {
        const position = result.content.toLowerCase().indexOf(query.toLowerCase());
        const start = Math.max(0, position - 50);
        const end = Math.min(result.content.length, position + query.length + 50);
        excerpt = '...' + result.content.substring(start, end) + '...';
        excerpt = this.highlightText(excerpt, query);
      } else {
        excerpt = result.excerpt;
      }
      
      resultElement.innerHTML = `
        <h3 class="result-title">
          <a href="${result.url}">${titleHtml}</a>
        </h3>
        <div class="result-meta">
          <span class="result-date">${result.date}</span>
          ${result.categories.length > 0 ? 
            `<span class="result-categories">
              ${result.categories.map(cat => `<span class="result-category">${cat}</span>`).join('')}
            </span>` : ''}
        </div>
        <p class="result-excerpt">${excerpt}</p>
      `;
      
      this.searchResults.appendChild(resultElement);
    });
  }

  highlightText(text, query) {
    if (!text || !query) return text;
    
    const regex = new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const search = new BlogSearch();
  search.init();
});
