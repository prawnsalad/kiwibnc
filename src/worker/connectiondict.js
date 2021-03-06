const ConnectionOutgoing = require('./connectionoutgoing');
const ConnectionIncoming = require('./connectionincoming');

const TYPE_OUTGOING = 0;
const TYPE_INCOMING = 1;
const TYPE_LISTENING = 2;

class ConnectionDictionary {
    constructor(db, userDb, messages, queue) {
        this.map = new Map();
        this.db = db;
        this.userDb = userDb;
        this.messages = messages;
        this.queue = queue;
    }

    get size() {
        return this.map.size;
    }

    get(id) {
        return this.map.get(id);
    }

    set(id, con) {
        return this.map.set(id, con);
    }

    delete(id) {
        return this.map.delete(id);
    }

    async loadFromId(conid, type) {
        let con = null;

        if (type === TYPE_OUTGOING) {
            con = new ConnectionOutgoing(conid, this.db, this.messages, this.queue, this);
            await con.state.maybeLoad();
        } else if (type === TYPE_INCOMING) {
            con = new ConnectionIncoming(conid, this.db, this.userDb, this.messages, this.queue, this);
            await con.state.maybeLoad();
        }

        return con;
    }

    // Find an outgoing connection instance that matches the user + network info
    findUsersOutgoingConnection(userId, networkId) {
        let foundCons = [];
        this.map.forEach((con) => {
            if (
                con.state.type === TYPE_OUTGOING &&
                con.state.authUserId === userId
            ) {
                foundCons.push(con);
            }
        });

        // If a specific network was requested then just return that single one
        if (networkId) {
            return foundCons.find((con) => con.state.authNetworkId === networkId) || null;
        } else {
            return foundCons;
        }
    }

    // Find all outgoing connection instances for a user
    findAllUsersClients(userId) {
        let clients = [];
        this.map.forEach((con) => {
            if (con.state.type === TYPE_INCOMING && con.state.authUserId === userId) {
                clients.push(con);
            }
        });

        return clients;
    }
}

ConnectionDictionary.TYPE_OUTGOING = TYPE_OUTGOING;
ConnectionDictionary.TYPE_INCOMING = TYPE_INCOMING;
ConnectionDictionary.TYPE_LISTENING = TYPE_LISTENING;

module.exports = ConnectionDictionary;
