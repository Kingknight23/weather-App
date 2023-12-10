/*
(c) 2022 Louis D. Nel

Basic express server with middleware and
SQLite database.

The server allows client to find
chord progressions of songs in
its SQLite database. The database provided
has chord progressions of some 1200
popular jazz standards.

********************************************************************
Here we do server side rendering WITHOUT a
template engine.
In This example partial HTML files are
"rendered" with data placed in between them:

header.html + data + footer.html
*********************************************************************
*/

const http = require('http')
const express = require('express')
const path = require('path')
const favicon = require('serve-favicon')
const logger = require('morgan')
const fs = require('fs')
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();


const city_db = new sqlite3.Database('data/citys')
const db = new sqlite3.Database('data/db_1200iRealSongs')
//read routes modules
const routes = require('./routes/index')

const  app = express() //create express middleware dispatcher

const PORT = process.env.PORT || 3000

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'hbs'); //use hbs handlebars wrapper

app.locals.pretty = true //to generate pretty view-source code in browser



//some logger middleware functions
function methodLogger(request, response, next){
		   console.log("METHOD LOGGER")
		   console.log("================================")
		   console.log("METHOD: " + request.method)
		   console.log("URL:" + request.url)
		   next(); //call next middleware registered
}
function headerLogger(request, response, next){
		   console.log("HEADER LOGGER:")
		   console.log("Headers:")
           for(k in request.headers) console.log(k)
		   next() //call next middleware registered
}



//register middleware with dispatcher
//ORDER MATTERS HERE
//middleware
app.use(routes.authenticate); //authenticate user
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(methodLogger)
//routes
app.get('/index.html', routes.index)
app.get('/city', routes.city)
app.get('/users', routes.users)
app.get('/city/*', routes.cityDetails)
app.get('/register', routes.register)


// app.post('/submit-weather', (req, res) => {
// 	const { city, temperature, conditions } = req.body;

// 	//console.table(req.body);
  
// 	// Insert data into the database
// 	city_db.run('INSERT INTO weather_info (city, temperature, conditions) VALUES (?, ?, ?)', (city, temperature, conditions), (err) => {
// 	  if (err) {
// 		console.error('Error inserting data into the database:', err);
// 		res.status(500).send('Internal Server Error');
// 	  } else {
// 		console.log('Data inserted successfully');
// 		res.status(200).send('Data inserted successfully');
// 	  }
// 	});
//   });

app.post('/comment', (req, res) => {
	const { city, temperature, conditions } = req.body;
  
	// Insert form data into the database
	const query = 'INSERT INTO weather_info (city, temperature, conditions) VALUES (?, ?, ?)';
	db.run(query, [city, temperature, conditions], function (err) {
	  if (err) {
		return res.status(500).json({ error: 'Internal Server Error' });
	  }
  
	  const insertedId = this.lastID;
	  res.json({ status: 'success', message: 'Weather data submitted successfully', id: insertedId });
	  res.redirect(`/city/${city}`)
	});
  });


  app.post('/addUser', (req, res) => {
	let accountType;
	if(req.body.account){
		accountType = req.body.account;
	}
	else{
		accountType = 'guest';
	}
	
	const name = req.body.name[0];
	const password = req.body.name[1];
  
	// Store data in the database
	db.run('INSERT INTO users (role, userid, password) VALUES (?, ?, ?)', [accountType, name, password], (err) => {
	  if (err) {
		return console.error(err.message);
	  }
	  console.log('User added to the database:', name, password);
	});
  
	// Respond to the client (you can customize this part)
	res.redirect('/city');
	//location.replace('/city')
  });

//start server
app.listen(PORT, err => {
  if(err) console.log(err)
  else {
		console.log(`Server listening on port: ${PORT} CNTL:-C to stop`)
		console.log(`To Test:`)
		console.log('user: Qusai password: sam924  (admin)')
		console.log('user: Louis password: secret  (guest)')
		console.log('http://localhost:3000/index.html')
		console.log('http://localhost:3000/users')
		console.log('http://localhost:3000/citys')
		console.log('http://localhost:3000/city/Ottawa')
	}
})

//Close the database connection on process exit
process.on('exit', () => {
	db.close()
  city_db.close();
  console.log('Database connection closed');
});
