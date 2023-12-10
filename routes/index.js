const url = require('url')
const fs = require('fs')
const sqlite3 = require('sqlite3').verbose() //verbose provides more detailed stack trace
const db = new sqlite3.Database('data/db_1200iRealSongs')
const city_db = new sqlite3.Database('data/citys')

const API_KEY = 'API KEY Here';


let apiData = {}








//notice navigation to parent directory:
const headerFilePath = __dirname + '/../views/header.html'
const footerFilePath = __dirname + '/../views/footer.html'
const adminFilePath = __dirname + '/../views/admin.html'
const guestFilePath = __dirname + '/../views/guest.html'
const otherFilePath = __dirname + '/../views/other.html'

auth = false;

// db.serialize(function() {
//   //make sure a couple of users exist in the database.
//   //user: ldnel password: secret
//   //user: frank password: secret2
//   let sqlString = "CREATE TABLE IF NOT EXISTS users (userid TEXT PRIMARY KEY, password TEXT)"
//   db.run(sqlString)
//   sqlString = "INSERT OR REPLACE INTO users VALUES ('ldnel', 'secret')"
//   db.run(sqlString)
//   sqlString = "INSERT OR REPLACE INTO users VALUES ('frank', 'secret2')"
//   db.run(sqlString)
// })



exports.authenticate = function(request, response, next) {
  /*
	Middleware to do BASIC http 401 authentication
	*/
  let auth = request.headers.authorization
  //let login = request.headers.login

  // auth is a base64 representation of (username:password)
  //so we will need to decode the base64
  if (!auth) {
    //note here the setHeader must be before the writeHead
    response.setHeader('WWW-Authenticate', 'Basic realm="need to login"')
    response.writeHead(401, {
      'Content-Type': 'text/html'
    })
    console.log('No authorization found, send 401.')
    response.end();
  } else {
    console.log("Authorization Header: " + auth)
    //decode authorization header
    // Split on a space, the original auth
    //looks like  "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part
    var tmp = auth.split(' ')

    // create a buffer and tell it the data coming in is base64
    var buf = Buffer.from(tmp[1], 'base64');

    // read it back out as a string
    //should look like 'ldnel:secret'
    var plain_auth = buf.toString()
    console.log("Decoded Authorization ", plain_auth)

    //extract the userid and password as separate strings
    var credentials = plain_auth.split(':') // split on a ':'
    var username = credentials[0]
    var password = credentials[1]
    console.log("User: ", username)
    console.log("Password: ", password)

    let authorized = false
    var retrieved_user_role = "guest"
    //check database users table for user

    db.all("SELECT userid , password,role FROM users", function(err, rows) {
      if (err) {
        handleError(response,err);
        return
        }
      for (const row of rows) {
        // Your code inside the loop remains the same
        if (row.userid == username && row.password == password) {
          authorized = true;
          retrieved_user_role = row.role;
        }
      }
      if (authorized == false) {
        //we had an authorization header by the user:password is not valid
        response.setHeader('WWW-Authenticate', 'Basic realm="need to login"')
        response.writeHead(401, {
          'Content-Type': 'text/html'
        })
        console.log('No authorization found, send 401.')
        response.end()

        

        //db.run(`INSERT INTO users VALUES ('${username}', '${password}' , '${retrieved_user_role}');`)
       
        // authorized == true;
        // request.user_role = retrieved_user_role;
      } else
        request.user_role = retrieved_user_role;
        next()
    })
  }

  //notice no call to next()

}

function handleError(response, err) {
  //report file reading error to console and client
  console.log('ERROR: ' + JSON.stringify(err))
  //respond with not found 404 to client
  response.writeHead(404)
  response.end(JSON.stringify(err))
}




async function fetchDataFromApi(city) {
 
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error.message);
    throw error;
  }
}


function send_city_data(request, response, rows) {
  /*
  This code assembles the response from two partial .html files
  with the data placed between the two parts
  This CLUMSY approach is done here to motivivate the need for
  template rendering. Here we use basic node.js file reading to
  simulate placing data within a file.
  */
  //notice navigation to parent directory:
  fs.readFile(headerFilePath, function(err, data) {
    if (err) {
      handleError(response, err);
      return;
    }
    response.writeHead(200, {
      'Content-Type': 'text/html'
    })
    response.write(data)

    //INSERT DATA
    for (let row of rows) {
      response.write(`<p class="options"><a href= 'city/${row.city_ascii}'>${row.province_id} ${row.city}</a></p>`);
    }

    fs.readFile(footerFilePath, function(err, data) {
      if (err) {
        handleError(response, err);
        return;
      }
      response.write(data)
      response.end()
    })
  })
}



function send_city_details(request, response, rows) {
  /*
  This code assembles the response from two partial .html files
  with the data placed between the two parts
  This CLUMSY approach is done here to motivivate the need for
  template rendering. Here we use basic node.js file reading to
  simulate placing data within a file.
  */
  //notice navigation to parent directory:

  const cityToSearch = rows[0].city;

  fetchDataFromApi(cityToSearch)
      .then((data) => {
        // console.log('Weather data:');
        //weatherRes = apiData["weather"][0];
        apiData = {...data};
        // console.log(data)
        // console.table(data["weather"][0])
        // You can handle or process the retrieved data here


        fs.readFile(otherFilePath, function(err, data) {
          if (err) {
            handleError(response, err);
            return;
          }
          response.writeHead(200, {
            'Content-Type': 'text/html'
          })
          response.write(data)
      
          //INSERT DATA response.write(`<main>`)
          response.write(`<main>`)
          response.write(`<section>`)
          let city;
          for (let row of rows) {
            console.log(row)
            response.write(`<h1>City: ${row.city}</h1>`)
            city = row.city;
            response.write(`<h2>City Details</h2>`)
            response.write(`<h3>Province: <span>${row.province_id}</span> </h3>`)
            response.write(`<h3> Time-Zone: <span> ${row.timezone} </span></h3>`)
            response.write(`<h3>Population: <span> ${row.population} </span> people</h3>`)
            response.write(`<h3>Density: <span>${row.density} pp/km&#178; </span></h3>`)

            let list = row.postal.split(' ');
            let list_six = list.slice(0, 6).join(' ');
            response.write(`<h3>Postal : <span>${list_six} </span></h3>`)
            response.write(`</section>`)
            //response.write(`<p>${row.bars}</p>`)
          }
      
           
            let weatherRes = apiData["weather"][0];
            let main =  apiData["main"];
           
           
            response.write(`<section>`)
              response.write(`<h1>Weather Report</h1>`)
              response.write(`<h3> Main: <span>${weatherRes["main"]} </span></h3>
                              <h3> Description: <span> ${weatherRes["description"]} </span> </h3>`);

              response.write(`<h3>Temperature: <span> ${main["temp"]} </span> </h3> <h3>Feels-Like: <span>${main["feels_like"]} </span></h3>
                              <h3>Minimum Temperature:  <span>${main["temp_min"]}  </span> </h3> <h3> Maximum Temperature: <span> ${main["temp_max"]} </span>  </h3>
                              <h3>Presssure:  <span> ${main["pressure"]}  </span>  </h3>   <h3> humidity: <span>${main["humidity"]} </span> </h3>`);
                              response.write(`</section>`);
                              response.write(`</main>`);
      
          fs.readFile(footerFilePath, function(err, data) {
            if (err) {
              handleError(response, err);
              return;
            }
           
            
            response.write(`<section>`)
            response.write(`<h3> User inputs</h3>`)
            let userinput = [];
            const tableName = 'weather_info';

            // Query to select all entries from the table
            const sorting = `SELECT * FROM ${tableName} ORDER BY timestamp DESC`;

            // Execute the query
            
            console.log("before");
            city_db.all(sorting, (err, rows) => {
              if (err) {
                console.error(err.message);
                return;
              }

              
              // Loop through the rows and log each entry
              
              //console.log(rows);
              rows.forEach((row) => {
                console.log(row["city"]);
                
                if (row["city"] == city){
                  response.write(`<p> Temperature :${row["temperature"]}  Condition: ${row["conditions"]}  Time: ${row["timestamp"]}</p>`);
                  userinput.push(`<p> Temperature :${row["temperature"]}  Condition: ${row["conditions"]}  Time: ${row["timestamp"]}</p>`);
                }
                
              });
             
              // Close the database connection
              db.close();
});
           // console.log(userinput)
           userinput.forEach((user)=> 
           {
            console.log(user);
            response.write(userinput);

           }
           )
            response.write(`</section>`);
            response.write(data)
            response.end()
          })
        })

        
        
      })
      
      .catch((error) => {
        console.error('Error:', error.message);
        // Handle errors or notify the user
      })
}


function send_users(request, response, rows) {
  /*
  This code assembles the response from two partial .html files
  with the data placed between the two parts
  This CLUMSY approach is done here to motivivate the need for
  template rendering. Here we use basic node.js file reading to
  simulate placing data within a file.
  */
 if (request.user_role == 'admin')
 {
  fs.readFile(headerFilePath, function(err, data) {
    if (err) {
      handleError(response, err);
      return;
    }
    response.writeHead(200, {
      'Content-Type': 'text/html'
    })
    response.write(data)

    //INSERT DATA
    response.write(`<section>`);
    for (let row of rows) {
      //console.log(row)
      response.write(`<p>user: ${row.userid} password: ${row.password}</p>`)
    }
    response.write(`</section>`);
    

    fs.readFile(footerFilePath, function(err, data) {
      if (err) {
        handleError(response, err);
        return;
      }
      response.write(data)

      

      response.end()
    })

  // })
  }
  )
  
 } 
 else
 {
  fs.readFile(headerFilePath, function(err, data) {
    if (err) {
      handleError(response, err);
      return;
    }
    response.writeHead(200, {
      'Content-Type': 'text/html'
    })
    response.write(data)

    //INSERT DATA
    
    response.write(`<h1>ERROR: Admin Privileges Required To See Users</h1>`)

    fs.readFile(footerFilePath, function(err, data) {
      if (err) {
        handleError(response, err);
        return;
      }
      response.write(data)
      response.end()
    })
  })
 }
}


exports.index = function(request, response) {
  // index.html
  fs.readFile(headerFilePath, function(err, data) {
    if (err) {
      handleError(response, err);
      return;
    }
    response.writeHead(200, {
      'Content-Type': 'text/html'
    })
    response.write(data)

    //INSERT DATA -no data to insert

    fs.readFile(footerFilePath, function(err, data) {
      if (err) {
        handleError(response, err);
        return;
      }
      response.write(data)
      response.end()
    })
  })
}

function parseURL(request, response) {
  const PARSE_QUERY = true //parseQueryStringIfTrue
  const SLASH_HOST = true //slashDenoteHostIfTrue
  let urlObj = url.parse(request.url, PARSE_QUERY, SLASH_HOST)
  console.log('path:')
  console.log(urlObj.path)
  console.log('query:')
  return urlObj;

}

exports.users = function(request, response) {
  // /send_users
  console.log('USER ROLE: ' + request.user_role);
  db.all("SELECT userid, password FROM users", function(err, rows) {
    send_users(request, response, rows)
  })

}



exports.city = function (request,response){

   let urlObj = parseURL(request, response);
   let sql = "SELECT province_id, city , city_ascii FROM canadacities";


   if (urlObj.query['city']) {
     sql = "SELECT province_id, city FROM songs WHERE city LIKE '%" +
       urlObj.query['city'].replace(/\s+/g, "%") + "%'";
   }
 
   city_db.all(sql, function(err, rows) {
     //console.log('ROWS: ' + typeof rows)
     send_city_data(request, response, rows)
   })
}

exports.cityDetails = function(request, response) {
  // /song/235
  let urlObj = parseURL(request, response)
  let cityID = urlObj.path
  console.log(cityID)
  cityID = cityID.substring(cityID.lastIndexOf("/") + 1, cityID.length)

  cityID = cityID.replace(/%20/g, " ")

  let sql = "SELECT * FROM canadacities WHERE city COLLATE NOCASE = ?";
//console.log(sql);
//console.log("GET CITY DETAILS: " + cityID);

// Assuming you have a SQLite database connection named 'city_db'
city_db.all(sql, [cityID], function(err, rows) {
  if (err) {
    console.error('Error:', err.message);
    // Handle the error appropriately
  } else {
    //console.table(rows[0]);
    // Send the city details or process the rows as needed
    send_city_details(request, response, rows);
  }
});
}

exports.register = function(request, response) {
  if (request.user_role.toLowerCase() == 'admin')
  {
    fs.readFile(adminFilePath, function(err, data)
    {
      if (err) {
        handleError(response, err);
        return;
      }
      response.write(data)
      response.end()
    })
  }

  else
  {
    fs.readFile(guestFilePath, function(err, data)
    {
      if (err) {
        handleError(response, err);
        return;
      }
      response.write(data)
      response.end()
    })
  }
};











