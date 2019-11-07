/***********************

  Load Components!

  Express      - A Node.js Framework
  Body-Parser  - A tool to help use parse the data in a post request
  Pug          - A view engine for dynamically rendering HTML pages
  Pg-Promise   - A database tool to help use connect to our PostgreSQL database

***********************/

const express = require('express'); // Add the express framework has been added
let app = express();

const bodyParser = require('body-parser'); // Add the body-parser tool has been added
app.use(bodyParser.json());              // Add support for JSON encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // Add support for URL encoded bodies

const pug = require('pug'); // Add the 'pug' view engine

//Create Database Connection
const pgp = require('pg-promise')();


/**********************

  Database Connection information

  host: This defines the ip address of the server hosting our database.  We'll be using localhost and run our database on our local machine (i.e. can't be access via the Internet)
  port: This defines what port we can expect to communicate to our database.  We'll use 5432 to talk with PostgreSQL
  database: This is the name of our specific database.  From our previous lab, we created the football_db database, which holds our football data tables
  user: This should be left as postgres, the default user account created when PostgreSQL was installed
  password: This the password for accessing the database.  You'll need to set a password USING THE PSQL TERMINAL THIS IS NOT A PASSWORD FOR POSTGRES USER ACCOUNT IN LINUX!

**********************/
// REMEMBER to chage the password

const dbConfig = {
	host: 'localhost',
	port: 5432,
	database: 'test2',
	user: 'postgres',
	password: ''
};

let db = pgp(dbConfig);

// set the view engine to ejs
app.set('view engine', 'pug');
app.use(express.static(__dirname + '/')); // This line is necessary for us to use relative paths and access our resources directory


// login page
app.get('/login', function(req, res) {
	res.render('pages/login',{
		local_css:"signin.css",
		my_title:"Login Page"
	});
});

app.get('/home', function(req, res) {
	var query = 'select * from favorite_colors;';
	db.any(query)
        .then(function (rows) {
            res.render('pages/home',{
				my_title: "Home Page",
				data: rows,
				color: '',
				color_msg: ''
			})

        })
        .catch(function (err) {
            // display error message in case an error
            console.log('error', err); //if this doesn't work for you replace with console.log
            res.render('pages/home', {
                title: 'Home Page',
                data: '',
                color: '',
                color_msg: ''
            })
        })
});

// color picker for home page
app.get('/home/pick_color', function(req, res) {
	var color_choice = req.query.color_selection;
	var color_options =  'select * from favorite_colors;';
	var color_message = "select color_msg from favorite_colors where hex_value = '" + color_choice + "';";
	db.task('get-everything', task => {
        return task.batch([
            task.any(color_options),
            task.any(color_message)
        ]);
    })
    .then(info => {
    	res.render('pages/home',{
				my_title: "Home Page",
				data: info[0],
				color: color_choice,
				color_msg: info[1][0].color_msg
			})
    })
    .catch(error => {
        // display error message in case an error
            req.flash('error', error);//if this doesn't work for you replace with console.log
            res.render('pages/home', {
                title: 'Home Page',
                data: '',
                color: '',
                color_msg: ''
            })
    });

});

app.post('/home/pick_color', function(req, res) {
	var color_hex = req.body.color_hex;
	var color_name = req.body.color_name;
	var color_message = req.body.color_message;
	var insert_statement = "INSERT INTO favorite_colors(hex_value, name, color_msg) VALUES('" + color_hex + "','" +
							color_name + "','" + color_message +"') ON CONFLICT DO NOTHING;";

	var color_select = 'select * from favorite_colors;';
	db.task('get-everything', task => {
        return task.batch([
            task.any(insert_statement),
            task.any(color_select)
        ]);
    })
    .then(info => {
    	res.render('pages/home',{
				my_title: "Home Page",
				data: info[1],
				color: color_hex,
				color_msg: color_message
			})
    })
    .catch(error => {
        // display error message in case an error
            req.flash('error', error); //if this doesn't work for you replace with console.log
            res.render('pages/home', {
                title: 'Home Page',
                data: '',
                color: '',
                color_msg: ''
            })
    });
});

//team_stats
app.get('/team_stats', function(req, res) {
  var query = 'SELECT * FROM football_games;';
  db.any(query)
     .then(function (rows) {
       var agregate_data = []
       var game_data = [];
       var winLoss = [0, 0]
       for (var i = 0; i < rows.length; i++) {
         var game = {
           "Visitor_name": rows[i].visitor_name,
           "Home_score":rows[i].home_score,
           "Visitor_score":rows[i].visitor_score,
           "Game_date":String(rows[i].game_date),
           "Winner":(rows[i].home_score > rows[i].visitor_score?"CU Boulder":rows[i].visitor_name)
         };
         game_data.push(game);
       }

       for (var i = 0; i < game_data.length; i++) {
         if(game_data[i].Winner == "CU Boulder"){
           winLoss[0] += 1;
         }
         else{
           winLoss[1] += 1;
         }
       }

       agregate_data.push(game_data);
       agregate_data.push(winLoss);

       res.render('pages/team_stats',{
       my_title: "Team Stats",
       data: agregate_data,
     })

     })
     .catch(function (err) {
         // display error message in case an error
         console.log('error', err);
         res.render('pages/team_stats',{
       my_title: "Team Stats",
       data: '',
     })
   })
});

//Player Info
app.get('/player_info', function(req, res) {
  var query = 'SELECT * FROM football_players;';
  db.any(query)
     .then(function (rows) {
       player_data = [];
       for (var i = 0; i < rows.length; i++) {
         var player = {
           "ID":rows[i].id,
           "Name":rows[i].name,
           "Year":rows[i].year,
           "Major":rows[i].major,
           "Passing_yards":rows[i].passing_yards,
           "Rushing_yards":rows[i].rushing_yards,
           "Receiving_yards":rows[i].receiving_yards,
           "Image":rows[i].img_src
         };
         player_data.push(player);
       }
       res.render('pages/player_info',{
       my_title: "Player Info",
       data: player_data,
     })

     })
     .catch(function (err) {
         // display error message in case an error
         console.log('error', err);
         res.render('pages/player_info',{
       my_title: "Player Info",
       data: '',
     })
   })
});

app.get('/player_info/select_player', function(req, res) {
  var url = require('url')
  var choice = url.parse(req.url, true).query.player_choice;
  var query1 = 'SELECT * FROM football_players;';
  var query2 = `SELECT * FROM football_players WHERE id = ${choice};`;
  var query3 = `SELECT count(*) FROM football_players f INNER JOIN football_games g ON f.id = any(g.players) where f.id = ${choice};`;
  db.task('get-everything', task => {
    return task.batch([
        task.any(query1),
        task.any(query2),
        task.any(query3)
    ]);
  })
   .then(data => {
     var allPlayers = data[0];
     var selectedPlayer = data[1][0];
     var gamesPlayed = data[2][0].count;

     var player = { // store data for the selected player
       "ID": selectedPlayer.id,
       "Name":selectedPlayer.name,
       "Year":selectedPlayer.year,
       "Major":selectedPlayer.major,
       "Passing_yards":selectedPlayer.passing_yards,
       "Rushing_yards":selectedPlayer.rushing_yards,
       "Receiving_yards":selectedPlayer.receiving_yards,
       "Image":selectedPlayer.img_src,
       "Games_played": gamesPlayed // used to calculate player stats in pug file
     };

     player_data = []; // store data for all players, used for dropdown
     for (var i = 0; i < allPlayers.length; i++) {
       var p = {
         "ID":allPlayers[i].id,
         "Name":allPlayers[i].name,
         "Year":allPlayers[i].year,
         "Major":allPlayers[i].major,
         "Passing_yards":allPlayers[i].passing_yards,
         "Rushing_yards":allPlayers[i].rushing_yards,
         "Receiving_yards":allPlayers[i].receiving_yards,
         "Image":allPlayers[i].img_src,
         "Selected": player.ID == allPlayers[i].id ? true : false // marks if player is the one selected in dropdown
       };
       player_data.push(p);
     }

     res.render('pages/player_info',{
     my_title: player.Name,
     selectPlayer: player,
     players: player_data,
     })
   })
   .catch(function (err) {
     // display error message in case an error
     console.log('error', err);
     res.render('pages/player_info',{
       my_title: player.Name,
       data: '',
     })
   })
});


// registration page
app.get('/register', function(req, res) {
	res.render('pages/register',{
		my_title:"Registration Page"
	});
});

/*Add your other get/post request handlers below here: */

/*********************************

  		/home - get request (no parameters)
  				This route will make a single query to the favorite_colors table to retrieve all of the rows of colors
  				This data will be passed to the home view (pages/home)

  		/home/pick_color - post request (color_message)
  				This route will be used for reading in a post request from the user which provides the color message for the default color.
  				We'll be "hard-coding" this to only work with the Default Color Button, which will pass in a color of #FFFFFF (white).
  				The parameter, color_message, will tell us what message to display for our default color selection.
  				This route will then render the home page's view (pages/home)

  		/home/pick_color - get request (color)
  				This route will read in a get request which provides the color (in hex) that the user has selected from the home page.
  				Next, it will need to handle multiple postgres queries which will:
  					1. Retrieve all of the color options from the favorite_colors table (same as /home)
  					2. Retrieve the specific color message for the chosen color
  				The results for these combined queries will then be passed to the home view (pages/home)

  		/team_stats - get request (no parameters)
  			This route will require no parameters.  It will require 3 postgres queries which will:
  				1. Retrieve all of the football games in the Fall 2018 Season
  				2. Count the number of winning games in the Fall 2018 Season
  				3. Count the number of lossing games in the Fall 2018 Season
  			The three query results will then be passed onto the team_stats view (pages/team_stats).
  			The team_stats view will display all fo the football games for the season, show who won each game,
  			and show the total number of wins/losses for the season.

  		/player_info - get request (no parameters)
  			This route will handle a single query to the football_players table which will retrieve the id & name for all of the football players.
			  Next it will pass this result to the player_info view (pages/player_info), which will use the ids & names to populate the select tag for a form

************************************/

app.listen(3000);
console.log('3000 is the magic port');
