const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
//process.env.MLAB_URI || 

mongoose.connect("mongodb+srv://znha:0plMhOslt7rgvPUM@cluster0.gw1av.mongodb.net/exerciseTracers?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('error', err => {
  console.log(err);
});
mongoose.connection.once('open', () => {
  console.log('connection is good');
});
app.use(cors())

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
var { Schema } = mongoose;
var UserSchema = new Schema({
  username: String,
})
var UserModel = mongoose.model('User', UserSchema);
var ExerciseSchema = new Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date
});
var ExerciseModel = mongoose.model('Exercise', ExerciseSchema);
app.post('/api/exercise/new-user', async function (req, res) {
  var newUser = req.body.username;
  var user = new UserModel({
    username: newUser
  });
  await user.save().then((data) => {
    res.json(data);
  }).catch((err) => {
    res.json(err);
  });

});
app.get('/api/exercise/users', async function (req, res) {
  var result = await UserModel.find({}).exec();
  res.json(result);
})
app.post('/api/exercise/add', async function (req, res) {
  var exercise = new ExerciseModel({
    userId: req.body.userId,
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: req.body.date ? Date.parse(req.body.date) : Date.now()
  });
  await exercise.save().then(async (data) => {
    var user = await UserModel.find({ _id: req.body.userId }).exec();
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };

    var myData = { "username": user[0].username, "description": data.description, "duration": data.duration, "date": data.date.toLocaleDateString('en-US', options).replace(/,/g, ''), "_id": user[0]._id }
    res.json(myData);
  }).catch((err) => {
    res.json(err);
  });

});

app.get('/api/exercise/log', async function (req, res) {
  var from = req.query.from ? Date.parse(req.query.from) : Date.parse('1970-01-01');
  var to = req.query.to ? Date.parse(req.query.to) : Date.now();
  var limit = req.query.limit ? parseInt(req.query.limit) : 0;
  var result = {};
  var log = [];
  const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };

  if (limit) {
    result = await ExerciseModel.find({ userId: req.query.userId }).limit(limit).select().exec();

    log = result.map((item) => {
      return { "description": item.description, "duration": item.duration, "date": item.date.toLocaleDateString('en-US', options).replace(/,/g, '') };
    });


  } else {

    result = await ExerciseModel.find({ userId: req.query.userId, date: { $gt: from, $lt: to } }).exec();
    log = result.map((item) => {
      return { "description": item.description, "duration": item.duration, "date": item.date.toLocaleDateString('en-US', options).replace(/,/g, '') };
    });
  }
  var user = await UserModel.find({ _id: req.query.userId }).exec();
  var final = { "_id": user[0]._id, "username": user[0].username, "count": log.length, "log": log }
  res.json(final);
});
// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: 'not found' })
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
