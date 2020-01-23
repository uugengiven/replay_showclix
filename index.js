const http = require('http')
const port = 3000
const data = require('./json_data/data.json');
const event = require('./json_data/event.json');

const requestHandler = async (request, response) => {
    console.log(request.url)
    let results = {};
    switch(request.url)
    {
        case "/":
            results = {test: alterData(event, data)}
            break;
        default:
            results = {test: "you hit another url, weirdo"};
            break;
    }
    response.setHeader('Content-Type', 'application/json');
    response.write(JSON.stringify(results));
    response.end()
}

const alterData = (eventinfo, ticketinfo) => {
  let results = {};
  
  Object.entries(eventinfo.price_levels).map(level => {
    let curr_level = {};
    curr_level = {...level[1], tickets: []};
    results[curr_level.level_id] = curr_level;
  })

  Object.entries(ticketinfo).map(sale => {
    Object.entries(sale[1].ticket_set).map(ticket => {
      let full_ticket = {cancelled: false};
      full_ticket.email = sale[1].email;
      full_ticket.purchase_for = ticket[1].purchase_for;
      full_ticket.ticket_id = ticket[1].ticket_id;
      results[ticket[1].pricing_level_id].tickets.push(full_ticket);
    });

    Object.entries(sale[1].cancel_set).map(ticket => {
      let full_ticket = {cancelled: true};
      full_ticket.email = sale[1].email;
      full_ticket.purchase_for = ticket[1].purchase_for;
      full_ticket.ticket_id = ticket[1].ticket_id;
      results[ticket[1].pricing_level_id].tickets.push(full_ticket);
    });
  });

  return results;
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})