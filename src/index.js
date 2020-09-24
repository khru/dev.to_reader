new Vue({
  el: "#app",
  data: {
    selectedTag: "",
    searchTerm: "",
    results: 20,
    apiURL: "api/articles",
    domain: "https://dev.to/",
    articles: [],
    busy: false,
    scrollIndex: 0
  },
  computed: {
    tags() {
      let tags = this.articles
        .map((article) => article.tag_list)
        .flat()
        .filter((tag, index, allTags) => allTags.indexOf(tag) === index)
        .sort();
      tags.unshift("");
      return tags;
    },
    filterArticlesByTag() {
      if (!this.selectedTag) {
        return this.articles;
      }
      return this.articles.filter((article) =>
        article.tag_list.includes(this.selectedTag)
      );
    },
    filterArticlesBySearch() {
      if (!this.searchTerm) {
        return this.filterArticlesByTag;
      }

      return this.filterArticlesByTag.filter(
        (article) =>
          article.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          article.description
            .toLowerCase()
            .includes(this.searchTerm.toLowerCase()) ||
          article.user.name
            .toLowerCase()
            .includes(this.searchTerm.toLowerCase())
      );
    }
  },
  methods: {
    loadMore: async function () {
      this.scrollIndex++;
      this.articles.push(...(await this.loadData()));
    },
    loadData: async function () {
      const DATE_UNITS = {
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1
      };

      const getSecondsDiff = (timestamp) => (Date.now() - timestamp) / 1000;
      const getUnitAndValueDate = (secondsElapsed) => {
        for (const [unit, secondsInUnit] of Object.entries(DATE_UNITS)) {
          if (secondsElapsed >= secondsInUnit || unit === "second") {
            const value = Math.floor(secondsElapsed / secondsInUnit) * -1;
            return { value, unit };
          }
        }
      };

      const getTimeAgo = (timestamp) => {
        const rtf = new Intl.RelativeTimeFormat("en", {
          localeMatcher: "best fit",
          numeric: "always",
          style: "long"
        });

        const secondsElapsed = getSecondsDiff(timestamp);
        const { value, unit } = getUnitAndValueDate(secondsElapsed);
        return rtf.format(value, unit);
      };

      try {
        return await new Promise((resolve, reject) =>
          fetch(
            `${this.domain}${this.apiURL}?per_page=${this.results}&page=${this.scrollIndex}`
          )
            .then((resp) => resp.json())
            .then((json) => {
              const articlesFromAPI = json.flat();
              for (const article of articlesFromAPI) {
                article.human_time = getTimeAgo(
                  Date.parse(article.published_at)
                );
              }
              this.busy = false;
              resolve(articlesFromAPI);
            })
            .catch((reason) => {
              console.error(reason);
            })
        );
      } catch (error) {
        console.error(error);
      }
    }
  },
  async mounted() {
    this.articles = await this.loadData();
  }
});
Vue.config.devtools = true;
