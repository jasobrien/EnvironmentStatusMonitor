const chai = require('chai');
const request = require('supertest');
const app = require('../server');
//const sinon = require('sinon');
const myData= require('../routes/data');
const myDashboard = require('../routes/dashboards');
const { response } = require('express');
const expect = chai.expect;
//const myController = require('../controllers/myController'); // your controller function


describe('AAA suite for main pages and routes', () => {
  // let server; 
  // before(function() {
  //   server = app.listen(3000);
  // });

  // after(function() {
  //   server.close();
  // });


    it('should return 200 and summary stats', () => {
      request(app).get('/getSummaryStats/test').expect(200);
    });
  });
  

  it('should return status code 200 and the test schedule info', () => {
    request(app).get('/data/schedule').expect(200);
   
   // expect(response.body).contain("");
    //expect(response.body).toEqual(expectedResponse);
  });


  it('GET environment status dashboard', () => {
    request(app).get('/dashboard')
    .expect(200)
    .expect('Content-Type', /html/);
    //.expect(/Dashboard/, done);
    //expect(response.body).toEqual(expectedResponse);
  //  console.log(response);
  });



  it('GET last 5 days performance chart data webpage', () => { //done
    request(app).get('/dashboard/performance1/test/5')
    .expect(200)
    // .end(function(err, res) {
    //   if (err) return done(err);
    //   if (!res.text.includes('')) {
    //     return done(new Error('Response does not contain "hello world"'));
    //   }
    //   done();
    // });
   // console.log(response);
    //expect(response.body).toEqual(expectedResponse);
  });



  it('GET result keys for test environment', () => { //done
    request(app).get('/histresultskeys/test')
    .expect(200)
    .expect('starwars');
    // .end(function(err, res) {
    //   if (err) return done(err);
    //   if (!res.text.includes('starwars')) {
    //     return done(new Error('Response does not contain "starwars"'));
    //   }
    //   done();
    // });
  //  console.log(response);
    
  });

  it('GET 3 days data from API', () => { //done
    request(app).get('/histresultsdays/test/starwars/3')
    .expect(200)
    // .end(function(err, res) {
    //   if (err) return done(err);
    //   if (!res.text.includes('starwars')) {
    //     return done(new Error('Response does not contain "starwars"'));
    //   }
    //   done();
  //  });
   // console.log(response);
    
  });


  //create test for /testresults