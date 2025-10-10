
async function fetchConfig() {
    try {
      const response = await fetch("/config");
      const data = await response.json();
      console.log(data);
      return data;
    } catch (err) {
      console.log(err);
    }
  }

  async function checkLoggedIn() {
    try {
        const response = await fetch("/check-login");
        const data = await response.json(); 
        return(data);
       } catch (err) {
        console.log(err);
      }
  }

  function setCredentials(data) {
    if (!data.session) {
      document.getElementById('login').hidden = true;
    } else {
      document.getElementById('login').hidden = false;
    }
  }

  // check if session is enabled and enable login /logout menu
  fetchConfig()
    .then((data) => {
      setCredentials(data);
    })
    .catch(function (err) {
      console.log(err);
    });

    checkLoggedIn()
    .then(data => {
        if (data.loggedin) {
            console.log("User is logged in");
            document.getElementById('login').hidden = false;
        } else {
            console.log("User is not logged in");
            document.getElementById('login').hidden = true;
        }
    })
    .catch(function (err) {
        console.log(err);
      });