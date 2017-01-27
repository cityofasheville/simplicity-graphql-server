const groupMembership = {
  CMO: ['eric@deepweave.com', 'gjackson@ashevillenc.gov', 'ejackson@ashevillenc.gov'],
  IT: ['eric@deepweave.com', 'ejackson@ashevillenc.gov', 'ccarlyle@ashevillenc.gov']
};

let groupsByEmail = null;

class Groups {

  getGroupsByEmail(email) {
    if (groupsByEmail === null) {
      groupsByEmail = {};
      for (let gg in groupMembership) {
        const users = groupMembership[gg];
        users.forEach((email1) => {
          if (!(email1 in groupsByEmail)) {
            groupsByEmail[email1] = [];
          }
          groupsByEmail[email1].push(gg);
        });
      }
    }
    let groups = [];
    if (email in groupsByEmail) groups = groupsByEmail[email];
    return groups;
  }

}

module.exports = new Groups();
