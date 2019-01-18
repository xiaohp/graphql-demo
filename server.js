const express = require('express');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');

// 使用 GraphQL schema language 构建一个 schema
const schema = buildSchema(`
    input MessageInput {
      content: String
      author: String
    }

    type Message {
      id: ID!
      content: String
      author: String
    }

    type Mutation {
      createMessage(input: MessageInput): Message
      updateMessage(id: ID!, input: MessageInput): Message
    }

    type RandomDie {
        numSides: Int!
        rollOnce: Int!
        roll(numRolls: Int!): [Int]
    }

    type Query {
        quoteOfTheDay: String
        random: Float!
        rollThreeDice: [Int]
        rollDice(numDice: Int!, numSides: Int): [Int]
        getDie(numSides: Int): RandomDie
        getMessage(id: ID!): Message
    }
`);

// 该类继承 RandomDie GraphQL 类型
class RandomDie {
  constructor(numSides) {
    this.numSides = numSides;
  }

  rollOnce() {
    return 1 + Math.floor(Math.random() * this.numSides);
  }

  roll({numRolls}) {
    let output = [];
    for (let i = 0; i < numRolls; i++) {
      output.push(this.rollOnce());
    }
    return output;
  }
}

// 如果 Message 拥有复杂字段，我们把它们放在这个对象里面。
class Message {
  constructor(id, {content, author}) {
    this.id = id;
    this.content = content;
    this.author = author;
  }
}

// 映射 username 到 content
const fakeDatabase = {};

// root 将会提供每个 API 入口端点的解析函数
const root = {
    getDie: function({numSides}) {
        return new RandomDie(numSides || 6);
    },
    quoteOfTheDay: () => {
        return Math.random() < 0.5 ? 'Take it easy' : 'Salvation lies within';
    },
    random: () => {
        return Math.random();
    },
    rollThreeDice: () => {
        return [1, 2, 3].map(_ => 1 + Math.floor(Math.random() * 6));
    },
    rollDice: function({numDice, numSides}) {
        let output = [];
        for (let i = 0; i < numDice; i++) {
            output.push(1 + Math.floor(Math.random() * (numSides || 6)));
        }
        return output;
    },
    getMessage: function ({id}) {
      if (!fakeDatabase[id]) {
        throw new Error('no message exists with id ' + id);
      }
      return new Message(id, fakeDatabase[id]);
    },
    createMessage: function ({input}) {
      // Create a random id for our "database".
      const id = require('crypto').randomBytes(10).toString('hex');

      fakeDatabase[id] = input;
      return new Message(id, input);
    },
    updateMessage: function ({id, input}) {
      if (!fakeDatabase[id]) {
        throw new Error('no message exists with id ' + id);
      }
      // This replaces all old data, but some apps might want partial update.
      fakeDatabase[id] = input;
      return new Message(id, input);
    },
};

const app = express();
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

app.listen(4000);
console.log('Running a GraphQL API server at http://localhost:4000/graphql');
