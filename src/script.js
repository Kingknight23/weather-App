document.getElementById('weatherForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = new FormData(event.target);

    const weatherData = {
      city: formData.get('city'),
      temperature: formData.get('temperature'),
      conditions: formData.get('conditions')
    };

    // Assuming you have a function to send the data to your server or API
    sendWeatherData(weatherData);
  });

  function sendWeatherData(data) {
    // Replace this with actual code to send data to your server or API
    console.log('Sending weather data:', data);

    // You can use fetch or another method to send the data to your backend
    fetch('/submit-weather', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(result => {
      console.log('Success:', result);
      // Clear the form after successful submission
      document.getElementById('weatherForm').reset();
    })
    .catch(error => console.error('Error:', error));
  }


function searchCity() {
    // Get the user's input from the search bar
    const city = document.getElementById('citySearch').value;

    location.href

}

