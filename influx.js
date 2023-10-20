//import {InfluxDBClient, Point} from '@influxdata/influxdb3-client'
const { InfluxDBClient, Point } = require('@influxdata/influxdb3-client');

//async function main() {
    exports.write = async function (testResult,token) {
    const client = new InfluxDBClient({host: 'https://us-east-1-1.aws.cloud2.influxdata.com', token})

    // following code goes here
    let database = `featuremon`

      const point =new Point(testResult.Environment)
                  .tag("key", testResult.key)
                  .intField("TestCount", testResult.TestCount)
                  .intField("failedTestCount",testResult.FailedTestCount)
                  .intField("AvgResponseTime",testResult.AvgResponseTime)

await client.write(point, database)
// separate points by 1 second
.then(() => new Promise(resolve => setTimeout(resolve, 1000)));

console.log("************WRITE TO INFLUX***********");
    client.close()    
}

