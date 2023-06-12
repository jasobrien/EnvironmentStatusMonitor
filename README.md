# Monitor your feature or application uptime across your envionments using your postman collections.

- Dashboard.html shows doughnut charts with each collection having a segments for 3 environment / regions / apps / features

* Uptime for full history, last 30 days, 14 days, 7 days and 24hrs
* performance.html displays time series graphs with response times for each collection. - excludes failures
* schedule.html shows the your collections.json run file.

# Setup Instructions

Sample tests are running that test different areas of the environmentstatus software. You can delete these and add your own.

1. Add your postman files
   Add postman collections into collections folder
   Add Environment files into environment folder
   Add data files into datafiles folder

2. Click "Edit Schedule" in menu bar to have add your postman collection file names, environment file names and data file names. This is the file that will control what is executed. There are 3 environment areas - Dev, Test & Staging.

3. Delete all the files in the results folder as they will be regenerated on first run.

4. Collections run every 10 minutes by default - change in server.js line 281-283. Use Cron timing or variables from config.

5. Use Ready to deploy API to query for each env and env and feature if you want to check environment availability before deployment. You will get the latest results that you can then use to make deployment decisions.
   /readyToDeploy/{env}
   /readyToDeploy/{env}/{collection name}

6. BETA - Enable a login page and very basic session mgmt by changing session to true in the config (Click Edit Schedule). Login using username : admin password : password or change in the config to other values.

7. Use the Edit Files menu to edit the history files for the different environments to remove outliers that are distoring performance graphs. You can add a reason as well so others will now why the result should not be counted.

# Install dependencies and Run

ensure you have NodeJS installed

- npm install
- node index.js
