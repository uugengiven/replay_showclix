const CosmosClient = require("@azure/cosmos").CosmosClient;
const config = require("./config");

const cosmosdb = {
    client: null,
    database: null,
    container: null,

    init: async () => {
        this.client = new CosmosClient({
            endpoint: config.host,
            key: config.authKey
        });
        const dbResponse = await this.client.databases.createIfNotExists({
            id: config.databaseId
        });
        this.database = dbResponse.database;
        const coResponse = await this.database.containers.createIfNotExists({
            id: config.collectionId
        });
        this.container = coResponse.container;
        return this;
    },

    addItem: async (item) => {
        const { body: doc } = await this.container.items.create(item);
        // const body = await container.items.create(item);
        // const doc = body.doc;
        return doc;
    },

    queryItems: async (query) => {
        if(!this.container) {
            throw new Error("No collection initialized!");
        }
        const {resources: results} = await this.container.items
            .query(query)
            .fetchAll();
        return results;
    },

    getItemById: async (id) => {
        const { body } = await this.container.item(id).read();
        return body;
    },

    updateItem: async(item) => {
        const oldItem = await this.getItemById(item.id);
        const newItem = {...oldItem, ...item};

        const { body: replaced } = await this.container.item(newItem.id).replace(newItem);
        return replaced;
    },

    deleteDatabase: async() => {
        // it will really be gone if you run this. For real.
        await this.database.delete();
    }
}


module.exports = cosmosdb;