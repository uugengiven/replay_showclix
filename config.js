const config = {}

config.host = process.env.DB_HOST;
config.authKey = process.env.AUTHKEY;
config.databaseId = process.env.DB_ID;
config.collectionId = process.env.COLLECTION_ID;
config.showclixId = process.env.USER_ID;
config.showclixPW = process.env.USER_PW;

module.exports = config;