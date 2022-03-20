const express = require('express')
require('mongoose');
const bodyParser = require('body-parser')

const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json());
const mongoose = require('mongoose');
/* This is a mongoose function that connects to the database. */
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let userSchema = new mongoose.Schema({
  username : {type: String, required: true}
})

let exerciseSchema = new mongoose.Schema({
  description: {type:String}, 
  duration: {type:Number}, 
  date: {type:String},
  id: {type:String}
})

let User = mongoose.model('User', userSchema)
let Exercise = mongoose.model('Exercise', exerciseSchema)

/* This is a function that creates a new user in the database. */
app.post('/api/users', (req, res) => {
  const data = req.body.username;
  const user = new User({username: data})

  user.save((err, usr) => {
    if(err) {
      console.error("error: " + err);
    } else {
      res.json({
        username: usr.username,
        _id: usr._id
      })
    }
  })
})

/* This is a function that finds all the users in the database and returns the users. */
app.get('/api/users', (req, res) => {
   const filter = {}
   User.find(filter, (err,usrs) => {
     if(!usrs) {
       res.json({data: "No data"})
     } else {
       res.json(usrs)
     }
   })

})

/* The function is used to add a new exercise to the database. */
app.post('/api/users/:_id/exercises', (req,res) => {

  let curDate = new Date();
  let date = "";
  curDate = curDate.toDateString();

  let keys = Object.keys(req.body);
  let id = req.body[keys[0]];
  let desc = req.body[keys[1]];
  let duration = parseInt(req.body[keys[2]]);

  
  if(req.body[keys[3]] == "") {
    date = curDate;
  } else {
    date = new Date(req.body[keys[3]].replace(/-/g, '\/')).toDateString();
  }

  /* A function that returns the data of the user. */
  User.findById(id, (err,data)=> {
      if(!data) {
        res.send("Uknown user!")
      } else {
        const exercise = new Exercise(  {id:id, description: desc, duration: duration, date:date} )
        const username = data.username
        exercise.save( (err, data) => {
          if(err) {
            console.error(err)
          } else {
            console.log(data.date)
            res.json({
              _id:data.id,
              username: username,
              date: data.date,
              duration: data.duration,
              description: data.description
            })
          }
        })
      }
  })

})
/* Get specific user's logs */
app.get('/api/users/:_id/logs', (req, res) => {
    let id = req.params._id;
    let from = req.query.from;
    let to = req.query.to;
    let limit = req.query.limit;

    console.log("Data: " + from + " " + to + " " + limit);

    /* A function that finds the user by id and returns the user. If the user is not found, it will
    return an error. If the user is found, it will return the user. */
    User.findById(id, (err, user) => {
        if(err) {
          res.send("Unknown user!")
        } else if(!user) {
          res.send("No data!")
        }
        else {
          username = user.username;
          /* This is a function that finds the exercises by id and returns the exercises. If the exercises are
          not found, it will
          return an error. If the exercises are found, it will return the exercises. */
          Exercise.find({id},{ date: {$gte: new Date(from), $lte: new Date(to)} })
          .select(["id", "description", "duration",  "date"]).limit(+limit).exec( (err, data) => {
            const size = Object.keys(data).length
            if(!data) {
              res.json({
                _id: id,
                username : username,
                count : size,
                log: []})
              } else {
                  res.json({
                    _id: id,
                    username : username,
                    count : size,
                    log: data})
            }
          })
        }
    })
}) 



/* This is a function that listens to the port 3000. If the port is not specified, it will listen to
port 3000. */
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
