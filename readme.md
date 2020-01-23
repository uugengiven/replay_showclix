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

Remember to copy `config-example.js` to `config.js` and update the information as appropriate.