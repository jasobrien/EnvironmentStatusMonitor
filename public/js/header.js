
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
      // Populate Results dropdown from environments config
      const resultsMenu = document.getElementById('resultsMenu');
      if (resultsMenu && data.environments && data.environments.length) {
        resultsMenu.innerHTML = data.environments.map(env =>
          `<li role="none"><a class="dropdown-item" href="/data/${env.id}results" role="menuitem">${env.displayName || env.name}</a></li>`
        ).join('');
      }
    })
    .catch(function (err) {
      console.log(err);
    });

    // Populate dashboards dropdown dynamically
    fetch('/api/dashboards')
      .then(r => r.json())
      .then(dashboards => {
        const menu = document.getElementById('dashboardsMenu');
        if (!menu || !dashboards.length) return;
        // Insert custom dashboards before the divider
        const divider = menu.querySelector('.dropdown-divider');
        dashboards.filter(d => !d.isDefault).forEach(d => {
          const li = document.createElement('li');
          li.setAttribute('role', 'none');
          const a = document.createElement('a');
          a.className = 'dropdown-item';
          a.setAttribute('role', 'menuitem');
          a.href = '/dashboard/view/' + encodeURIComponent(d.id);
          a.textContent = d.name;
          li.appendChild(a);
          if (divider) menu.insertBefore(li, divider.parentElement);
          else menu.appendChild(li);
        });
      })
      .catch(err => console.log('Failed to load dashboards for nav', err));

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