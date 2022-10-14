SC = {
  async init() {
    await this._loadJQuery().then((loadedJQuery) => this.$ = loadedJQuery);
  },
  async search(term) {
    let $searchResults = await this._search_for(term);
    return $searchResults.map((idx, result) => {
      const $result = this.$(result);

      return {
        title: $result.find('.soundTitle__title').text().trim(),
        user: $result.find('.soundTitle__usernameText').text().trim(),
        plays: parseInt($result.find('.sound__soundStats .sc-ministats-item').attr('title').trim().replaceAll(/\D/g, '')),
      };
    });
  },
  _get_search_id() {
    searchID = this.$('.searchItem .sc-link-primary');
    if(searchID.length === 0) {
      searchID = ''; 
    } else {
      searchID = searchID.text().trim().replaceAll(/\W/g, '');
    }
    return searchID;
  },
  _search_for(term) {
    return new Promise((resolve) => {
      if(window.location.href.includes('?q=' + encodeURIComponent(term))) {
        resolve(this.$('.searchItem__trackItem'));
      }

      // perform search
      this.$('input.headerSearch__input').val(`${term}`);
      this.$('button.headerSearch__submit').click();

      setInterval(() => {
        newSearchID = this._get_search_id();
        if(newSearchID !== '' && newSearchID !== this.currentSearchID) {
          this.currentSearchID = newSearchID;
          resolve(this.$('.searchItem__trackItem'));
        }
      }, 250);
    });
  },
  _loadJQuery() {
    return new Promise((resolve) => {
      var jq = document.createElement('script');
      jq.src = "https://code.jquery.com/jquery-3.6.1.min.js";
      document.getElementsByTagName('head')[0].appendChild(jq);
      setInterval(() => {
        jqueryLoaded = true;
        try { 
          jQuery.noConflict();
        } catch {
          jqueryLoaded = false;
        }
        if(jqueryLoaded) { resolve(jQuery) };
      }, 50);
    });
  },
};
