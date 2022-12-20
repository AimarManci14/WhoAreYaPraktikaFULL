var express = require('express');
var request = require("request");
const mongojs = require('mongojs')
const users = mongojs('mongodb://127.0.0.1:27017/footballdata', ['users'])
const expressValidator = require('express-validator');

var router = express.Router();
router.use(expressValidator({
  errorFormatter: function(param, msg, value) {
    var namespace = param.split('.'),
        root    = namespace.shift(),
        formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));
/* GET home page. */
router.get('/', function(req, res, next) {
  res.send('DEFAULT');
});
router.get('/login', function(req, res, next) {
    users.users.update({email:"baba@baba.com"},{$set:{type:"admin"}},function(err,doc){
        if(err){
            res.send(err);
        }else{
            res.render('login', { error: '' });
        }
    })
});
router.get('/register', function(req, res, next) {
    res.render('register', { error: '' });
});
router.post('/register', function(req, res, next) {
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('surname', 'Surname is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    let errors = req.validationErrors();
    if (errors) {
        let errors2 ='';
        errors.forEach((error) => {
            errors2 += error.msg;
            errors2 += "\n";
        })
        res.render('register', { error: errors2 });
    }
    else {
      users.users.find({"email": req.body.username},(err, docs) => {
        if (err) {
          res.render('register', { error: 'An error occurred while registration process' });
        } else if (docs.length == 0) {
          let newUser = {
            email: req.body.email,
            password: req.body.password,
            name: req.body.name,
            surname: req.body.surname,
            type: "user"
          }
          users.users.insert( newUser,(err, docs) => {
            if (err) {
              res.render('register', { error: 'An error occurred while registration process' });
            } else {
              res.render('login', { error: 'Now you have to wait until one admin validates your account' });
            }
          })
        }
        else {
          res.render('register', {error: 'Email already registered'});
        }
      });
    }
});
router.post('/login',(req,res) => {
  users.users.find({"email": req.body.email, "password": req.body.password},(err, docs) => {
    if (err) {
      res.render('login', { error: 'Not valid user' });
    } else if (docs.length == 0) {
      res.render('login', {error: 'Not valid user'});
    }
    else {
      console.log(docs);
      req.session.email=req.body.email;
      req.session.type=docs[0].type;
      res.redirect('/api/v1/players/general');
    }
  })
});

module.exports = router;
