const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const {Schema} = mongoose
require('dotenv').config()

// Middleware
app.use(cors())

app.use(express.urlencoded({extended: true}))

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Models and Schemas 
const userSchema = new Schema({
  username: String
})

const user = mongoose.model('users', userSchema)

const exerciseSchema = new Schema({
  username: String,
  description: String,
  duration: Number,
  date: String,
  userid: String
})

const exercise = mongoose.model('exercises', exerciseSchema)

// connection to Mongo
mongoose.connect(process.env.MONGO_URI)

//Routes
app.get('/api/users', async (req, res) => {
  try {
    const allUsers = await user.find().select({_id: 1, username: 1})
    res.status(200).json(allUsers)
  } catch (err) {
    console.log(err)
    throw err
  }  
})

app.post('/api/users', async (req, res) => {
  const name = req.body.username;
  const newUser = {
    username: name
  }
  try {
    const userExists = await user.findOne({username: name}, {__v: 0})
    if(userExists){
      res.status(302).json(userExists)
    }
    else{
      const createUser = await user.create(newUser)
      res.status(201).json({username: createUser.username, _id: createUser._id})
    }
  } catch (err) {
    console.log(err)
    throw err
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id
  const {description, duration, date} = req.body
  try {
    const userInfo = await user.findById(id)
    if(!userInfo){
      res.status(404).json({message: "User not found"})
    }
    else{
      newExercise = {
        username: userInfo.username,
        description: description,
        duration: duration,
        date: date ? new Date(date) : new Date(),
        userid: userInfo._id
      } 
      const userExercise = await exercise.create(newExercise)
      res.status(201).json({
        username: userInfo.username,
        description: userExercise.description,
        duration: userExercise.duration,
        date: new Date(userExercise.date).toDateString(),
        _id: userInfo._id
      })
    }
  } catch (err) {
    console.log(err)
    throw err
  }
})

app.get("/api/users/:_id/logs", async (req, res) => {
  const userid = req.params._id
  const {from, to, limit} = req.query
  try{
    let filter = {
      userid: userid
      // ,
      // date: {$in: [new Date(from), new Date(to)]}
    }
    const userInfo = await user.findById(userid)
    if(!userInfo){
      res.status(404).json({message: "User not found"})
    }
    if(from && to){
      filter.date = {
        $in: [new Date(from), new Date(to)]
      }
    }
    else{
      if(from){
        filter.date = {$gte: new Date(from)}
      }
      else{
        filter.date = {$lte: new Date(from)}
      }
    }
    
    const userExercise = await exercise.find(filter).limit(limit)
    
    const logs = userExercise.map(element => {
      const container = {}
      container.description =  element.description
      container.duration = element.duration
      container.date = new Date(element.date).toDateString()
      return container
    })
    
    res.json({
      username: userInfo.username,
      count: userExercise.length,
      _id: userid,
      log: logs
    })
  } catch(err){
    console.log(err)
    throw err
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
