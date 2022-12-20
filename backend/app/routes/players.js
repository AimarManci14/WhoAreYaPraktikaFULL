var express = require('express');
const mongojs = require('mongojs')
const mongoTeams = mongojs('mongodb://127.0.0.1:27017/footballdata', ['teams'])
const mongoLeagues = mongojs('mongodb://127.0.0.1:27017/footballdata', ['leagues'])
const mongoPlayers = mongojs('mongodb://127.0.0.1:27017/footballdata', ['players'])
const mongoUsers = mongojs('mongodb://127.0.0.1:27017/footballdata', ['users'])

var router = express.Router();
const expressValidator = require('express-validator');
const laLigaTeams = require('../fullLaliga.json');
const bundesligaTeams = require('../fullBundesliga.json');
const premierTeams = require('../fullPremiere.json');
const serieATeams = require('../fullSerieA.json');
const ligue1Teams = require('../fullLigue1.json');
const multer = require('multer')
const path = require('path')
const storage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, '/var/www/html/football/players')
    },
    filename: function (req, file, cb){
        const extension = path.extname(file.originalname).toLowerCase()
        if (extension!='.png'){
            cb(new Error('Only PNG files are accepted'))
        }
    },
    filename: function (req, file, cb) {
        cb(null, `${req.body.id}.png`)
    }
})

const upload = multer({storage: storage})
const players = require("../players.json");
const request = require("request");

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

//API & CRUD operations
router.get('/general', function(req, res, next) {
  if (req.session.email!=null && req.session.type=="admin") {
      mongoPlayers.players.find((err, docs) => {
          if (err) {
              res.send(err);
          } else {
              res.render('viewPlayers', { elements: docs });
          }
      })
  }
  else {
      res.redirect('/login');
  }
})

router.post('/search', function(req, res, next) {
    if (req.session.email!=null && req.session.type=="admin") {
       let nameToSearch = req.body.name;
       mongoPlayers.players.find({}, (err, docs) => {
           if (err){
               console.log(err);
           }
           else {
               let docs2 = [];
               if (nameToSearch=="") {
                   res.redirect('/api/v1/players/general');
               }
               else {
                   docs.forEach(function(doc) {
                       if (doc.name.toLowerCase().includes(nameToSearch.toLowerCase())) {
                           docs2.push(doc);
                       }
                   })
                   res.render('viewPlayers', { elements: docs2 });
               }
           }
       })
    }
    else {
        res.redirect('/login');
    }
})
router.get('/add', function(req, res, next) {
  if (req.session.email!=null && req.session.type=="admin") {
      res.render('addPlayer', {err: ''});
  }
  else {
        res.redirect('/login');
  }
});

router.post('/add', upload.single('image'),function(req, res, next) {
  if (req.session.email!=null && req.session.type=="admin") {
      req.checkBody('name', 'Name is required').notEmpty();
      req.checkBody('id', 'ID is required').notEmpty();
      req.checkBody('birthdate', 'Birthdate is required').notEmpty();
      req.checkBody('nationality', 'Nationality is required').notEmpty();
      req.checkBody('teamId', 'TeamID is required').notEmpty();
      req.checkBody('position', 'Position is required').notEmpty();
      req.checkBody('number', 'Number is required').notEmpty();
      req.checkBody('leagueId', 'LeagueID is required').notEmpty();
      let errors = req.validationErrors();
      if (errors) {
          res.render('addPlayer', {err: 'There are empty fields'});
      } else {
          let errors2 = '';
          //if (players.find(player => player.id === parseInt(req.body.id))) {
          //    errors2 += 'Player with that ID already exists. ';
          //}
          mongoPlayers.players.find({id: parseInt(req.body.id)}, (err, docs) => {
                if (err) {
                    res.send(err);
                }
                else {
                    if (docs.length>0) {
                        errors2 += 'Player with that ID already exists. ';
                    }
                }
          })
          //if (!players.find(player => player.teamId === parseInt(req.body.teamId))) {
          //    errors2 += 'Team with that ID does not exist. ';
          //}
          mongoTeams.teams.findOne({id: parseInt(req.body.teamId)}, (err, doc) => {
              if (err) {
                  res.send(err);
              } else {
                  if (doc == null) {
                      errors2 += 'Team with that ID does not exist. ';
                  }
              }
          })
          //if (!players.find(player => player.leagueId === parseInt(req.body.leagueId))) {
          //    errors2 += 'League with that ID does not exist. ';
          //}
          mongoLeagues.leagues.findOne({"league.id": parseInt(req.body.leagueId)}, (err, doc) => {
              if (err) {
                  res.send(err);
              } else {
                  if (doc === null) {
                      errors2 += 'League with that ID does not exist. ';
                  }
              }
          })
          //if (players.find(player => player.teamId === parseInt(req.body.teamId) && player.number === parseInt(req.body.number))) {
          //    errors2 += 'Player with that number already exists in that team. ';
          //}
          mongoPlayers.players.find({teamId: parseInt(req.body.teamId)}, (err, docs) => {
              if (err) {
                  res.send(err);
              } else {
                  docs.forEach(doc => {
                      if (doc.number === parseInt(req.body.number)) {
                          errors2 += 'Player with that number already exists in that team. ';
                      }
                  })
              }
          })
          setTimeout(function() {
              if (errors2 !== '') {
                  res.render('addPlayer', {err: errors2});
              }
              else {
                  let newPlayer = {
                      id: parseInt(req.body.id),
                      name: req.body.name,
                      birthdate: req.body.birthdate,
                      nationality: req.body.nationality,
                      teamId: parseInt(req.body.teamId),
                      position: req.body.position,
                      number: parseInt(req.body.number),
                      leagueId: parseInt(req.body.leagueId)
                  }
                  mongoPlayers.players.insert(newPlayer, (err)=>{
                      if(err){
                          console.log(err);
                      }
                      console.log("Player "+newPlayer.name+"  inserted");
                  });
                  res.redirect('/api/v1/players/general');
              }
          }, 2000);

      }
  }
  else {
        res.redirect('/login');
  }
});

router.get('/edit/:id', function(req, res, next) {
  if (req.session.email!=null && req.session.type=="admin") {
      let id = req.params.id;
      mongoPlayers.players.findOne({id: parseInt(id)}, (err, doc) => {
          if (err) {
              res.send(err);
          } else {
              console.log(doc);
              res.render('editPlayer', { player: doc, err: '' });
          }
      })
  }
  else {
      res.redirect('/login');
  }
});

router.put('/edit/:id', function(req, res, next) {
    if (req.session.email!=null && req.session.type=="admin") {
        req.checkBody('name', 'Name is required').notEmpty();
        req.checkBody('birthdate', 'Birthdate is required').notEmpty();
        req.checkBody('nationality', 'Nationality is required').notEmpty();
        req.checkBody('teamId', 'TeamID is required').notEmpty();
        req.checkBody('position', 'Position is required').notEmpty();
        req.checkBody('number', 'Number is required').notEmpty();
        req.checkBody('leagueId', 'LeagueID is required').notEmpty();
        console.log({id: parseInt(req.params.id),
            name: req.body.name,
            birthdate: req.body.birthdate,
        nationality: req.body.nationality,
        teamId: parseInt(req.body.teamId),
        position: req.body.position,
        number: parseInt(req.body.number),
        leagueId: parseInt(req.body.leagueId)});
        let errors = req.validationErrors();
        if (errors) {
            mongoPlayers.players.findOne({id: parseInt(req.params.id)}, (err, doc) => {
                if (err) {
                    res.send(err);
                } else {
                    res.render('editPlayer', { player: doc, err: 'There are empty fields' });
                }
            })
        }
        else {
            let errors2 = '';
            //if (!players.find(player => player.teamId === parseInt(req.body.teamId))) {
            //    errors2 += 'Team with that ID does not exist. ';
            //}
            mongoTeams.teams.findOne({id: parseInt(req.body.teamId)}, (err, doc) => {
                if (err) {
                    res.send(err);
                } else {
                    if (doc == null) {
                        errors2 += 'Team with that ID does not exist. ';
                    }
                }
            })
            //if (!players.find(player => player.leagueId === parseInt(req.body.leagueId))) {
            //    errors2 += 'League with that ID does not exist. ';
            //}
            mongoLeagues.leagues.findOne({"league.id": parseInt(req.body.leagueId)}, (err, doc) => {
                if (err) {
                    res.send(err);
                } else {
                    if (doc === null) {
                        errors2 += 'League with that ID does not exist. ';
                    }
                }
            })
            //if (players.find(player => player.teamId === parseInt(req.body.teamId) && player.number === parseInt(req.body.number))) {
              //  errors2 += 'Player with that number already exists in that team. ';
            //}
            mongoPlayers.players.find({teamId: parseInt(req.body.teamId)}, (err, docs) => {
                if (err) {
                    res.send(err);
                } else {
                    docs.forEach(doc => {
                        if (doc.number === parseInt(req.body.number)) {
                            errors2 += 'Player with that number already exists in that team. ';
                        }
                    })
                }
            })
            setTimeout(() => {
                if (errors2 !== '') {
                    mongoPlayers.players.findOne({id: parseInt(req.params.id)}, (err, doc) => {
                        if (err) {
                            res.send(err);
                        } else {
                            res.render('editPlayer', { player: doc, err: errors2 });
                        }
                    })
                }
                else {
                    let newPlayer = {
                        id: parseInt(req.body.id),
                        name: req.body.name,
                        birthdate: req.body.birthdate,
                        nationality: req.body.nationality,
                        teamId: parseInt(req.body.teamId),
                        position: req.body.position,
                        number: parseInt(req.body.number),
                        leagueId: parseInt(req.body.leagueId)
                    }
                    mongoPlayers.players.update({id: parseInt(req.body.id)}, {$set:{
                            name: req.body.name,
                            birthdate: req.body.birthdate,
                            nationality: req.body.nationality,
                            teamId: parseInt(req.body.teamId),
                            position: req.body.position,
                            number: parseInt(req.body.number),
                            leagueId: parseInt(req.body.leagueId)}}, (err)=>{
                        if(err){
                            console.log(err);
                        }
                        console.log("Player "+newPlayer.name+"  updated");
                        res.send('Player updated');
                    })
                    //res.redirect('/api/v1/players/general');

                    //res.send({message: 'ok'});


                }
            },2000);

        }
    }
    else {
        res.redirect('/login');
    }

});
router.post('/edit/:id', upload.single('image'), function(req,res,next){
    if (req.session.email!=null && req.session.type=="admin") {
        setTimeout(function (){
            res.redirect('/api/v1/players/general')
        },2000)
    }
    else {
        res.redirect('/login');
    }

    //res.send('pos mu bien')
})
router.get('/remove/:id', function(req, res, next) {
    if (req.session.email!=null && req.session.type=="admin") {
        let id = req.params.id;
        mongoPlayers.players.remove({id: parseInt(id)}, (err) => {
            if (err) {
                res.send(err);
            } else {
                console.log("Player with id "+id+" removed");
                res.redirect('/api/v1/players/general');
            }
        })
    }
    else {
        res.redirect('/login');
    }
});

router.get('/changeUsers', function(req, res, next) {
    if (req.session.email!=null && req.session.type=="admin") {
        mongoUsers.users.find({}, (err, docs) => {
            if (err) {
                res.send(err);
            } else {
                res.render('changeUsers', { users: docs });
            }
        })
    }
    else {
        res.redirect('/login');
    }

});
router.get('/changeUsers/:email/user', function(req, res, next) {
    if (req.session.email!=null && req.session.type=="admin") {
        let email = req.params.email;
        mongoUsers.users.update({email: email}, {$set:{type:"user"}},(err, doc) => {
          if (err) {
              res.send(err);
          }
            else {
                res.redirect('/api/v1/players/general');
          }
        })
    }
    else {
        res.redirect('/login');
    }
})
router.get('/changeUsers/:email/admin', function(req, res, next) {
    if (req.session.email!=null && req.session.type=="admin") {
        let email = req.params.email;
        mongoUsers.users.update({email: email}, {$set:{type:"admin"}},(err, doc) => {
            if (err) {
                res.send(err);
            }
            else {
                res.redirect('/api/v1/players/general');
            }
        })
    }
    else {
        res.redirect('/login');
    }
})
//GET DATABASE INFO
router.get('/getLaLigaTeams', function(req, res, next) {
  if (req.session.email!=null && req.session.type=="admin") {
      let teamIDs = laLigaTeams.map(team => team.newId);
      teamIDs.forEach(teamID => {
          var options = {
              method: 'GET',
              url: 'https://v3.football.api-sports.io/teams',
              qs: {id: teamID,
                  season: 2022,
                  league: 140},
              headers: {
                  'x-rapidapi-host': 'v3.football.api-sports.io',
                  'x-rapidapi-key': '4d1bac668930e231121a2980d1a049e4'
              }
          };

          request(options, function (error, response, body) {
              if (error) throw new Error(error);

              let newTeam = JSON.parse(body).response[0].team;
              mongoTeams.teams.find({"id":newTeam.id}, (err, docs) => {
                  if (err) {
                      console.log(err);
                  }
                  if (docs.length === 0) {
                      mongoTeams.teams.insert(newTeam, (err)=>{
                          if(err){
                              console.log(err);
                          }
                          console.log("Team "+newTeam.name+" inserted");
                      });
                  }
                  else {
                      console.log("Team "+newTeam.name+" already exists");
                  }
              })


          });
      });
      res.send("Teams added");
  }
  else {
        res.redirect('/login');
  }

});
router.get('/getBundesligaTeams', function(req, res, next) {
    if (req.session.email!=null && req.session.type=="admin") {
        let teamIDs = bundesligaTeams.map(team => team.newId);
        console.log(teamIDs);
        teamIDs.forEach(teamID => {
            var options = {
                method: 'GET',
                url: 'https://v3.football.api-sports.io/teams',
                qs: {id: teamID,
                    season: 2022,
                    league: 78},
                headers: {
                    'x-rapidapi-host': 'v3.football.api-sports.io',
                    'x-rapidapi-key': '4d1bac668930e231121a2980d1a049e4'
                }
            };

            request(options, function (error, response, body) {
                if (error) throw new Error(error);

                let newTeam = JSON.parse(body).response[0].team;
                console.log(newTeam);
                mongoTeams.teams.find({"id":newTeam.id}, (err, docs) => {
                    if (err) {
                        console.log(err);
                    }
                    if (docs.length === 0) {
                        mongoTeams.teams.insert(newTeam, (err)=>{
                            if(err){
                                console.log(err);
                            }
                            console.log("Team "+newTeam.name+" inserted");
                        });
                    }
                    else {
                        console.log("Team "+newTeam.name+" already exists");
                    }
                })


            });
        });
        res.send("Teams added");
    }
    else {
        res.redirect('/login');
    }

});
router.get('/getPremierTeams', function(req, res, next) {
    if (req.session.email!=null && req.session.type=="admin") {
        let teamIDs = premierTeams.map(team => team.newId);
        console.log(teamIDs);
        teamIDs.forEach(teamID => {
            var options = {
                method: 'GET',
                url: 'https://v3.football.api-sports.io/teams',
                qs: {id: teamID,
                    season: 2022,
                    league: 39},
                headers: {
                    'x-rapidapi-host': 'v3.football.api-sports.io',
                    'x-rapidapi-key': '4d1bac668930e231121a2980d1a049e4'
                }
            };

            request(options, function (error, response, body) {
                if (error) throw new Error(error);

                let newTeam = JSON.parse(body).response[0].team;
                console.log(newTeam);
                mongoTeams.teams.find({"id":newTeam.id}, (err, docs) => {
                    if (err) {
                        console.log(err);
                    }
                    if (docs.length === 0) {
                        mongoTeams.teams.insert(newTeam, (err)=>{
                            if(err){
                                console.log(err);
                            }
                            console.log("Team "+newTeam.name+" inserted");
                        });
                    }
                    else {
                        console.log("Team "+newTeam.name+" already exists");
                    }
                })


            });
        });
        res.send("Teams added");
    }
    else {
        res.redirect('/login');
    }

});
router.get('/getSerieATeams', function(req, res, next) {
    if (req.session.email!=null && req.session.type=="admin") {
        let teamIDs = serieATeams.map(team => team.newId);
        console.log(teamIDs);
        teamIDs.forEach(teamID => {
            var options = {
                method: 'GET',
                url: 'https://v3.football.api-sports.io/teams',
                qs: {id: teamID,
                    season: 2022,
                    league: 135},
                headers: {
                    'x-rapidapi-host': 'v3.football.api-sports.io',
                    'x-rapidapi-key': '4d1bac668930e231121a2980d1a049e4'
                }
            };

            request(options, function (error, response, body) {
                if (error) throw new Error(error);

                let newTeam = JSON.parse(body).response[0].team;
                console.log(newTeam);
                mongoTeams.teams.find({"id":newTeam.id}, (err, docs) => {
                    if (err) {
                        console.log(err);
                    }
                    if (docs.length === 0) {
                        mongoTeams.teams.insert(newTeam, (err)=>{
                            if(err){
                                console.log(err);
                            }
                            console.log("Team "+newTeam.name+" inserted");
                        });
                    }
                    else {
                        console.log("Team "+newTeam.name+" already exists");
                    }
                })


            });
        });
        res.send("Teams added");
    }
    else {
        res.redirect('/login');
    }

});
router.get('/getLigue1Teams', function(req, res, next) {
    if (req.session.email!=null && req.session.type=="admin") {
        let teamIDs = ligue1Teams.map(team => team.newId);
        console.log(teamIDs);
        teamIDs.forEach(teamID => {
            var options = {
                method: 'GET',
                url: 'https://v3.football.api-sports.io/teams',
                qs: {id: teamID,
                    season: 2022,
                    league: 61},
                headers: {
                    'x-rapidapi-host': 'v3.football.api-sports.io',
                    'x-rapidapi-key': '4d1bac668930e231121a2980d1a049e4'
                }
            };

            request(options, function (error, response, body) {
                if (error) throw new Error(error);

                let newTeam = JSON.parse(body).response[0].team;
                console.log(newTeam);
                mongoTeams.teams.find({"id":newTeam.id}, (err, docs) => {
                    if (err) {
                        console.log(err);
                    }
                    if (docs.length === 0) {
                        mongoTeams.teams.insert(newTeam, (err)=>{
                            if(err){
                                console.log(err);
                            }
                            console.log("Team "+newTeam.name+" inserted");
                        });
                    }
                    else {
                        console.log("Team "+newTeam.name+" already exists");
                    }
                })


            });
        });
        res.send("Teams added");
    }
    else {
        res.redirect('/login');
    }

});
router.get('/getBig5Leagues', function(req, res, next) {
  if (req.session.email!=null && req.session.type=="admin") {
      let leagueIDs = [140, 61, 135, 39, 78];
      leagueIDs.forEach(leagueID => {
          var options = {
              method: 'GET',
              url: 'https://v3.football.api-sports.io/leagues',
              qs: {id: leagueID,
                  season: 2022
              },
              headers: {
                  'x-rapidapi-host': 'v3.football.api-sports.io',
                  'x-rapidapi-key': '4d1bac668930e231121a2980d1a049e4'
              }
          };

          request(options, function (error, response, body) {
              if (error) throw new Error(error);

              console.log(body);
              let newLeague = JSON.parse(body).response[0].league;
              console.log(newLeague.id);
              let newLeagueFull = JSON.parse(body).response
              mongoLeagues.leagues.find({"league":newLeague}, (err, docs) => {
                  if (err) {
                      console.log(err);
                  }
                  if (docs.length === 0) {
                      mongoLeagues.leagues.insert(newLeagueFull, (err)=>{
                          if(err){
                              console.log(err);
                          }
                          console.log("League "+newLeague.name+" inserted");
                      });
                  }
                  else {
                      console.log("League "+newLeague.name+" already exists");
                  }
              })
          });
      });
      res.send("Leagues added");
  }
  else {
        res.redirect('/login');
  }

})

//RESET PLAYERS DATABASE
router.get('/resetPlayers', function(req, res, next) {
    if (req.session.email!=null && req.session.type=="admin") {
        mongoPlayers.players.remove({}, { multi: true }, function (err, numRemoved) {
            console.log(numRemoved);
        });
        console.log(players.length);
        setTimeout(function(){
            players.forEach(player => {
                mongoPlayers.players.insert(player, (err)=>{
                    if(err){
                        console.log(err);
                    }
                    console.log("Player "+player.name+" inserted");
                });
            })
        }, 1000);
        setTimeout(function(){
            res.redirect('/api/v1/players/general');
        },1000);

    }
    else {
        res.redirect('/login');
    }
})

//LOGIN/REGISTER ABOUT
router.get('/logout',(req,res) => {
    if (req.session.email!=null && req.session.type=="admin") {
        req.session.destroy();
        res.redirect('/login');
    }
    else {
        res.redirect('/login');
    }
});

router.get('/:id', function(req, res, next) {
    if (req.session.email!=null && req.session.type=="admin") {
        mongoPlayers.players.findOne({id: parseInt(req.params.id)}, (err, docs) => {
            if (err) {
                res.send(err);
            }
            else {
                if (docs === null) {
                    res.send("SARTU DA VIEW");
                }
                res.render('playerDetails', { player: docs, image: `https://aimarmanci14.eus/football/players/${parseInt(req.params.id)}.png`});
            }
        })
    }
    else {
        res.redirect('/login');
    }
});

module.exports = router;
