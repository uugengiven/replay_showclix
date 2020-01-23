require('dotenv').config();
const http = require('http');
const cosmosdb = require('./cosmos.js');
const port = process.env.PORT || 3000;
const data = require('./json_data/data.json');
const event = require('./json_data/event.json');

const requestHandler = async (request, response) => {
    console.log(request.url)
    let results = {};
    switch(request.url)
    {
        case "/":
            results = alterData(event, data);
            //cosmosdb.addItem(results);
            break;
        case "/tickets":
            results = await getAllTickets("15192616");
            //console.log(results);
            break;
        case "/levels":
            results = await getPriceLevels();
            break;
        default:
            results = {test: "you hit another url, weirdo"};
            break;
    }
    response.setHeader('Content-Type', 'application/json');
    response.write(JSON.stringify(results));
    response.end()
}

const getPriceLevels = async () => {
  const query = {
    query: "SELECT p.level, p.description, p.level_id FROM r JOIN p in r.price_levels",
    //query: "SELECT r.price_levels.tickets FROM root AS r WHERE r.price_levels.level=@name",
  };
  const results = await cosmosdb.queryItems(query);
  return results;
}

const getAllTickets = async (id) => {
  const query = {
    query: "SELECT p.level, p.tickets FROM root AS r JOIN p IN r.price_levels WHERE p.level_id=@id",
    //query: "SELECT r.price_levels.tickets FROM root AS r WHERE r.price_levels.level=@name",
    parameters: [
        {
            name: "@id",
            value: id
        }
    ]
  };
  const results = await cosmosdb.queryItems(query);
  return results;
}

const alterData = (eventinfo, ticketinfo) => {
  let event = {};
  event.id = eventinfo.event_id;
  event.event_id = eventinfo.event_id;
  event.event = eventinfo.event;
  event.description = eventinfo.description;
  event.price_levels = [];
  let id_map = {};

  Object.entries(eventinfo.price_levels).map((level, index) => {
    let curr_level = {};
    curr_level = {...level[1], tickets: []};
    event.price_levels.push(curr_level);
    id_map[curr_level.level_id] = index;
  })

  Object.entries(ticketinfo).map(sale => {
    Object.entries(sale[1].ticket_set).map(ticket => {
      let full_ticket = {cancelled: false};
      full_ticket.ticket_id = ticket[1].ticket_id;
      full_ticket.purchase_for = ticket[1].purchase_for;
      full_ticket.email = sale[1].email;
      full_ticket.phone = sale[1].phone;
      full_ticket.status = ticket[1].status;
      event.price_levels[id_map[ticket[1].pricing_level_id]].tickets.push(full_ticket);
    });

    Object.entries(sale[1].cancel_set).map(ticket => {
      let full_ticket = {cancelled: true};
      full_ticket.ticket_id = ticket[1].ticket_id;
      full_ticket.purchase_for = ticket[1].purchase_for;
      full_ticket.email = sale[1].email;
      full_ticket.phone = sale[1].phone;
      full_ticket.status = ticket[1].status;
      event.price_levels[id_map[ticket[1].pricing_level_id]].tickets.push(full_ticket);
    });
  });

  return event;
}

const server = http.createServer(requestHandler)

cosmosdb.init()
.catch((err) => {
    console.log("Init failed!", err);
    // close everything somehow
});

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})

