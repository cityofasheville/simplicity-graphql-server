const subscribedPages = {
  CMO: ['development/citywide/development-dashboard'],
  IT: [],
};

class MySimpliCity {
  constructor() {
    subscribedPages['eric@deepweave'] = ['crime/citywide/crime-dashboard'];
  }

  getSubscriptions(email, groups) {
    const subscriptions = {
      groups: {},
      favorites: [],
    };
    groups.forEach((group) => {
      if (group in subscribedPages) {
        subscriptions.groups[group] = [];
        subscribedPages[group].forEach((page) => {
          subscriptions.groups[group].push(page);
        });
      }
      if (email in subscribedPages) {
        subscribedPages[email].forEach((page) => {
          subscriptions.favorites.push(page);
        });
      }
    });

    return subscriptions;
  }

}

module.exports = new MySimpliCity();
