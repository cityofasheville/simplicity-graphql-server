const groupMembership = {
  CMO: ['eric@deepweave.com', 'gjackson@ashevillenc.gov', 'ejackson@ashevillenc.gov'],
  IT: ['eric@deepweave.com', 'ejackson@ashevillenc.gov', 'ccarlyle@ashevillenc.gov']
};

let groupsByEmail = null;

class Groups {

  getGroupsByEmail (email) {
    if (groupsByEmail == null) {
      groupsByEmail = {};
      for (let gg in groupMembership) {
        const users = groupMembership[gg];
        users.forEach( (email) => {
          if (!(email in groupsByEmail)) {
            groupsByEmail[email] = [];
          }
          groupsByEmail[email].push(gg);
        });
      }
    }
    let groups = [];
    if (email in groupsByEmail) groups = groupsByEmail[email];
    return groups;
  }

}

export default new Groups();
