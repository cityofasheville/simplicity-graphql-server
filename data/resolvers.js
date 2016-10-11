import { find, filter } from 'lodash';
import { pubsub } from './subscriptions';

const authors = [
  { id: 1, firstName: 'Tom', lastName: 'Coleman' },
  { id: 2, firstName: 'Sashko', lastName: 'Stubailo' },
];

const posts = [
  { id: 1, authorId: 1, title: 'Introduction to GraphQL', votes: 2 },
  { id: 2, authorId: 2, title: 'GraphQL Rocks', votes: 3 },
  { id: 3, authorId: 2, title: 'Advanced GraphQL', votes: 1 },
];

const addresses = [
  {
    civic_address_id: 230126,
    full_address: '60 N. Market St. #503, Asheville, NC 28801',
    pin: '9649415481C0503',
    owner: 'JACKSON PHILIP ERIC;LAMOTTE KATHY',
    in_city: true
  },
  {
    civic_address_id: 238441,
    full_address: '28 Walnut Dr, Asheville, NC 28748',
    pin: '87801023450000',
    owner: 'WALDROP NADINE R',
    in_city: false
  },
];

const resolveFunctions = {
  Query: {
    posts() {
      return posts;
    },
    search (obj, args, context) {
      let searchString = args.searchString;
      console.log("The search string is: " + searchString);
      let results = [];
      const s = searchString.toLowerCase();
      addresses.forEach( item => {
        const full = item.full_address.toLowerCase();
        console.log("Check against full address: " + full);
        if (full.indexOf(s) >= 0) {
          results.push({
            id: item.civic_address_id,
            text: item.full_address,
            score: 100
          });
        }
      });
      return [{
        type: 'address',
        results
      }];
    },

    address (obj, args, context) {
      const id = args.id;
      const pool = context.pool;
      //console.log("AddressContext: " + JSON.stringify(context));

      let result = null;
      return pool.query(`SELECT civicaddress_id, property_pin, jurisdiction_type, address_full, owner_name from coa_bc_address_master where civicaddress_id = ${id}  limit 1`)
        .then( (result) => {
          if (result.rows.length == 0) return null;
          const address = result.rows[0];
          return {
            civic_address_id: address.civicaddress_id,
            full_address: address.address_full,
            pin: address.property_pin,
            owner: address.owner_name,
            is_in_city: (address.jurisdiction_type == 'Asheville Corporate Limits')
          };
        })
        .catch((err) => {
          if (err) {
            console.log("Got an error: " + JSON.stringify(err));
          }
        });
    }
  },

  TypedSearchResult: {
    type(obj) {return obj.type},
    results (obj, args, context) {
      return obj.results;
    }
  },

  SearchResult: {
    id(obj) { return obj.id; },
    text(obj) { return obj.text;},
    score(obj) { return obj.score; }
  },

  Mutation: {
    upvotePost(_, { postId }) {
      const post = find(posts, { id: postId });
      if (!post) {
        throw new Error(`Couldn't find post with id ${postId}`);
      }
      post.votes += 1;
      pubsub.publish('postUpvoted', post);
      return post;
    },
  },
  Subscription: {
    postUpvoted(post) {
      return post;
    },
  },
  Author: {
    posts(author) {
      return filter(posts, { authorId: author.id });
    },
  },
  Post: {
    author(post) {
      return find(authors, { id: post.authorId });
    },
  },
};

export default resolveFunctions;
