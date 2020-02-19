require('dotenv').config();
const fetch = require('node-fetch');
const config = require("./config");
const FormData = require('form-data');
const http = require('http');
const express = require('express');
const cors = require('cors')
const app = express();
const cosmosdb = require('./cosmos.js');
const port = process.env.PORT;
const activeShowsArr = ['5643659','5937954','5643665']
// event = require('./json_data/event.json');
// data = require('./json_data/data.json');
// let event = {};
// let data = {};

app.use(cors());

// Setup express routes
app.get('/showclix', async function (req, res) {
  const showclixAuth = await getShowclixAuth();
  const token = showclixAuth.token;
  
  const replayEvents = await getReplayEvents(token);

  var allReplayEventsArr = Object.entries(replayEvents);
  var thisYearEventsArr = [];

  const testEventStart = "2020-01-01 08:00:00";
  allReplayEventsArr.forEach(([event, info]) => {
    if(info.event_start > testEventStart) {
      thisYearEventsArr.push([event, info]);
    }
  });
    

  // console.log(thisYearEventsArr[0][1]);
  thisYearEventsArr.forEach( async event => {
    // console.log(event[1]);
    const data = await fetchTickets(event[0] , token);
    const results = alterData(event[1], data);
    pushToCosmos(results);
  });
  res.json(thisYearEventsArr);
})

app.get('/levels', async function (req, res) {
  const results = await getPriceLevels();
  res.json(results);
})

app.get('/tickets/:levelId', async function (req, res) {
  const results = await getAllTickets(req.params.levelId);
  res.json(results);
})

app.get('/updatecosmos', function (req, res) {
  const results = alterData(event, data);
  pushToCosmos(results);
  res.send("Updates sent over")
})

app.get('/', function (req, res) {
  res.send("there is nothing here for you")
})

app.get('/deleteAll', function (req, res) {
  cosmosdb.deleteDatabase();
  res.send("all deleted")
})

// const requestHandler = async (request, response) => {
//     console.log(request.url)
//     let results = {};
//     switch(request.url)
//     {
//         case "/updatecosmos":
//             results = alterData(event, data);
//             pushToCosmos(results);
//             break;
//         case "/tickets":
//             results = await getAllTickets("15192616");
//             //console.log(results);
//             break;
//         case "/levels":
//             results = await getPriceLevels();
//             break;
//         default:
//             results = {test: "you hit another url, weirdo"};
//             break;
//     }
//     response.setHeader('Content-Type', 'application/json');
//     response.write(JSON.stringify(results));
//     response.end()
// }

const getReplayEvents = async (token) => {
  const response = await fetch('https://api.showclix.com/Seller/21925/events?follow[]=price_levels', {
    method: 'GET',
    headers: {
      'X-API-Token': token,
    },
  })
  .then((response) => response.json());

  return response;
}

const fetchTickets = async (eventId, token) => {
  const response = await fetch(`https://api.showclix.com/Sale/search?event=${eventId}&start_date=01-01-2019&follow[]=ticket_set&follow[]=cancel_set`, {
    method: 'GET',
    headers: {
      'X-API-Token': token,
    },
  })
  .then((response) => response.json());

  return response;
}

const getShowclixAuth = async () => {
  let formData = new FormData();
  formData.append('email', config.showclixId);
  formData.append('password', config.showclixPW);

  const response = await fetch('https://admin.showclix.com/api/registration', {
    method: 'POST',
    body: formData
  })
  .then((response) => response.json())
  .then((result) => {
    // console.log('Success:', result);
    return result;
  })
  .catch((error) => {
    console.error('Error:', error);
  });

  return response;
}

const pushToCosmos = (data) => {
  data.price_levels.map(pl => {
    pl.event = data.event;
    pl.event_description = data.event_description;
    pl.event_id = data.event_id;
    pl.type = "Price Level";
    cosmosdb.addItem(pl);
  });
}

const getPriceLevels = async () => {
  const query = {
    query: "SELECT p.level, p.description, p.level_id FROM p WHERE p.type='Price Level' AND p.active=true",
  };
  const results = await cosmosdb.queryItems(query);
  return results;
}

const getAllTickets = async (id) => {
  const query = {
    query: "SELECT p.level, p.tickets FROM p WHERE p.level_id=@id",
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
    curr_level.id = curr_level.level_id;
    event.price_levels.push(curr_level);
    id_map[curr_level.level_id] = index;
  })

  Object.entries(ticketinfo).map(sale => {
    Object.entries(sale[1].ticket_set).map(ticket => {
      let full_ticket = fillTicket(sale, ticket, false);
      event.price_levels[id_map[ticket[1].pricing_level_id]].tickets.push(full_ticket);
    });

    Object.entries(sale[1].cancel_set).map(ticket => {
      let full_ticket = fillTicket(sale, ticket, true);
      event.price_levels[id_map[ticket[1].pricing_level_id]].tickets.push(full_ticket);
    });
  });

  event.active = activeShowsArr.includes(event.id);

  if (event.id == '5643659' || event.id == '5937954') {
    console.log(event);
    event.waitlist = true;
  }
  else {
    event.waitlist = false;
  }

  return event;
}

const fillTicket = (sale, ticket, cancel_status) => {

  let fullname = ["null"];
  if(ticket[1].purchase_for != null) {
    fullname = ticket[1].purchase_for;
    fullname = fullname.split(" ");
  }
  else if (sale[1].purchase_for != null) {
    ticket[1].purchase_for = sale[1].purchase_for;
    fullname = sale[1].purchase_for;
    fullname = fullname.split(" ");
  }

  let full_ticket = {cancelled: cancel_status};
  full_ticket.ticket_id = ticket[1].ticket_id;
  full_ticket.purchase_for = ticket[1].purchase_for;
  if(fullname != ["null"]) {
    full_ticket.first_name = fullname[0];
    full_ticket.last_name = fullname[(fullname.length-1)];
    if (full_ticket.last_name.toUpperCase() === "JR" || full_ticket.last_name.toUpperCase() === "SR" || full_ticket.last_name.toUpperCase() === "II" || full_ticket.last_name.toUpperCase() === "III") {
      full_ticket.last_name = fullname[(fullname.length-2)];
    }
  }
  full_ticket.email = sale[1].email;
  full_ticket.phone = sale[1].phone;
  full_ticket.status = ticket[1].status;

  return full_ticket;
}

cosmosdb.init()
.catch((err) => {
    console.log("Init failed!", err);
    // close everything somehow
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
