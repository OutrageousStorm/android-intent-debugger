/**
 * Intent Filter Matching Logic
 * Implements Android's intent resolution algorithm
 * https://developer.android.com/guide/components/intents-filters
 */

class IntentMatcher {
  constructor() {
    this.filters = [];
  }

  addFilter(filter) {
    this.filters.push({
      action: filter.action || [],
      category: filter.category || [],
      data: filter.data || [],
      priority: filter.priority || 0,
    });
  }

  /**
   * Match an intent against all registered filters
   * Returns: list of matching filters, sorted by priority
   */
  match(intent) {
    const matches = [];
    
    for (const filter of this.filters) {
      if (this.matchAction(intent.action, filter.action) &&
          this.matchCategory(intent.category, filter.category) &&
          this.matchData(intent.data, filter.data)) {
        matches.push(filter);
      }
    }
    
    return matches.sort((a, b) => b.priority - a.priority);
  }

  matchAction(intentAction, filterActions) {
    if (!intentAction || filterActions.length === 0) return true;
    return filterActions.includes(intentAction);
  }

  matchCategory(intentCategories = [], filterCategories) {
    if (filterCategories.length === 0) return true;
    if (intentCategories.length === 0 && filterCategories.length > 0) return false;
    
    for (const cat of filterCategories) {
      if (!intentCategories.includes(cat)) {
        return false;
      }
    }
    return true;
  }

  matchData(intentData, filterData) {
    if (!intentData || filterData.length === 0) return true;
    
    for (const data of filterData) {
      if (this.dataMatches(intentData, data)) {
        return true;
      }
    }
    return filterData.length === 0;
  }

  dataMatches(intentData, filterData) {
    // Match scheme (http, https, content, file, etc)
    if (filterData.scheme && filterData.scheme !== intentData.scheme) {
      return false;
    }
    
    // Match host (wildcard support)
    if (filterData.host) {
      if (filterData.host === '*') {
        return true; // matches any host
      }
      if (filterData.host !== intentData.host) {
        return false;
      }
    }
    
    // Match path (simple comparison, real Android uses PathPattern)
    if (filterData.path && filterData.path !== intentData.path) {
      return false;
    }
    
    return true;
  }
}

module.exports = IntentMatcher;
