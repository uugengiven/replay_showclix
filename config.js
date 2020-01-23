const config = {}

config.host = process.env.DB_HOST;
config.authKey = process.env.AUTHKEY;
config.databaseId = process.env.DB_ID;
config.collectionId = process.env.COLLECTION_ID;

module.exports = config;