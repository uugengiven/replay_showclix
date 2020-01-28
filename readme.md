Make the json look like this:

```
{
event: {
  price_levels: [{
      level_id: 123,
      level: "",
      description: "",
      tickets: [
        ticket_set_id,
        ticket_id: 123,
        purchase_for: "",
        email: "",
        phone: "",
        cancelled: false,
        status: 12
      ]
    },...
  }
}
```

Remember to update `.env` as required.

== Customer Requirements

* The system will retrieve all sales for the Replay FX event and the Pinburgh Waitlist Event and the WIPT Waitlist Event
* The system must be able to handle the fact that for WIPT and Pinburgh, the complete list of tickets purchased is split between the Replay FX event and the Waitlist events (i.e. for Pinburgh, you need to compile the list of active tickets from the Replay FX event and the Pinburgh Waitlist event - the same with WIPT )   
* The system will only store tickets for tournaments from each sale - tickets under the Replay FX event for other things will be ignored.  Tickets will be stored in a data store ( see sample output at end of email ).  It will discard any private information ( except for email address )
* Each time the ShowClix sales info is retrieved, it will NOT overwrite existing data.  In the case of new tickets being sold since the last time ShowClix was checked, it will add only those new tickets to the data store.  In the case were tickets which are already in the datastore are cancelled, they will be marked as cancelled in the datastore.  The goal is to eventually be able to add our own data and associate it with individual players.  
* We are assuming that ticket contents will not be changed, so we don't have to worry about dealing with changed ticket contents. 
* The system will not retrieve the the ticket info from ShowClix more than once a minute
* The system will allow tournament directors to use a web page to do one of the following things : view the list of players registered for a given tournament or export a csv with the players from a given tournament
* The system will expose an endpoint which returns a json blob with the following information : the name of registered players and the status of the players ticket (i.e. checked in or not)
* A template for a page will be created which gets the json blob for a given tournament and displays it.  This template will be used on ReplayFX.com to create pages for each tournament (Mark can give more input on what is needed here to make the template happy with the Replay FX site which I think is a wordpress site).
